import { computed, ref } from "vue";
import { useMainStore } from "@/store";
import { getPublicClient, ADDRESSES } from "@/composables/useContracts";
import { BarkXElitePoolAbi, BarkXAbi, VNAbi, VBARKXAbi } from "@/abi";
import { ELITE_POOL_PAUSE_FLAGS, hasElitePauseFlag } from "@/contracts/elitePoolSchema";

const EMPTY_USER_INFO = Object.freeze({
  vnStaked: 0n,
  stakedLP: 0n,
  totalClaimed: 0n,
});

const loading = ref(false);
const userInfo = ref({ ...EMPTY_USER_INFO });
const lpPerVN = ref(0n);
const lockPeriod = ref(0n);
const minDeposit = ref(0n);
const globalPauseFlags = ref(0);
const userPauseFlags = ref(0);
const nonce = ref(0n);

const vnBalance = ref(0n);
const vBarkxBalance = ref(0n);
const usdtBalance = ref(0n);

const vnBuckets = ref([]);
const lpBuckets = ref([]);

const lpCap = computed(() => userInfo.value.vnStaked * lpPerVN.value);
const lpCapUnused = computed(() => {
  const cap = lpCap.value;
  const staked = userInfo.value.stakedLP;
  return cap > staked ? cap - staked : 0n;
});
const mergedPauseFlags = computed(() => globalPauseFlags.value | userPauseFlags.value);
const isPausedDepositVN = computed(() => hasElitePauseFlag(mergedPauseFlags.value, ELITE_POOL_PAUSE_FLAGS.DEPOSIT_VN));
const isPausedDepositLP = computed(() => hasElitePauseFlag(mergedPauseFlags.value, ELITE_POOL_PAUSE_FLAGS.DEPOSIT_LP));
const isPausedWithdrawVN = computed(() => hasElitePauseFlag(mergedPauseFlags.value, ELITE_POOL_PAUSE_FLAGS.WITHDRAW_VN));
const isPausedWithdrawLP = computed(() => hasElitePauseFlag(mergedPauseFlags.value, ELITE_POOL_PAUSE_FLAGS.WITHDRAW_LP));
const isPausedClaim = computed(() => hasElitePauseFlag(mergedPauseFlags.value, ELITE_POOL_PAUSE_FLAGS.CLAIM_BARKX));

function reset() {
  userInfo.value = { ...EMPTY_USER_INFO };
  lpPerVN.value = 0n;
  lockPeriod.value = 0n;
  minDeposit.value = 0n;
  globalPauseFlags.value = 0;
  userPauseFlags.value = 0;
  nonce.value = 0n;
  vnBalance.value = 0n;
  vBarkxBalance.value = 0n;
  usdtBalance.value = 0n;
  vnBuckets.value = [];
  lpBuckets.value = [];
}

async function fetchPoolConfig() {
  const client = getPublicClient();
  const poolAddress = ADDRESSES.elitePool;

  const results = await client.multicall({
    contracts: [
      { address: poolAddress, abi: BarkXElitePoolAbi, functionName: "lpPerVN" },
      { address: poolAddress, abi: BarkXElitePoolAbi, functionName: "LOCK_PERIOD" },
      { address: poolAddress, abi: BarkXElitePoolAbi, functionName: "minDeposit" },
      { address: poolAddress, abi: BarkXElitePoolAbi, functionName: "globalPauseFlags" },
    ],
  });

  lpPerVN.value = results[0].result ?? 0n;
  lockPeriod.value = results[1].result ?? 0n;
  minDeposit.value = results[2].result ?? 0n;
  globalPauseFlags.value = Number(results[3].result ?? 0);
}

async function fetchUserData(userAddress) {
  if (!userAddress) {
    reset();
    return;
  }

  const client = getPublicClient();
  const poolAddress = ADDRESSES.elitePool;

  const results = await client.multicall({
    contracts: [
      { address: poolAddress, abi: BarkXElitePoolAbi, functionName: "userInfo", args: [userAddress] },
      { address: poolAddress, abi: BarkXElitePoolAbi, functionName: "userPauseFlags", args: [userAddress] },
      { address: poolAddress, abi: BarkXElitePoolAbi, functionName: "nonces", args: [userAddress] },
      { address: poolAddress, abi: BarkXElitePoolAbi, functionName: "vnBucketCount", args: [userAddress] },
      { address: poolAddress, abi: BarkXElitePoolAbi, functionName: "lpBucketCount", args: [userAddress] },
      { address: ADDRESSES.vn, abi: VNAbi, functionName: "balanceOf", args: [userAddress, 1n] },
      { address: ADDRESSES.vBARKX, abi: VBARKXAbi, functionName: "balanceOf", args: [userAddress] },
      { address: ADDRESSES.usdt, abi: BarkXAbi, functionName: "balanceOf", args: [userAddress] },
    ],
  });

  const info = results[0].result;
  userInfo.value = {
    vnStaked: info?.vnStaked ?? info?.[0] ?? 0n,
    stakedLP: info?.stakedLP ?? info?.[1] ?? 0n,
    totalClaimed: info?.totalClaimed ?? info?.[2] ?? 0n,
  };
  userPauseFlags.value = Number(results[1].result ?? 0);
  nonce.value = results[2].result ?? 0n;

  const vnBucketCount = Number(results[3].result ?? 0n);
  const lpBucketCount = Number(results[4].result ?? 0n);

  vnBalance.value = results[5].result ?? 0n;
  vBarkxBalance.value = results[6].result ?? 0n;
  usdtBalance.value = results[7].result ?? 0n;

  await fetchAllBuckets(userAddress, vnBucketCount, lpBucketCount);
}

