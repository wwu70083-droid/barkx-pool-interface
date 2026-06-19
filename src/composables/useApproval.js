import { maxUint256 } from "viem";
import { getPublicClient, getWalletClient, getGasOverrides, waitForTx, ADDRESSES } from "@/composables/useContracts";
import { BarkXAbi, WVN1Abi, VNAbi, WVN2Abi, VLPAbi, VBARKXAbi } from "@/abi";
import { useMainStore } from "@/store";
import { useI18n } from "vue-i18n";

export function useApproval() {
  const store = useMainStore();
  const { t } = useI18n({ useScope: "global" });

  /**
   * Check ERC20 allowance and approve if insufficient.
   * @param {string} tokenAddress - ERC20 token contract address
   * @param {Array} tokenAbi - ABI of the token (must have allowance + approve)
   * @param {string} spender - address that needs the allowance
   * @param {bigint} amount - required minimum allowance
   * @param {string} tokenLabel - display name like "BARKX" for pending UI
   * @returns {boolean} true if allowance is sufficient (or was successfully approved)
   */
  async function ensureErc20Approval(tokenAddress, tokenAbi, spender, amount, tokenLabel) {
    if (!tokenAddress || !spender) return false;

    const client = getPublicClient();
    const walletClient = getWalletClient();
    if (!walletClient) return false;

    const [account] = await walletClient.getAddresses();

    // Check current allowance
    const currentAllowance = await client.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: "allowance",
      args: [account, spender],
    });

    if (currentAllowance >= amount) return true;

    // Need to approve
    store.setWalletPendingState({
      pending: true,
      text: t("components.approvalActionGroup.approving", { token: tokenLabel }),
    });

    try {
      const gasOverrides = await getGasOverrides();
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: "approve",
        args: [spender, maxUint256],
        account,
        ...gasOverrides,
      });

      await waitForTx(hash);
      return true;
    } finally {
      store.clearWalletPendingState();
    }
  }

  /**
   * Check NFT approval (ERC721 or ERC1155 isApprovedForAll) and set if needed.
   * @param {string} tokenAddress - NFT contract address
   * @param {Array} tokenAbi - ABI (must have isApprovedForAll + setApprovalForAll)
   * @param {string} spender - operator address
   * @param {string} tokenLabel - display name for pending UI
   * @returns {boolean}
   */
  async function ensureNftApproval(tokenAddress, tokenAbi, spender, tokenLabel) {
    if (!tokenAddress || !spender) return false;

    const client = getPublicClient();
    const walletClient = getWalletClient();
    if (!walletClient) return false;

    const [account] = await walletClient.getAddresses();

    const isApproved = await client.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: "isApprovedForAll",
      args: [account, spender],
    });

    if (isApproved) return true;

    store.setWalletPendingState({
      pending: true,
      text: t("components.approvalActionGroup.approving", { token: tokenLabel }),
    });

    try {
      const gasOverrides = await getGasOverrides();
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: "setApprovalForAll",
        args: [spender, true],
        account,
        ...gasOverrides,
      });

      await waitForTx(hash);
      return true;
    } finally {
      store.clearWalletPendingState();
    }
  }

  // --- Read-only checks (no wallet interaction) ---

  async function isErc20Approved(tokenAddress, tokenAbi, spender) {
    if (!tokenAddress || !spender) return false;

    const account = store.account;
    if (!account) return false;

    const client = getPublicClient();
    const allowance = await client.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: "allowance",
      args: [account, spender],
    });

    return allowance > 0n;
  }

  async function isNftApproved(tokenAddress, tokenAbi, spender) {
    if (!tokenAddress || !spender) return false;

    const account = store.account;
    if (!account) return false;

    const client = getPublicClient();
    return client.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: "isApprovedForAll",
      args: [account, spender],
    });
  }

  async function isBarkXApprovedForRouter() {
    return isErc20Approved(ADDRESSES.barkX, BarkXAbi, ADDRESSES.router);
  }

  async function isUsdtApprovedForRouter() {
    return isErc20Approved(ADDRESSES.usdt, BarkXAbi, ADDRESSES.router);
  }

  async function isLpApprovedForRouter() {
    return isErc20Approved(ADDRESSES.lpToken, BarkXAbi, ADDRESSES.router);
  }

  async function isUsdtApprovedForPool() {
    return isErc20Approved(ADDRESSES.usdt, BarkXAbi, ADDRESSES.barkXPool);
  }

  async function isLpApprovedForPool() {
    return isErc20Approved(ADDRESSES.lpToken, BarkXAbi, ADDRESSES.barkXPool);
  }

  async function isVnApprovedForPool() {
    return isNftApproved(ADDRESSES.vn, VNAbi, ADDRESSES.barkXPool);
  }

  async function isWvn1ApprovedForPool() {
    return isNftApproved(ADDRESSES.wVN1, WVN1Abi, ADDRESSES.barkXPool);
  }

  // --- SubPool (VIP Pool) approval checks ---

  async function isVnApprovedForSubPool() {
    return isNftApproved(ADDRESSES.vn, VNAbi, ADDRESSES.subPool);
  }

  async function isWvn1ApprovedForSubPool() {
    return isNftApproved(ADDRESSES.wVN1, WVN1Abi, ADDRESSES.subPool);
  }

  async function isWvn2ApprovedForSubPool() {
    return isNftApproved(ADDRESSES.wVN2, WVN2Abi, ADDRESSES.subPool);
  }

  async function isVlpApprovedForSubPool() {
    return isErc20Approved(ADDRESSES.vLP, VLPAbi, ADDRESSES.subPool);
  }

  // --- Elite Pool approval checks ---

  async function isVnApprovedForElitePool() {
    return isNftApproved(ADDRESSES.vn, VNAbi, ADDRESSES.elitePool);
  }

  async function isVbarkxApprovedForElitePool() {
    return isErc20Approved(ADDRESSES.vBARKX, VBARKXAbi, ADDRESSES.elitePool);
  }

  async function isUsdtApprovedForElitePool() {
    return isErc20Approved(ADDRESSES.usdt, BarkXAbi, ADDRESSES.elitePool);
  }

  // --- Convenience methods for common approval patterns ---

  async function approveBarkXForRouter(amount) {
    return ensureErc20Approval(ADDRESSES.barkX, BarkXAbi, ADDRESSES.router, amount, "BARKX");
  }

  async function approveUsdtForRouter(amount) {
    return ensureErc20Approval(ADDRESSES.usdt, BarkXAbi, ADDRESSES.router, amount, "USDT");
  }

  async function approveLpForRouter(amount) {
    return ensureErc20Approval(ADDRESSES.lpToken, BarkXAbi, ADDRESSES.router, amount, "LP");
  }

  async function approveUsdtForPool(amount) {
    return ensureErc20Approval(ADDRESSES.usdt, BarkXAbi, ADDRESSES.barkXPool, amount, "USDT");
  }

  async function approveLpForPool(amount) {
    return ensureErc20Approval(ADDRESSES.lpToken, BarkXAbi, ADDRESSES.barkXPool, amount, "LP");
  }

  async function approveVnForPool() {
    return ensureNftApproval(ADDRESSES.vn, VNAbi, ADDRESSES.barkXPool, "VN");
  }

  async function approveWvn1ForPool() {
    return ensureNftApproval(ADDRESSES.wVN1, WVN1Abi, ADDRESSES.barkXPool, "wVN");
  }

  // --- SubPool (VIP Pool) approval actions ---

  async function approveVnForSubPool() {
    return ensureNftApproval(ADDRESSES.vn, VNAbi, ADDRESSES.subPool, "VN");
  }

  async function approveWvn1ForSubPool() {
    return ensureNftApproval(ADDRESSES.wVN1, WVN1Abi, ADDRESSES.subPool, "wVN");
  }

  async function approveWvn2ForSubPool() {
    return ensureNftApproval(ADDRESSES.wVN2, WVN2Abi, ADDRESSES.subPool, "wVN2");
  }

  async function approveVlpForSubPool(amount) {
    return ensureErc20Approval(ADDRESSES.vLP, VLPAbi, ADDRESSES.subPool, amount, "vLP");
  }

  // --- Elite Pool approval actions ---

  async function approveVnForElitePool() {
    return ensureNftApproval(ADDRESSES.vn, VNAbi, ADDRESSES.elitePool, "VN");
  }

  async function approveVbarkxForElitePool(amount = maxUint256) {
    return ensureErc20Approval(ADDRESSES.vBARKX, VBARKXAbi, ADDRESSES.elitePool, amount, "vBARKX");
  }

  async function approveUsdtForElitePool(amount = maxUint256) {
    return ensureErc20Approval(ADDRESSES.usdt, BarkXAbi, ADDRESSES.elitePool, amount, "USDT");
  }

  return {
    ensureErc20Approval,
    ensureNftApproval,
    approveBarkXForRouter,
    approveUsdtForRouter,
    approveLpForRouter,
    approveUsdtForPool,
    approveLpForPool,
    approveVnForPool,
    approveWvn1ForPool,
    isBarkXApprovedForRouter,
    isUsdtApprovedForRouter,
    isLpApprovedForRouter,
    isUsdtApprovedForPool,
    isLpApprovedForPool,
    isVnApprovedForPool,
    isWvn1ApprovedForPool,
    // SubPool (VIP Pool)
    isVnApprovedForSubPool,
    isWvn1ApprovedForSubPool,
    isWvn2ApprovedForSubPool,
    isVlpApprovedForSubPool,
    isVnApprovedForElitePool,
    isVbarkxApprovedForElitePool,
    isUsdtApprovedForElitePool,
    approveVnForSubPool,
    approveWvn1ForSubPool,
    approveWvn2ForSubPool,
    approveVlpForSubPool,
    approveVnForElitePool,
    approveVbarkxForElitePool,
    approveUsdtForElitePool,
  };
}
