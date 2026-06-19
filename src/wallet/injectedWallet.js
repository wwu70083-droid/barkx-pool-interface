import {
  createPublicClient,
  createWalletClient,
  custom,
  getAddress,
  http,
  numberToHex,
} from "viem";
import { arbitrum, arbitrumSepolia } from "viem/chains";
import { translate } from "@/i18n";

const env = import.meta.env ?? {};
const isMainnetMode = env.MODE === "production" || env.MODE === "pre";
const defaultTargetChain = isMainnetMode ? arbitrum : arbitrumSepolia;
const knownChains = {
  [arbitrum.id]: arbitrum,
  [arbitrumSepolia.id]: arbitrumSepolia,
};

export const TARGET_WALLET_CHAIN =
  knownChains[Number(env.VITE_BARKX_CHAIN_ID || defaultTargetChain.id)] ||
  defaultTargetChain;

function getProvider() {
  return typeof window !== "undefined" ? window.ethereum ?? null : null;
}

function waitForInjectedProvider(timeoutMs = 1200) {
  const provider = getProvider();

  if (provider || typeof window === "undefined") {
    return Promise.resolve(provider);
  }

  return new Promise((resolve) => {
    const finalize = () => {
      window.clearTimeout(timer);
      window.removeEventListener("ethereum#initialized", handleInitialized);
      resolve(getProvider());
    };

    const handleInitialized = () => {
      finalize();
    };

    const timer = window.setTimeout(() => {
      finalize();
    }, timeoutMs);

    window.addEventListener("ethereum#initialized", handleInitialized, {
      once: true,
    });
  });
}

function normalizeChainId(chainId) {
  if (typeof chainId === "number") {
    return chainId;
  }

  if (typeof chainId === "string") {
    return chainId.startsWith("0x") ? Number.parseInt(chainId, 16) : Number(chainId);
  }

  return null;
}

function getChainName(chainId) {
  if (!chainId) {
    return "";
  }

  if (chainId === arbitrum.id) {
    return arbitrum.name;
  }

  if (chainId === arbitrumSepolia.id) {
    return arbitrumSepolia.name;
  }

  return `${translate("wallet.unknownNetwork")} ${chainId}`;
}

export function isInjectedWalletAvailable() {
  return !!getProvider();
}

export function formatWalletAddress(address) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function createInjectedWalletClient() {
  const provider = getProvider();

  if (!provider) {
    return null;
  }

  return createWalletClient({
    chain: TARGET_WALLET_CHAIN,
    transport: custom(provider),
  });
}

export function createBarkxPublicClient() {
  return createPublicClient({
    chain: TARGET_WALLET_CHAIN,
    transport: http(),
  });
}

function getAddChainParams(chain) {
  return {
    chainId: numberToHex(chain.id),
    chainName: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: chain.rpcUrls.default.http,
    blockExplorerUrls: chain.blockExplorers?.default?.url
      ? [chain.blockExplorers.default.url]
      : [],
  };
}

export async function ensureTargetWalletChain() {
  const provider = getProvider();

  if (!provider) {
    throw new Error("NO_INJECTED_WALLET");
  }

  const currentChainId = normalizeChainId(
    await provider.request({ method: "eth_chainId" }),
  );

  if (currentChainId === TARGET_WALLET_CHAIN.id) {
    return TARGET_WALLET_CHAIN;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: numberToHex(TARGET_WALLET_CHAIN.id) }],
    });
  } catch (error) {
    if (error?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [getAddChainParams(TARGET_WALLET_CHAIN)],
      });
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: numberToHex(TARGET_WALLET_CHAIN.id) }],
      });
      return TARGET_WALLET_CHAIN;
    }

    throw error;
  }

  return TARGET_WALLET_CHAIN;
}

