import { ref, computed } from "vue";
import { getPublicClient, ADDRESSES } from "@/composables/useContracts";
import { useMainStore } from "@/store";
import { BarkXSubPoolAbi, WVN2Abi, VLPAbi, WVN1Abi, VNAbi, BarkXAbi } from "@/abi";

// Singleton state
const loading = ref(false);
const userInfo = ref({ vnStaked: 0n, stakedVLP: 0n, totalClaimed: 0n });
const vlpPerVN = ref(0n);
const maxWVN2 = ref(0n); // whitelist cap for current user
const lockPeriod = ref(0n); // 24h in seconds
const globalPauseFlags = ref(0);
const userPauseFlags = ref(0);
const nonce = ref(0n);

const vnBuckets = ref([]);
const vlpBuckets = ref([]);

// Balances
const vnBalance = ref(0n);
const wvn1Balance = ref(0n);
const wvn2Balance = ref(0n);
const vlpBalance = ref(0n);

// Computed
const vlpCap = computed(() => userInfo.value.vnStaked * vlpPerVN.value);
const vlpCapUnused = computed(() => {
  const cap = vlpCap.value;
  const staked = userInfo.value.stakedVLP;
  return cap > staked ? cap - staked : 0n;
});
const isWhitelisted = computed(() => maxWVN2.value > 0n);

