import { ref, computed } from "vue";
import { useMainStore } from "@/store";
import { getPublicClient, ADDRESSES, getBarkxUsdtPrice, getPairReserves } from "@/composables/useContracts";
import { BarkXPoolAbi } from "@/abi";
import { hasPauseFlag, BARKX_POOL_PAUSE_FLAGS } from "@/contracts/barkxPoolSchema";

// Singleton state — shared across all components
const loading = ref(false);
const userInfo = ref({ vnStaked: 0n, stakedLP: 0n, totalClaimed: 0n });
const lpPerVN = ref(0n);
const lpMin = ref(0n);
const barkXPerVN = ref(0n);
const directTaxBps = ref(0n);
const reinvestTaxBps = ref(0n);
const lockModeA = ref(0n);
const lockModeB = ref(0n);
const lockModeC = ref(0n);
const globalPauseFlags = ref(0);
const userPauseFlags = ref(0);
const nonce = ref(0n);
const barkxPrice = ref(0);
const pairReserves = ref(null);

const modeABuckets = ref([]);
const modeBVNBuckets = ref([]);
const modeBLPBuckets = ref([]);
const modeCBuckets = ref([]);

// Computed (singleton)
const lpCap = computed(() => userInfo.value.vnStaked * lpPerVN.value);
const lpCapUnused = computed(() => {
  const cap = lpCap.value;
  const staked = userInfo.value.stakedLP;
  return cap > staked ? cap - staked : 0n;
});

const isPausedDepositVN = computed(() => hasPauseFlag(globalPauseFlags.value | userPauseFlags.value, BARKX_POOL_PAUSE_FLAGS.DEPOSIT_VN));
const isPausedDepositWVN1 = computed(() => hasPauseFlag(globalPauseFlags.value | userPauseFlags.value, BARKX_POOL_PAUSE_FLAGS.DEPOSIT_WVN1));
const isPausedDepositLP = computed(() => hasPauseFlag(globalPauseFlags.value | userPauseFlags.value, BARKX_POOL_PAUSE_FLAGS.DEPOSIT_LP));
const isPausedWithdrawWVN1 = computed(() => hasPauseFlag(globalPauseFlags.value | userPauseFlags.value, BARKX_POOL_PAUSE_FLAGS.WITHDRAW_WVN1));
const isPausedWithdrawLP = computed(() => hasPauseFlag(globalPauseFlags.value | userPauseFlags.value, BARKX_POOL_PAUSE_FLAGS.WITHDRAW_LP));
const isPausedClaim = computed(() => hasPauseFlag(globalPauseFlags.value | userPauseFlags.value, BARKX_POOL_PAUSE_FLAGS.CLAIM_BARKX));

