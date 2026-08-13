import { ref, computed } from "vue";
import { useMainStore } from "@/store";
import { getPublicClient, ADDRESSES } from "@/composables/useContracts";
import { UniswapV2PairAbi, UniswapV2FactoryAbi } from "@/abi";
import { formatUnits } from "viem";
import { truncateFixed } from "@/utils/format";

const BARKX_DECIMALS = 18;
const USDT_DECIMALS = 6;

// Shared singleton state — all components see the same data
const pair = ref(null); // { reserve0, reserve1, token0, barkxIsToken0 }
const pairLoading = ref(false);
const pairAddress = ref("");
const totalSupply = ref(0n);

export function useUniswapV2() {

  async function fetchPair() {
    if (!ADDRESSES.factory || !ADDRESSES.barkX || !ADDRESSES.usdt) return null;

    const store = useMainStore();
    store.startChainReadPending();
    pairLoading.value = true;
    try {
      const client = getPublicClient();

      const addr = await client.readContract({
        address: ADDRESSES.factory,
        abi: UniswapV2FactoryAbi,
        functionName: "getPair",
        args: [ADDRESSES.barkX, ADDRESSES.usdt],
      });

      if (!addr || addr === "0x0000000000000000000000000000000000000000") {
        pair.value = null;
        return null;
      }

      pairAddress.value = addr;

      let reserves, token0, supply;
      try {
        [reserves, token0, supply] = await Promise.all([
          client.readContract({ address: addr, abi: UniswapV2PairAbi, functionName: "getReserves" }),
          client.readContract({ address: addr, abi: UniswapV2PairAbi, functionName: "token0" }),
          client.readContract({ address: addr, abi: UniswapV2PairAbi, functionName: "totalSupply" }),
        ]);
      } catch (e) {
        console.error("[useUniswapV2] getReserves/token0/totalSupply failed:", e);
        pair.value = null;
        return null;
      }

      totalSupply.value = supply;

      const reserve0 = Array.isArray(reserves) ? reserves[0] : reserves._reserve0;
      const reserve1 = Array.isArray(reserves) ? reserves[1] : reserves._reserve1;
      const barkxIsToken0 = token0.toLowerCase() === ADDRESSES.barkX.toLowerCase();

      pair.value = {
        reserve0: BigInt(reserve0),
        reserve1: BigInt(reserve1),
        token0,
        barkxIsToken0,
      };

      return pair.value;
    } catch (e) {
      console.error("[useUniswapV2] fetchPair outer error:", e);
      pair.value = null;
      return null;
    } finally {
      pairLoading.value = false;
      store.finishChainReadPending();
    }
  }

  // --- Reserves ---

  const barkxReserve = computed(() => {
    if (!pair.value) return 0n;
    return pair.value.barkxIsToken0 ? pair.value.reserve0 : pair.value.reserve1;
  });

  const usdtReserve = computed(() => {
    if (!pair.value) return 0n;
    return pair.value.barkxIsToken0 ? pair.value.reserve1 : pair.value.reserve0;
  });

  // --- Price ---

  const barkxPrice = computed(() => {
    if (!pair.value || barkxReserve.value === 0n) return 0;
    // Price = usdtReserve / barkxReserve, adjusted for decimal difference
    // barkxReserve is 18 decimals, usdtReserve is 6 decimals
    // price = (usdtReserve / 10^6) / (barkxReserve / 10^18) = usdtReserve * 10^12 / barkxReserve
    const scaledUsdt = usdtReserve.value * 10n ** 12n;
    return Number(scaledUsdt * 10000n / barkxReserve.value) / 10000;
  });

  // --- Swap quote ---
  // Matches contract: amountOut = amountInWithFee * reserveOut / (reserveIn * 1000 + amountInWithFee)

  function getAmountOut(amountIn, reserveIn, reserveOut) {
    if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
    const amountInWithFee = amountIn * 997n;
    return (amountInWithFee * reserveOut) / (reserveIn * 1000n + amountInWithFee);
  }

  /**
   * Get swap quote.
   * @param {boolean} isBarkxIn - true if input token is BARKX
   * @param {string} amountInRaw - raw amount string (in input token's smallest unit)
   * @returns {{ amountOut: bigint, amountOutFormatted: string, priceImpact: number, executionPrice: number } | null}
   */
  function getSwapQuote(isBarkxIn, amountInRaw) {
    if (!pair.value || !amountInRaw || amountInRaw === "0") return null;
    try {
      const amountIn = BigInt(amountInRaw);
      if (amountIn <= 0n) return null;

      const reserveIn = isBarkxIn ? barkxReserve.value : usdtReserve.value;
      const reserveOut = isBarkxIn ? usdtReserve.value : barkxReserve.value;

      const amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
      if (amountOut <= 0n) return null;

      const outDecimals = isBarkxIn ? USDT_DECIMALS : BARKX_DECIMALS;
      const inDecimals = isBarkxIn ? BARKX_DECIMALS : USDT_DECIMALS;
      const amountOutFormatted = truncateFixed(Number(formatUnits(amountOut, outDecimals)), 2);

      // Mid price (before trade): reserveOut / reserveIn (adjusted for decimals)
      // Execution price: amountOut / amountIn (adjusted for decimals)
      const midPriceNum = (Number(reserveOut) / 10 ** outDecimals) / (Number(reserveIn) / 10 ** inDecimals);
      const execPriceNum = (Number(amountOut) / 10 ** outDecimals) / (Number(amountIn) / 10 ** inDecimals);

      const priceImpact = midPriceNum > 0
        ? Math.abs((midPriceNum - execPriceNum) / midPriceNum) * 100
        : 0;

      return {
        amountOut,
        amountOutFormatted,
        priceImpact,
        executionPrice: execPriceNum,
        inputSymbol: isBarkxIn ? "BARKX" : "USDT",
        outputSymbol: isBarkxIn ? "USDT" : "BARKX",
      };
    } catch {
      return null;
    }
  }

  // --- Add Liquidity LP estimate ---
  // mintedLP = min(amountA * totalSupply / reserveA, amountB * totalSupply / reserveB)

  function estimateAddLiquidityLP(barkxAmountRaw, usdtAmountRaw) {
    if (!pair.value || totalSupply.value === 0n) return "0.000000";
    if (!barkxAmountRaw || !usdtAmountRaw) return "0.000000";

    try {
      const barkxIn = BigInt(barkxAmountRaw);
      const usdtIn = BigInt(usdtAmountRaw);
      if (barkxIn <= 0n || usdtIn <= 0n) return "0.000000";

      const bRes = barkxReserve.value;
      const uRes = usdtReserve.value;
      if (bRes === 0n || uRes === 0n) return "0.000000";

      const lpFromBarkx = (barkxIn * totalSupply.value) / bRes;
      const lpFromUsdt = (usdtIn * totalSupply.value) / uRes;
      const minted = lpFromBarkx < lpFromUsdt ? lpFromBarkx : lpFromUsdt;

      const num = Number(formatUnits(minted, 18));
      return truncateFixed(num, 6);
    } catch {
      return "0.000000";
    }
  }

  // --- Remove Liquidity estimate ---
  // amountA = liquidity * reserveA / totalSupply

  function estimateRemoveLiquidity(lpAmountRaw) {
    if (!pair.value || totalSupply.value === 0n) return { barkx: "0.00", usdt: "0.00" };
    if (!lpAmountRaw) return { barkx: "0.00", usdt: "0.00" };

    try {
      const lp = BigInt(lpAmountRaw);
      if (lp <= 0n) return { barkx: "0.00", usdt: "0.00" };

      const bOut = (lp * barkxReserve.value) / totalSupply.value;
      const uOut = (lp * usdtReserve.value) / totalSupply.value;

      return {
        barkx: truncateFixed(Number(formatUnits(bOut, BARKX_DECIMALS)), 2),
        usdt: truncateFixed(Number(formatUnits(uOut, USDT_DECIMALS)), 2),
      };
    } catch {
      return { barkx: "0.00", usdt: "0.00" };
    }
  }

  // --- Share of pool ---

  function calcShareOfPool(barkxAmountRaw) {
    if (!pair.value || totalSupply.value === 0n) return "0.00%";
    if (!barkxAmountRaw) return "0.00%";

    try {
      const barkxIn = BigInt(barkxAmountRaw);
      if (barkxIn <= 0n) return "0.00%";

      const bRes = barkxReserve.value;
      if (bRes === 0n) return "100.00%";

      const lpMinted = (barkxIn * totalSupply.value) / bRes;
      const newTotal = totalSupply.value + lpMinted;
      const share = Number((lpMinted * 10000n) / newTotal) / 100;
      return `${truncateFixed(share, 2)}%`;
    } catch {
      return "0.00%";
    }
  }

  // --- Quote add amount (proportional liquidity) ---
  // amountB = amountA * reserveB / reserveA

  function quoteAddAmount(amountARaw, isABarkx) {
    if (!pair.value) return "0";
    try {
      const amountA = BigInt(amountARaw);
      if (amountA <= 0n) return "0";

      const resA = isABarkx ? barkxReserve.value : usdtReserve.value;
      const resB = isABarkx ? usdtReserve.value : barkxReserve.value;
      if (resA === 0n) return "0";

      const amountB = (amountA * resB) / resA;
      const decimalsB = isABarkx ? USDT_DECIMALS : BARKX_DECIMALS;
      return truncateFixed(Number(formatUnits(amountB, decimalsB)), 2);
    } catch {
      return "0";
    }
  }

  return {
    pair,
    pairAddress,
    pairLoading,
    totalSupply,
    barkxPrice,
    barkxReserve,
    usdtReserve,
    fetchPair,
    getSwapQuote,
    getAmountOut,
    estimateAddLiquidityLP,
    estimateRemoveLiquidity,
    calcShareOfPool,
    quoteAddAmount,
  };
}
