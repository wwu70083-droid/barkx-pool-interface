import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useMainStore } from "@/store";
import {
  TARGET_WALLET_CHAIN,
  connectInjectedWallet,
  formatWalletAddress,
  getInjectedWalletState,
  getWalletErrorInfo,
  isInjectedWalletAvailable,
  watchInjectedWalletEvents,
} from "@/wallet/injectedWallet";

const IS_COCO = import.meta.env.VITE_ISCOCO === "1";
const WALLET_SNAPSHOT_STORAGE_KEY = "barkx_wallet_snapshot";
const TRUSTED_COCO_PARENT_ORIGINS = parseTrustedOrigins(
  import.meta.env.VITE_COCO_TRUSTED_PARENT_ORIGINS || "",
);

function readWalletSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(WALLET_SNAPSHOT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.account) {
      return null;
    }

    return {
      account: String(parsed.account || ""),
      installed: parsed.installed !== false,
      chainId: parsed.chainId ?? null,
      chainName: String(parsed.chainName || ""),
      isTargetChain: !!parsed.isTargetChain,
    };
  } catch {
    return null;
  }
}

function persistWalletSnapshot(state) {
  if (typeof window === "undefined") {
    return;
  }

  if (!state?.account) {
    window.localStorage.removeItem(WALLET_SNAPSHOT_STORAGE_KEY);
    return;
  }

  try {
    window.localStorage.setItem(
      WALLET_SNAPSHOT_STORAGE_KEY,
      JSON.stringify({
        account: state.account,
        installed: state.installed !== false,
        chainId: state.chainId ?? null,
        chainName: state.chainName ?? "",
        isTargetChain: !!state.isTargetChain,
      }),
    );
  } catch {
    // Ignore storage write failures and continue with in-memory state.
  }
}

function clearWalletSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(WALLET_SNAPSHOT_STORAGE_KEY);
}

