// Direct-to-chain access for the BarkX Orderbook. No backend: every read hits
// the BarkXOrderbook contract via the public client; writes go through the
// shared wallet-client + gas-buffer helpers (same as the pool/incubator pages).

import {
  getPublicClient,
  getWalletClient,
  waitForTx,
  writeContractWithGasBuffer,
  getGasOverrides,
} from "@/composables/useContracts";
import { BarkXOrderbookAbi } from "@/abi";
import { ORDERBOOK_CONFIG } from "@/contracts/orderbookConfig";

const addr = () => ORDERBOOK_CONFIG.orderbook;

function read(functionName, args = []) {
  return getPublicClient().readContract({
    address: addr(),
    abi: BarkXOrderbookAbi,
    functionName,
    args,
  });
}

export function useOrderbook() {
  // ── scalar / aggregate reads ──
  const feeRate = () => read("feeRate");
  const marketDepth = (tier) => read("marketDepth", [tier]);
  const userDepth = (user, tier) => read("userDepth", [user, tier]);
  const totalDeal = (tier) => read("totalDeal", [tier]);
  const globalPendingCount = (tier) => read("globalPendingCount", [tier]);
  const userPendingCount = (user, tier) => read("userPendingCount", [user, tier]);
  const userPurchasesLength = (user) => read("userPurchasesLength", [user]);
  const userSalesLength = (user) => read("userSalesLength", [user]);
  const getOrder = (orderId) => read("getOrder", [orderId]);

  // ── paginated pending reads (cursor) ──
  async function getGlobalPending(tier, cursor, limit) {
    const [rows, nextCursor, hasMore] = await read("getGlobalPending", [tier, cursor, BigInt(limit)]);
    return { rows, nextCursor, hasMore };
  }
  async function getUserPending(user, tier, cursor, limit) {
    const [rows, nextCursor, hasMore] = await read("getUserPending", [user, tier, cursor, BigInt(limit)]);
    return { rows, nextCursor, hasMore };
  }

  // ── paginated history reads (offset, newest-first) ──
  const getUserPurchases = (user, offset, limit) =>
    read("getUserPurchases", [user, BigInt(offset), BigInt(limit)]);
  const getUserSales = (user, offset, limit) =>
    read("getUserSales", [user, BigInt(offset), BigInt(limit)]);

  // ── writes ──
  async function _write(functionName, args) {
    const walletClient = getWalletClient();
    if (!walletClient) throw new Error("Wallet not connected");
    const [acct] = await walletClient.getAddresses();
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: addr(),
      abi: BarkXOrderbookAbi,
      functionName,
      args,
      account: acct,
      ...(await getGasOverrides()),
    });
    return waitForTx(hash);
  }

  const list = (priceTierIndex, amountTierIndex) => _write("list", [priceTierIndex, amountTierIndex]);
  const revoke = (orderIds) => _write("revoke", [orderIds]);
  const purchase = (orderIds) => _write("purchase", [orderIds]);

  return {
    feeRate,
    marketDepth,
    userDepth,
    totalDeal,
    globalPendingCount,
    userPendingCount,
    userPurchasesLength,
    userSalesLength,
    getOrder,
    getGlobalPending,
    getUserPending,
    getUserPurchases,
    getUserSales,
    list,
    revoke,
    purchase,
  };
}