export function usePoolData() {

  async function fetchPoolConfig() {
    const client = getPublicClient();
    const poolAddress = ADDRESSES.barkXPool;

    const results = await client.multicall({
      contracts: [
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "lpPerVN" },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "lpMin" },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "barkXPerVN" },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "directTaxBps" },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "reinvestTaxBps" },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "globalPauseFlags" },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "LOCK_MODE_A" },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "LOCK_MODE_B" },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "LOCK_MODE_C" },
      ],
    });

    lpPerVN.value = results[0].result ?? 0n;
    lpMin.value = results[1].result ?? 0n;
    barkXPerVN.value = results[2].result ?? 0n;
    directTaxBps.value = results[3].result ?? 0n;
    reinvestTaxBps.value = results[4].result ?? 0n;
    globalPauseFlags.value = Number(results[5].result ?? 0);
    lockModeA.value = results[6].result ?? 0n;
    lockModeB.value = results[7].result ?? 0n;
    lockModeC.value = results[8].result ?? 0n;
  }

  async function fetchUserData(userAddress) {
    if (!userAddress) return;
    const client = getPublicClient();
    const poolAddress = ADDRESSES.barkXPool;

    const results = await client.multicall({
      contracts: [
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "userInfo", args: [userAddress] },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "userPauseFlags", args: [userAddress] },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "nonces", args: [userAddress] },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "modeABucketCount", args: [userAddress] },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "modeBVNBucketCount", args: [userAddress] },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "modeBLPBucketCount", args: [userAddress] },
        { address: poolAddress, abi: BarkXPoolAbi, functionName: "modeCBucketCount", args: [userAddress] },
      ],
    });

    const info = results[0].result;
    if (info) {
      userInfo.value = {
        vnStaked: info.vnStaked ?? info[0] ?? 0n,
        stakedLP: info.stakedLP ?? info[1] ?? 0n,
        totalClaimed: info.totalClaimed ?? info[2] ?? 0n,
      };
    }
    userPauseFlags.value = Number(results[1].result ?? 0);
    nonce.value = results[2].result ?? 0n;

    // Fetch buckets
    const bucketCounts = {
      modeA: Number(results[3].result ?? 0n),
      modeBVN: Number(results[4].result ?? 0n),
      modeBLP: Number(results[5].result ?? 0n),
      modeC: Number(results[6].result ?? 0n),
    };
    console.log("[usePoolData] bucketCounts:", bucketCounts);

    await fetchAllBuckets(userAddress, bucketCounts);
  }

  async function fetchAllBuckets(userAddress, counts) {
    const client = getPublicClient();
    const poolAddress = ADDRESSES.barkXPool;
    const calls = [];
    const bucketMeta = []; // track which bucket type and index

    for (let i = 0; i < counts.modeA; i++) {
      calls.push({ address: poolAddress, abi: BarkXPoolAbi, functionName: "modeABuckets", args: [userAddress, BigInt(i)] });
      bucketMeta.push({ type: "modeA", idx: i });
    }
    for (let i = 0; i < counts.modeBVN; i++) {
      calls.push({ address: poolAddress, abi: BarkXPoolAbi, functionName: "modeBVNBuckets", args: [userAddress, BigInt(i)] });
      bucketMeta.push({ type: "modeBVN", idx: i });
    }
    for (let i = 0; i < counts.modeBLP; i++) {
      calls.push({ address: poolAddress, abi: BarkXPoolAbi, functionName: "modeBLPBuckets", args: [userAddress, BigInt(i)] });
      bucketMeta.push({ type: "modeBLP", idx: i });
    }
    for (let i = 0; i < counts.modeC; i++) {
      calls.push({ address: poolAddress, abi: BarkXPoolAbi, functionName: "modeCBuckets", args: [userAddress, BigInt(i)] });
      bucketMeta.push({ type: "modeC", idx: i });
    }

    if (calls.length === 0) {
      modeABuckets.value = [];
      modeBVNBuckets.value = [];
      modeBLPBuckets.value = [];
      modeCBuckets.value = [];
      return;
    }

    const results = await client.multicall({ contracts: calls });
    console.log("[usePoolData] bucket raw results:", results.map((r, i) => ({ ...bucketMeta[i], result: r.result, error: r.error })));

    const aArr = [];
    const bvnArr = [];
    const blpArr = [];
    const cArr = [];
    const now = BigInt(Math.floor(Date.now() / 1000));
    console.log("[usePoolData] now (unix):", now.toString(), "= ", new Date(Number(now) * 1000).toISOString());

    results.forEach((r, i) => {
      const meta = bucketMeta[i];
      const data = r.result;
      if (!data) return;

      if (meta.type === "modeA") {
        // Returns (lpAmount, unlocksAt) — vnTokenIds skipped by Solidity
        // After withdraw: lpAmount=0 but unlocksAt stays. Use lpAmount to detect empty.
        const lp = data.lpAmount ?? data[0] ?? 0n;
        const unlocksAt = BigInt(data.unlocksAt ?? data[1] ?? 0n);
        const isEmpty = lp === 0n;
        const isUnlocked = !isEmpty && unlocksAt > 0n && now >= unlocksAt;
        if (!isEmpty) aArr.push({ idx: meta.idx, lpAmount: lp, unlocksAt, isUnlocked });
      } else if (meta.type === "modeBVN") {
        // Returns (unlocksAt) only — tokenIds skipped by Solidity
        // After withdraw: unlocksAt stays. Use userInfo.vnStaked from parent to detect.
        // We can't tell if individual bucket is empty from unlocksAt alone,
        // so we include all and let the parent filter by vnStaked count.
        const unlocksAt = BigInt(data.unlocksAt ?? (typeof data === "bigint" ? data : data[0]) ?? 0n);
        const isUnlocked = unlocksAt > 0n && now >= unlocksAt;
        bvnArr.push({ idx: meta.idx, unlocksAt, isUnlocked });
      } else if (meta.type === "modeBLP") {
        console.log(`[bucket modeBLP #${meta.idx}] raw:`, data, "type:", typeof data);
        const lp = data.lpAmount ?? data[0] ?? 0n;
        const unlocksAt = BigInt(data.unlocksAt ?? data[1] ?? 0n);
        const isEmpty = lp === 0n;
        const isUnlocked = !isEmpty && unlocksAt > 0n && now >= unlocksAt;
        console.log(`[bucket modeBLP #${meta.idx}]`, { lp: lp.toString(), unlocksAt: unlocksAt.toString(), now: now.toString(), isEmpty, isUnlocked });
        if (!isEmpty) blpArr.push({ idx: meta.idx, lpAmount: lp, unlocksAt, isUnlocked });
      } else if (meta.type === "modeC") {
        const lp = data.lpAmount ?? data[0] ?? 0n;
        const unlocksAt = BigInt(data.unlocksAt ?? data[1] ?? 0n);
        const isEmpty = lp === 0n;
        const isUnlocked = !isEmpty && unlocksAt > 0n && now >= unlocksAt;
        if (!isEmpty) cArr.push({ idx: meta.idx, lpAmount: lp, unlocksAt, isUnlocked });
      }
    });

    modeABuckets.value = aArr;
    modeBVNBuckets.value = bvnArr;
    modeBLPBuckets.value = blpArr;
    modeCBuckets.value = cArr;
  }

  async function fetchPrice() {
    try {
      const [price, reserves] = await Promise.all([
        getBarkxUsdtPrice(),
        getPairReserves(),
      ]);
      barkxPrice.value = price;
      pairReserves.value = reserves;
    } catch {
      barkxPrice.value = 0;
      pairReserves.value = null;
    }
  }

  async function fetchAll(userAddress) {
    const store = useMainStore();
    store.startChainReadPending();
    loading.value = true;
    try {
      await Promise.all([
        fetchPoolConfig(),
        fetchPrice(),
        userAddress ? fetchUserData(userAddress) : Promise.resolve(),
      ]);
    } finally {
      loading.value = false;
      store.finishChainReadPending();
    }
  }

  return {
    loading,
    userInfo,
    lpPerVN,
    lpMin,
    barkXPerVN,
    directTaxBps,
    reinvestTaxBps,
    lockModeA,
    lockModeB,
    lockModeC,
    globalPauseFlags,
    userPauseFlags,
    nonce,
    barkxPrice,
    pairReserves,
    modeABuckets,
    modeBVNBuckets,
    modeBLPBuckets,
    modeCBuckets,
    lpCap,
    lpCapUnused,
    isPausedDepositVN,
    isPausedDepositWVN1,
    isPausedDepositLP,
    isPausedWithdrawWVN1,
    isPausedWithdrawLP,
    isPausedClaim,
    fetchPoolConfig,
    fetchUserData,
    fetchPrice,
    fetchAll,
  };
}