async function fetchAllBuckets(userAddress, vnCount, lpCount) {
  const poolAddress = ADDRESSES.elitePool;
  if (!userAddress || !poolAddress) {
    vnBuckets.value = [];
    lpBuckets.value = [];
    return;
  }

  const client = getPublicClient();
  const calls = [];
  const meta = [];

  for (let i = 0; i < vnCount; i += 1) {
    calls.push({
      address: poolAddress,
      abi: BarkXElitePoolAbi,
      functionName: "vnBuckets",
      args: [userAddress, BigInt(i)],
    });
    meta.push({ type: "vn", idx: i });
  }

  for (let i = 0; i < lpCount; i += 1) {
    calls.push({
      address: poolAddress,
      abi: BarkXElitePoolAbi,
      functionName: "lpBuckets",
      args: [userAddress, BigInt(i)],
    });
    meta.push({ type: "lp", idx: i });
  }

  if (calls.length === 0) {
    vnBuckets.value = [];
    lpBuckets.value = [];
    return;
  }

  const now = BigInt(Math.floor(Date.now() / 1000));
  const results = await client.multicall({ contracts: calls });
  const nextVnBuckets = [];
  const nextLpBuckets = [];

  results.forEach((result, index) => {
    const item = result.result;
    const bucket = meta[index];
    if (!item || !bucket) return;

    if (bucket.type === "vn") {
      const vnAmount = item.vnAmount ?? item[0] ?? 0n;
      const unlocksAt = item.unlocksAt ?? item[1] ?? 0n;
      if (vnAmount <= 0n) return;
      nextVnBuckets.push({
        idx: bucket.idx,
        vnAmount,
        unlocksAt,
        isUnlocked: unlocksAt > 0n && now >= unlocksAt,
      });
      return;
    }

    const lpAmount = item.lpAmount ?? item[0] ?? 0n;
    const unlocksAt = item.unlocksAt ?? item[1] ?? 0n;
    if (lpAmount <= 0n) return;
    nextLpBuckets.push({
      idx: bucket.idx,
      lpAmount,
      unlocksAt,
      isUnlocked: unlocksAt > 0n && now >= unlocksAt,
    });
  });

  vnBuckets.value = nextVnBuckets;
  lpBuckets.value = nextLpBuckets;
}

async function fetchBalances(userAddress) {
  if (!userAddress) {
    vnBalance.value = 0n;
    vBarkxBalance.value = 0n;
    usdtBalance.value = 0n;
    return;
  }

  const client = getPublicClient();
  const results = await client.multicall({
    contracts: [
      { address: ADDRESSES.vn, abi: VNAbi, functionName: "balanceOf", args: [userAddress, 1n] },
      { address: ADDRESSES.vBARKX, abi: VBARKXAbi, functionName: "balanceOf", args: [userAddress] },
      { address: ADDRESSES.usdt, abi: BarkXAbi, functionName: "balanceOf", args: [userAddress] },
    ],
  });

  vnBalance.value = results[0].result ?? 0n;
  vBarkxBalance.value = results[1].result ?? 0n;
  usdtBalance.value = results[2].result ?? 0n;
}

async function fetchAll(userAddress) {
  const store = useMainStore();
  store.startChainReadPending();
  loading.value = true;

  try {
    await fetchPoolConfig();
    if (userAddress) {
      await fetchUserData(userAddress);
    } else {
      reset();
    }
  } finally {
    loading.value = false;
    store.finishChainReadPending();
  }
}

export function useElitePoolData() {
  return {
    loading,
    userInfo,
    lpPerVN,
    lockPeriod,
    minDeposit,
    globalPauseFlags,
    userPauseFlags,
    nonce,
    vnBalance,
    vBarkxBalance,
    usdtBalance,
    vnBuckets,
    lpBuckets,
    lpCap,
    lpCapUnused,
    isPausedDepositVN,
    isPausedDepositLP,
    isPausedWithdrawVN,
    isPausedWithdrawLP,
    isPausedClaim,
    fetchPoolConfig,
    fetchUserData,
    fetchAll,
    fetchBalances,
    reset,
  };
}