function parseTrustedOrigins(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function getWindowOrigin(targetWindow) {
  try {
    return targetWindow?.location?.origin || "";
  } catch {
    return "";
  }
}

function isTrustedCocoOrigin(origin) {
  if (!origin || origin === "null") {
    return false;
  }

  if (TRUSTED_COCO_PARENT_ORIGINS.size > 0) {
    return TRUSTED_COCO_PARENT_ORIGINS.has(origin);
  }

  return origin === getWindowOrigin(window);
}

function getTrustedCocoProvider() {
  const hostWindow = window.parent?.top || window;
  const hostOrigin = getWindowOrigin(hostWindow);

  if (!isTrustedCocoOrigin(hostOrigin)) {
    throw new Error("UNTRUSTED_COCO_HOST");
  }

  const provider = hostWindow.ethereum;

  if (!provider?.request) {
    throw new Error("INVALID_COCO_PROVIDER");
  }

  return provider;
}

function isCocoTrustError(error) {
  return error?.message === "UNTRUSTED_COCO_HOST" || error?.message === "INVALID_COCO_PROVIDER";
}

async function connectCoco() {
  const client = window.relayx;
  if (!client?.connectCocoPay) {
    throw new Error("relayx connectCocoPay not available");
  }

  const chainList = TARGET_WALLET_CHAIN.id === 421614 ? ["ARB SEPOLIA"] : ["ARBITRUM"];
  const supports = ["TokenPocket"];

  const event = await client.connectCocoPay({
    chainList,
    walletSupports: supports,
  });

  if (event.code !== 200) {
    throw new Error(event.message || "connectCocoPay failed");
  }

  window.ethereum = getTrustedCocoProvider();
  return event.result;
}

export function useWallet() {
  const { t } = useI18n({ useScope: "global" });
  const router = useRouter();
  const store = useMainStore();
  const {
    account,
    walletChainName,
    walletConnected,
    walletConnecting,
    walletInstalled,
    walletStatusChecked,
    walletErrorKey,
    walletErrorParams,
    walletIsTargetChain,
    walletActionPending,
    walletPendingText,
  } = storeToRefs(store);

  const walletInteractionLocked = computed(
    () => walletConnecting.value || walletActionPending.value,
  );

  const walletErrorText = computed(() => {
    if (!walletErrorKey.value) {
      return "";
    }

    if (IS_COCO && walletErrorKey.value === "wallet.errors.noInjected") {
      return t("wallet.errors.generic");
    }

    return t(walletErrorKey.value, walletErrorParams.value);
  });

  const walletDisplayText = computed(() => {
    if (walletConnecting.value) {
      return t("wallet.connecting");
    }

    if (!walletStatusChecked.value) {
      return t("wallet.connect");
    }

    if (!walletInstalled.value) {
      if (IS_COCO) {
        return t("wallet.connect");
      }
      return t("wallet.install");
    }

    if (!walletConnected.value) {
      return t("wallet.connect");
    }

    if (!walletIsTargetChain.value) {
      return t("wallet.switch", { chain: TARGET_WALLET_CHAIN.name });
    }

    return formatWalletAddress(account.value);
  });

  const walletStatusText = computed(() => {
    if (!walletStatusChecked.value) {
      return TARGET_WALLET_CHAIN.name;
    }

    if (!walletInstalled.value) {
      if (IS_COCO) {
        return TARGET_WALLET_CHAIN.name;
      }
      return t("wallet.noInjected");
    }

    if (!walletConnected.value) {
      return TARGET_WALLET_CHAIN.name;
    }

    return walletChainName.value || TARGET_WALLET_CHAIN.name;
  });

  function hydrateWalletStateFromSnapshot() {
    const snapshot = readWalletSnapshot();
    if (!snapshot?.account) {
      return null;
    }

    store.setWalletState(snapshot);
    store.setWalletError("");
    return snapshot;
  }

  async function syncWalletState(options = {}) {
    const cachedSnapshot = (
      options.preserveSnapshotOnMissingProvider ||
      options.preserveSnapshotOnEmptyAccount
    )
      ? readWalletSnapshot()
      : null;
    const state = await getInjectedWalletState({
      waitForProvider: true,
      timeoutMs: options.timeoutMs ?? 5000,
    });

    if (!state.installed && cachedSnapshot?.account && options.preserveSnapshotOnMissingProvider) {
      store.setWalletState(cachedSnapshot);
      store.setWalletError("");
      return cachedSnapshot;
    }

    if (state.installed && !state.account && cachedSnapshot?.account && options.preserveSnapshotOnEmptyAccount) {
      const fallbackState = {
        ...cachedSnapshot,
        installed: state.installed,
        chainId: state.chainId ?? cachedSnapshot.chainId ?? null,
        chainName: state.chainName || cachedSnapshot.chainName || "",
        isTargetChain:
          state.chainId === null || state.chainId === undefined
            ? !!cachedSnapshot.isTargetChain
            : !!state.isTargetChain,
      };

      store.setWalletState(fallbackState);
      store.setWalletError("");
      return fallbackState;
    }

    store.setWalletState(state);

    if (state.account) {
      persistWalletSnapshot(state);
    } else if (state.installed) {
      clearWalletSnapshot();
    }

    if (!state.installed) {
      store.setWalletError("");
      return state;
    }

    if (state.account && !state.isTargetChain) {
      store.setWalletError("wallet.errors.switchNetwork", {
        chain: TARGET_WALLET_CHAIN.name,
      });
      return state;
    }

    store.setWalletError("");
    return state;
  }

  async function connectWallet() {
    if (walletInteractionLocked.value) {
      return null;
    }

    store.setWalletError("");

    try {
      if (IS_COCO) {
        try {
          const cocoResult = await connectCoco();
          console.log("[connectWallet] connectCoco result:", cocoResult);
          store.setAccount("");
          router.push("/");
        } catch (e) {
          if (isCocoTrustError(e)) {
            throw e;
          }
          console.warn("[connectWallet] connectCoco failed, fallback to injected:", e);
        }
      }

      store.setWalletConnecting(true);
      store.setWalletInstalled(isInjectedWalletAvailable());
      const state = await connectInjectedWallet();
      store.setWalletState(state);
      persistWalletSnapshot(state);
      store.setWalletError("");
      return state;
    } catch (error) {
      store.setWalletInstalled(isInjectedWalletAvailable());
      const errorInfo = getWalletErrorInfo(error);
      store.setWalletError(errorInfo.key, errorInfo.params);
      return null;
    } finally {
      store.setWalletConnecting(false);
    }
  }

  async function disconnectWallet() {
    if (walletInteractionLocked.value) {
      return;
    }

    store.resetWalletState({
      walletInstalled: isInjectedWalletAvailable(),
      walletChainName: TARGET_WALLET_CHAIN.name,
      walletChainId: null,
    });
    clearWalletSnapshot();
    store.setWalletError("wallet.disconnectHint");
  }

  function registerWalletListeners() {
    let syncInFlight = null;

    const runSync = async (options = {}) => {
      if (syncInFlight) {
        return syncInFlight;
      }

      syncInFlight = (async () => {
        try {
          await syncWalletState(options);
        } finally {
          syncInFlight = null;
        }
      })();

      return syncInFlight;
    };

    const cleanupInjectedWalletEvents = watchInjectedWalletEvents(async () => {
      try {
        await runSync();
      } catch (error) {
        const errorInfo = getWalletErrorInfo(error);
        store.setWalletError(errorInfo.key, errorInfo.params);
      }
    });

    const handleWindowFocus = () => {
      void runSync();
    };

    const handlePageShow = () => {
      void runSync();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runSync();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleWindowFocus);
      window.addEventListener("pageshow", handlePageShow);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    void runSync();

    return () => {
      cleanupInjectedWalletEvents();

      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleWindowFocus);
        window.removeEventListener("pageshow", handlePageShow);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }

  return {
    account,
    walletChainName,
    walletConnected,
    walletConnecting,
    walletInstalled,
    walletErrorText,
    walletIsTargetChain,
    walletActionPending,
    walletPendingText,
    walletInteractionLocked,
    walletDisplayText,
    walletStatusText,
    targetChain: TARGET_WALLET_CHAIN,
    hydrateWalletStateFromSnapshot,
    syncWalletState,
    connectWallet,
    disconnectWallet,
    registerWalletListeners,
  };
}
