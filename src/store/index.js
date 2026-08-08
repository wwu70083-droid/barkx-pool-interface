import { defineStore } from "pinia";

export const useMainStore = defineStore("main", {
  state: () => ({
    account: "",
    appTop: 0,
    appBottom: 0,
    walletConnected: false,
    walletConnecting: false,
    walletInstalled: typeof window !== "undefined" && !!window.ethereum,
    walletStatusChecked: false,
    walletChainId: null,
    walletChainName: "",
    walletIsTargetChain: false,
    walletErrorKey: "",
    walletErrorParams: {},
    walletActionPending: false,
    walletPendingText: "",
    backendRequestPendingCount: 0,
    chainReadPendingCount: 0,
  }),
  getters: {},
  actions: {
    setAccount(payload) {
      this.account = payload;
    },
    setAppTop(payload) {
      this.appTop = payload;
    },
    setAppBottom(payload) {
      this.appBottom = payload;
    },
    setWalletConnecting(payload) {
      this.walletConnecting = payload;
    },
    setWalletInstalled(payload) {
      this.walletInstalled = payload;
      this.walletStatusChecked = true;
    },
    setWalletStatusChecked(payload) {
      this.walletStatusChecked = payload;
    },
    setWalletError(key, params = {}) {
      this.walletErrorKey = key || "";
      this.walletErrorParams = params;
    },
    setWalletPendingState(payload = {}) {
      this.walletActionPending = !!payload.pending;
      this.walletPendingText = payload.text || "";
    },
    clearWalletPendingState() {
      this.walletActionPending = false;
      this.walletPendingText = "";
    },
    startBackendRequestPending() {
      this.backendRequestPendingCount += 1;
    },
    finishBackendRequestPending() {
      this.backendRequestPendingCount = Math.max(0, this.backendRequestPendingCount - 1);
    },
    clearBackendRequestPending() {
      this.backendRequestPendingCount = 0;
    },
    startChainReadPending() {
      this.chainReadPendingCount += 1;
    },
    finishChainReadPending() {
      this.chainReadPendingCount = Math.max(0, this.chainReadPendingCount - 1);
    },
    clearChainReadPending() {
      this.chainReadPendingCount = 0;
    },
    setWalletState(payload = {}) {
      this.account = payload.account ?? "";
      this.walletConnected = !!payload.account;
      this.walletInstalled = payload.installed ?? this.walletInstalled;
      this.walletStatusChecked = payload.installed !== undefined ? true : this.walletStatusChecked;
      this.walletChainId = payload.chainId ?? null;
      this.walletChainName = payload.chainName ?? "";
      this.walletIsTargetChain = payload.isTargetChain ?? false;
    },
    resetWalletState(payload = {}) {
      this.account = "";
      this.walletConnected = false;
      this.walletConnecting = false;
      this.walletChainId = payload.walletChainId ?? null;
      this.walletChainName = payload.walletChainName ?? "";
      this.walletIsTargetChain = false;
      this.walletInstalled = payload.walletInstalled ?? this.walletInstalled;
      this.walletStatusChecked = payload.walletStatusChecked ?? this.walletStatusChecked;
      this.walletActionPending = false;
      this.walletPendingText = "";
      this.backendRequestPendingCount = 0;
      this.chainReadPendingCount = 0;
      this.walletErrorKey = "";
      this.walletErrorParams = {};
    },
  },
});