export function useSubPoolData() {
  const subPoolAddress = ADDRESSES.subPool;

  async function fetchPoolConfig() {
    if (!subPoolAddress) return;
    const client = getPublicClient();

    const results = await client.multicall({
      contracts: [
        { address: subPoolAddress, abi: BarkXSubPoolAbi, functionName: "vlpPerVN" },
        { address: subPoolAddress, abi: BarkXSubPoolAbi, functionName: "LOCK_PERIOD" },
        { address: subPoolAddress, abi: BarkXSubPoolAbi, functionName: "globalPauseFlags" },
      ],
    });

    vlpPerVN.value = results[0].result ?? 0n;
    lockPeriod.value = results[1].result ?? 0n;
    globalPauseFlags.value = Number(results[2].result ?? 0);
  }

  async function fetchUserData(userAddress) {
    if (!userAddress || !subPoolAddress) return;
    const client = getPublicClient();

    const results = await client.multicall({
      contracts: [
        { address: subPoolAddress, abi: BarkXSubPoolAbi, functionName: "userInfo", args: [userAddress] },
        { address: subPoolAddress, abi: BarkXSubPoolAbi, functionName: "maxWVN2", args: [userAddress] },
        { address: subPoolAddress, abi: BarkXSubPoolAbi, functionName: "userPauseFlags", args: [userAddress] },
        { address: subPoolAddress, abi: BarkXSubPoolAbi, functionName: "nonces", args: [userAddress] },
        { address: subPoolAddress, abi: BarkXSubPoolAbi, functionName: "vnBucketCount", args: [userAddress] },
        { address: subPoolAddress, abi: BarkXSubPoolAbi, functionName: "vlpBucketCount", args: [userAddress] },
        // Balances
        { address: ADDRESSES.vn, abi: VNAbi, functionName: "balanceOf", args: [userAddress, 1n] },
        { address: ADDRESSES.wVN1, abi: WVN1Abi, functionName: "balanceOf", args: [userAddress] },
        { address: ADDRESSES.wVN2, abi: WVN2Abi, functionName: "balanceOf", args: [userAddress] },
        { address: ADDRESSES.vLP, abi: VLPAbi, functionName: "balanceOf", args: [userAddress] },
      ],
    });

    const info = results[0].result;
    if (info) {
      userInfo.value = {
        vnStaked: info.vnStaked ?? info[0] ?? 0n,
        stakedVLP: info.stakedVLP ?? info[1] ?? 0n,
        totalClaimed: info.totalClaimed ?? info[2] ?? 0n,
      };
    }
    maxWVN2.value = results[1].result ?? 0n;
    userPauseFlags.value = Number(results[2].result ?? 0);
    nonce.value = results[3].result ?? 0n;

    const vnBucketCount = Number(results[4].result ?? 0n);
    const vlpBucketCount = Number(results[5].result ?? 0n);

    vnBalance.value = results[6].result ?? 0n;
    wvn1Balance.value = results[7].result ?? 0n;
    wvn2Balance.value = results[8].result ?? 0n;
    vlpBalance.value = results[9].result ?? 0n;

    await fetchAllBuckets(userAddress, vnBucketCount, vlpBucketCount);
  }

  async function fetchAllBuckets(userAddress, vnCount, vlpCount) {
    if (!subPoolAddress) return;
    const client = getPublicClient();
    const calls = [];
    const meta = [];

    for (let i = 0; i < vnCount; i++) {
      calls.push({ address: subPoolAddress, abi: BarkXSubPoolAbi, functionName: "vnBuckets", args: [userAddress, BigInt(i)] });
      meta.push({ type: "vn", idx: i });
    }
    for (let i = 0; i < vlpCount; i++) {
      calls.push({ address: subPoolAddress, abi: BarkXSubPoolAbi, functionName: "vlpBuckets", args: [userAddress, BigInt(i)] });
      meta.push({ type: "vlp", idx: i });
    }

    if (calls.length === 0) {
      vnBuckets.value = [];
      vlpBuckets.value = [];
      return;
    }

    const results = await client.multicall({ contracts: calls });
    const vn = [];
    const vlp = [];
    const now = BigInt(Math.floor(Date.now() / 1000));

    for (let i = 0; i < results.length; i++) {
      const r = results[i].result;
      if (!r) continue;
      const m = meta[i];

      if (m.type === "vn") {
        // SubVNBucket: tokenIds (skipped by Solidity public mapping), unlocksAt
        const unlocksAt = r.unlocksAt ?? r[1] ?? r[0] ?? 0n;
        if (unlocksAt === 0n) continue; // empty bucket
        vn.push({
          idx: m.idx,
          unlocksAt,
          isUnlocked: now >= unlocksAt,
        });
      } else {
        // SubLPBucket: vlpAmount, unlocksAt
        const vlpAmount = r.vlpAmount ?? r[0] ?? 0n;
        const unlocksAt = r.unlocksAt ?? r[1] ?? 0n;
        if (vlpAmount === 0n) continue; // empty bucket
        vlp.push({
          idx: m.idx,
          vlpAmount,
          unlocksAt,
          isUnlocked: now >= unlocksAt,
        });
      }
    }

    vnBuckets.value = vn;
    vlpBuckets.value = vlp;
  }

  async function fetchBalances(userAddress) {
    if (!userAddress) return;
    const client = getPublicClient();
    const results = await client.multicall({
      contracts: [
        { address: ADDRESSES.vn, abi: VNAbi, functionName: "balanceOf", args: [userAddress, 1n] },
        { address: ADDRESSES.wVN1, abi: WVN1Abi, functionName: "balanceOf", args: [userAddress] },
        { address: ADDRESSES.wVN2, abi: WVN2Abi, functionName: "balanceOf", args: [userAddress] },
        { address: ADDRESSES.vLP, abi: VLPAbi, functionName: "balanceOf", args: [userAddress] },
      ],
    });
    vnBalance.value = results[0].result ?? 0n;
    wvn1Balance.value = results[1].result ?? 0n;
    wvn2Balance.value = results[2].result ?? 0n;
    vlpBalance.value = results[3].result ?? 0n;
  }

  async function fetchAll(userAddress) {
    const store = useMainStore();
    store.startChainReadPending();
    loading.value = true;
    try {
      await fetchPoolConfig();
      if (userAddress) {
        await fetchUserData(userAddress);
      }
    } finally {
      loading.value = false;
      store.finishChainReadPending();
    }
  }

  return {
    loading,
    userInfo,
    vlpPerVN,
    maxWVN2,
    lockPeriod,
    globalPauseFlags,
    userPauseFlags,
    nonce,
    vnBuckets,
    vlpBuckets,
    vnBalance,
    wvn1Balance,
    wvn2Balance,
    vlpBalance,
    vlpCap,
    vlpCapUnused,
    isWhitelisted,
    fetchAll,
    fetchBalances,
  };
}
