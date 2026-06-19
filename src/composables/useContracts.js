import { getContract } from "viem";
import { createBarkxPublicClient, createInjectedWalletClient } from "@/wallet/injectedWallet";
import { BARKX_CONTRACTS } from "@/contracts/barkxPoolConfig";
import {
  BarkXPoolAbi,
  BarkXAbi,
  WVN1Abi,
  VNAbi,
  UniswapV2Router02Abi,
  UniswapV2FactoryAbi,
  UniswapV2PairAbi,
} from "@/abi";

let _publicClient = null;

export function getPublicClient() {
  if (!_publicClient) {
    _publicClient = createBarkxPublicClient();
  }
  return _publicClient;
}

export function getWalletClient() {
  return createInjectedWalletClient();
}

/**
 * Wait for transaction receipt with optimized polling.
 * pollingInterval: 1s (default viem is 4s)
 * timeout: 60s
 */
export function waitForTx(hash) {
  return getPublicClient().waitForTransactionReceipt({
    hash,
    pollingInterval: 1_000,
    timeout: 60_000,
  });
}

/**
 * Fee strategy:
 * do not set gasPrice / maxFeePerGas / maxPriorityFeePerGas in the dApp.
 * Keep this helper as a no-op so existing call sites can spread it safely.
 */
export async function getGasOverrides() {
  return {};
}

/**
 * Write contract with optional gas buffer.
 * Estimates gas on the dApp side and applies a 1.25x buffer before sending.
 * If estimation fails, fall back to wallet-side gas estimation.
 */
export async function writeContractWithGasBuffer(walletClient, params) {
  const client = getPublicClient();
  let gas;
  try {
    const { gas: _providedGas, ...estimateParams } = params;
    const estimated = await client.estimateContractGas(estimateParams);
    gas = (estimated * 125n + 99n) / 100n;
    console.log("[gas]", params.functionName, "estimated:", estimated.toString(), "buffered(1.25x):", gas.toString());
  } catch (e) {
    console.warn("[gas] estimateContractGas failed, using default:", e?.shortMessage || e?.message);
  }
  return walletClient.writeContract({ ...params, ...(gas ? { gas } : {}) });
}

// --- Read-only contract instances ---

export function getPoolContract() {
  return getContract({
    address: BARKX_CONTRACTS.barkXPool,
    abi: BarkXPoolAbi,
    client: getPublicClient(),
  });
}

export function getBarkXContract() {
  return getContract({
    address: BARKX_CONTRACTS.barkX,
    abi: BarkXAbi,
    client: getPublicClient(),
  });
}

export function getUsdtContract() {
  return getContract({
    address: BARKX_CONTRACTS.usdt,
    abi: BarkXAbi, // standard ERC20, same ABI subset
    client: getPublicClient(),
  });
}

export function getLpTokenContract() {
  return getContract({
    address: BARKX_CONTRACTS.lpToken,
    abi: BarkXAbi, // standard ERC20
    client: getPublicClient(),
  });
}

export function getVnContract() {
  return getContract({
    address: BARKX_CONTRACTS.vn,
    abi: VNAbi,
    client: getPublicClient(),
  });
}

export function getWvn1Contract() {
  return getContract({
    address: BARKX_CONTRACTS.wVN1,
    abi: WVN1Abi,
    client: getPublicClient(),
  });
}

export function getRouterContract() {
  return getContract({
    address: BARKX_CONTRACTS.router,
    abi: UniswapV2Router02Abi,
    client: getPublicClient(),
  });
}

export function getFactoryContract() {
  return getContract({
    address: BARKX_CONTRACTS.factory,
    abi: UniswapV2FactoryAbi,
    client: getPublicClient(),
  });
}

export function getPairContract(pairAddress) {
  return getContract({
    address: pairAddress,
    abi: UniswapV2PairAbi,
    client: getPublicClient(),
  });
}

// --- Write contract helper ---
// Returns contract bound to both public + wallet client for write operations

export function getPoolWriteContract() {
  const walletClient = getWalletClient();
  if (!walletClient) return null;
  return getContract({
    address: BARKX_CONTRACTS.barkXPool,
    abi: BarkXPoolAbi,
    client: { public: getPublicClient(), wallet: walletClient },
  });
}

export function getRouterWriteContract() {
  const walletClient = getWalletClient();
  if (!walletClient) return null;
  return getContract({
    address: BARKX_CONTRACTS.router,
    abi: UniswapV2Router02Abi,
    client: { public: getPublicClient(), wallet: walletClient },
  });
}

// --- Uniswap price helpers ---

export async function getPairAddress() {
  const factory = getFactoryContract();
  return factory.read.getPair([BARKX_CONTRACTS.barkX, BARKX_CONTRACTS.usdt]);
}

export async function getPairReserves() {
  try {
    const pairAddress = await getPairAddress();
    if (!pairAddress || pairAddress === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    const pair = getPairContract(pairAddress);
    const [reserves, token0] = await Promise.all([
      pair.read.getReserves(),
      pair.read.token0(),
    ]);
    const reserve0 = Array.isArray(reserves) ? reserves[0] : reserves._reserve0;
    const reserve1 = Array.isArray(reserves) ? reserves[1] : reserves._reserve1;
    const barkxIsToken0 = token0.toLowerCase() === BARKX_CONTRACTS.barkX.toLowerCase();
    return {
      barkxReserve: barkxIsToken0 ? reserve0 : reserve1,
      usdtReserve: barkxIsToken0 ? reserve1 : reserve0,
    };
  } catch (e) {
    console.error("[useContracts] getPairReserves failed:", e);
    return null;
  }
}

export async function getBarkxUsdtPrice() {
  const reserves = await getPairReserves();
  if (!reserves || reserves.barkxReserve === 0n) return 0;
  // BARKX = 18 decimals, USDT = 6 decimals
  // price = (usdtReserve / 1e6) / (barkxReserve / 1e18) = usdtReserve * 1e12 / barkxReserve
  return Number(reserves.usdtReserve * 10n ** 12n) / Number(reserves.barkxReserve);
}

// Re-export addresses for convenience
export const ADDRESSES = BARKX_CONTRACTS;