export async function getInjectedWalletState(options = {}) {
  const provider =
    getProvider() ||
    (options.waitForProvider ? await waitForInjectedProvider(options.timeoutMs) : null);

  if (!provider) {
    return {
      installed: false,
      account: "",
      shortAccount: "",
      chainId: null,
      chainName: "",
      isTargetChain: false,
      targetChainId: TARGET_WALLET_CHAIN.id,
      targetChainName: TARGET_WALLET_CHAIN.name,
    };
  }

  const [accounts, chainIdValue] = await Promise.all([
    provider.request({ method: "eth_accounts" }),
    provider.request({ method: "eth_chainId" }),
  ]);

  const account = accounts?.[0] ? getAddress(accounts[0]) : "";
  const chainId = normalizeChainId(chainIdValue);

  return {
    installed: true,
    account,
    shortAccount: formatWalletAddress(account),
    chainId,
    chainName: getChainName(chainId),
    isTargetChain: chainId === TARGET_WALLET_CHAIN.id,
    targetChainId: TARGET_WALLET_CHAIN.id,
    targetChainName: TARGET_WALLET_CHAIN.name,
  };
}

export async function connectInjectedWallet() {
  const provider = getProvider();

  if (!provider) {
    throw new Error("NO_INJECTED_WALLET");
  }

  const accounts = await provider.request({ method: "eth_requestAccounts" });

  if (!accounts?.length) {
    throw new Error("NO_WALLET_ACCOUNT");
  }

  await ensureTargetWalletChain();

  return getInjectedWalletState();
}

export function watchInjectedWalletEvents(onChange) {
  let provider = null;
  let pollTimer = null;

  function cleanupProviderListeners() {
    if (!provider?.removeListener) {
      return;
    }

    provider.removeListener("accountsChanged", handleAccountsChanged);
    provider.removeListener("chainChanged", handleChainChanged);
    provider.removeListener("disconnect", handleDisconnect);
  }

  function bindProvider(nextProvider) {
    if (!nextProvider?.on || provider === nextProvider) {
      return false;
    }

    cleanupProviderListeners();
    provider = nextProvider;
    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    provider.on("disconnect", handleDisconnect);
    return true;
  }

  function clearProviderPollTimer() {
    if (pollTimer !== null) {
      window.clearTimeout(pollTimer);
      pollTimer = null;
    }
  }

  function scheduleProviderPoll(attempt = 0) {
    clearProviderPollTimer();

    if (bindProvider(getProvider())) {
      onChange();
      return;
    }

    if (typeof window === "undefined" || attempt >= 20) {
      return;
    }

    pollTimer = window.setTimeout(() => {
      scheduleProviderPoll(attempt + 1);
    }, 500);
  }

  const handleAccountsChanged = () => {
    onChange();
  };

  const handleChainChanged = () => {
    onChange();
  };

  const handleDisconnect = () => {
    onChange();
  };

  const handleInitialized = () => {
    scheduleProviderPoll();
  };

  if (!bindProvider(getProvider()) && typeof window !== "undefined") {
    window.addEventListener("ethereum#initialized", handleInitialized);
    scheduleProviderPoll();
  }

  return () => {
    clearProviderPollTimer();
    if (typeof window !== "undefined") {
      window.removeEventListener("ethereum#initialized", handleInitialized);
    }
    cleanupProviderListeners();
  };
}

export function getWalletErrorInfo(error) {
  if (!error) {
    return { key: "wallet.errors.generic" };
  }

  if (error.message === "NO_INJECTED_WALLET") {
    return { key: "wallet.errors.noInjected" };
  }

  if (error.message === "NO_WALLET_ACCOUNT") {
    return { key: "wallet.errors.noAccount" };
  }

  if (error.message === "UNTRUSTED_COCO_HOST" || error.message === "INVALID_COCO_PROVIDER") {
    return { key: "wallet.errors.untrustedHost" };
  }

  if (error.code === 4001) {
    return { key: "wallet.errors.rejected" };
  }

  if (error.code === 4902) {
    return {
      key: "wallet.errors.addChain",
      params: { chain: TARGET_WALLET_CHAIN.name },
    };
  }

  return { key: "wallet.errors.generic" };
}
