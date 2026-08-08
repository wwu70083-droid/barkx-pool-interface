<template>
  <PendingCornerNotice
    :show="pendingNoticeVisible"
    :text="pendingNoticeText"
  />
  <div v-if="activeNotice" class="notice-backdrop" @click="clearNotice"></div>
  <BarkxPoolNotice v-if="activeNotice" :message="activeNotice" />
  <router-view />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import PendingCornerNotice from "@/components/mining/PendingCornerNotice.vue";
import BarkxPoolNotice from "@/components/mining/BarkxPoolNotice.vue";
import { useMainStore } from "@/store";
import { useNotice } from "@/composables/useNotice";
import { useLocale } from "@/composables/useLocale";
import { useWallet } from "@/composables/useWallet";
import { initService, IS_COCO } from "@/composables/useRelayService";
import { initLocaleFromCoco } from "@/i18n";
import router from "@/router";

const store = useMainStore();
const { activeNotice, clearNotice } = useNotice();
const { setAppBottom, setAppTop } = store;
const { walletActionPending, walletPendingText, walletConnected, walletIsTargetChain, walletStatusChecked, backendRequestPendingCount, chainReadPendingCount } = storeToRefs(store);
const route = useRoute();
const { t, setLocale } = useLocale();
const { hydrateWalletStateFromSnapshot, syncWalletState, registerWalletListeners, connectWallet } = useWallet();
const BACKEND_LOADING_DELAY_MS = 300;
const showBackendLoading = ref(false);
let cleanupWalletListeners = () => {};
let backendLoadingTimer = null;

const globalLoadingPendingCount = computed(() => backendRequestPendingCount.value + chainReadPendingCount.value);
const defaultPendingText = computed(() => t("components.pendingNotice.default"));
const pendingNoticeVisible = computed(() => walletActionPending.value || showBackendLoading.value);
const pendingNoticeText = computed(() => {
  if (walletActionPending.value) {
    return walletPendingText.value || defaultPendingText.value;
  }

  return defaultPendingText.value;
});

function clearBackendLoadingTimer() {
  if (backendLoadingTimer !== null) {
    window.clearTimeout(backendLoadingTimer);
    backendLoadingTimer = null;
  }
}

onMounted(async () => {
  getTopBottom();
  hydrateWalletStateFromSnapshot();
  const shouldAutoConnectCoco = IS_COCO && !sessionStorage.getItem("barkx_wallet_connected");

  if (shouldAutoConnectCoco) {
    sessionStorage.setItem("barkx_wallet_connected", "1");
    console.log("[App] COCO auto connect wallet");
    void connectWallet();
  }

  const initServicePromise = initService(store).catch((error) => {
    console.warn("[App] initService failed:", error);
    return false;
  });
  const cocoLocale = await initLocaleFromCoco();
  if (cocoLocale) {
    setLocale(cocoLocale);
  }
  await initServicePromise;

  if (!shouldAutoConnectCoco) {
    try {
      await syncWalletState({
        timeoutMs: IS_COCO ? 1200 : 5000,
        preserveSnapshotOnMissingProvider: true,
        preserveSnapshotOnEmptyAccount: true,
      });
    } catch (error) {
      console.warn("[App] syncWalletState failed:", error);
      store.setWalletStatusChecked(true);
    }
  }
  cleanupWalletListeners = registerWalletListeners();
});

onBeforeUnmount(() => {
  clearBackendLoadingTimer();
  cleanupWalletListeners();
});

watch(
  globalLoadingPendingCount,
  (count) => {
    clearBackendLoadingTimer();

    if (count > 0) {
      backendLoadingTimer = window.setTimeout(() => {
        showBackendLoading.value = globalLoadingPendingCount.value > 0;
        backendLoadingTimer = null;
      }, BACKEND_LOADING_DELAY_MS);
      return;
    }

    showBackendLoading.value = false;
  },
  { immediate: true },
);

watch(
  () => [route.path, walletConnected.value, walletIsTargetChain.value, walletStatusChecked.value],
  ([path, connected, isTargetChain, statusChecked]) => {
    if (!statusChecked) {
      return;
    }

    if (connected && isTargetChain) {
      return;
    }

    if (path === "/dashboard" || path === "/settings" || path === "/") {
      return;
    }

    router.replace("/dashboard");
  },
  { immediate: true },
);

async function getTopBottom() {
  const client = window.relayx;

  if (!client?.getSafeAreaInsets) {
    setAppTop(0);
    setAppBottom(0);
    return;
  }

  try {
    const res = await client.getSafeAreaInsets();

    if (res?.code === 200) {
      setAppTop(res.result?.safeAreaTop ?? 0);
      setAppBottom(res.result?.safeAreaBottom ?? 0);
      return;
    }
  } catch {
    // Fall through to the default zero-safe-area values below.
  }

  setAppTop(0);
  setAppBottom(0);
}
</script>

<style scoped>
.notice-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1140;
}
</style>
