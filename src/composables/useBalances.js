import { ref } from "vue";
import { useMainStore } from "@/store";
import { getPublicClient, ADDRESSES } from "@/composables/useContracts";
import { BarkXAbi, VNAbi, WVN1Abi } from "@/abi";

const VN_TOKEN_ID = 1n;

// Shared singleton state — all components see the same balances
const loading = ref(false);
const barkxBalance = ref(0n);
const usdtBalance = ref(0n);
const lpBalance = ref(0n);
const vnBalance = ref(0n);
const wvn1Balance = ref(0n);

export function useBalances() {

  async function fetchBalances(userAddress) {
    if (!userAddress) return;
    const store = useMainStore();
    store.startChainReadPending();
    loading.value = true;

    try {
      const client = getPublicClient();
      const results = await client.multicall({
        contracts: [
          { address: ADDRESSES.barkX, abi: BarkXAbi, functionName: "balanceOf", args: [userAddress] },
          { address: ADDRESSES.usdt, abi: BarkXAbi, functionName: "balanceOf", args: [userAddress] },
          { address: ADDRESSES.lpToken, abi: BarkXAbi, functionName: "balanceOf", args: [userAddress] },
          { address: ADDRESSES.vn, abi: VNAbi, functionName: "balanceOf", args: [userAddress, VN_TOKEN_ID] },
          { address: ADDRESSES.wVN1, abi: WVN1Abi, functionName: "balanceOf", args: [userAddress] },
        ],
      });

      barkxBalance.value = results[0].result ?? 0n;
      usdtBalance.value = results[1].result ?? 0n;
      lpBalance.value = results[2].result ?? 0n;
      vnBalance.value = results[3].result ?? 0n;
      wvn1Balance.value = results[4].result ?? 0n;
    } finally {
      loading.value = false;
      store.finishChainReadPending();
    }
  }

  function reset() {
    barkxBalance.value = 0n;
    usdtBalance.value = 0n;
    lpBalance.value = 0n;
    vnBalance.value = 0n;
    wvn1Balance.value = 0n;
  }

  return {
    loading,
    barkxBalance,
    usdtBalance,
    lpBalance,
    vnBalance,
    wvn1Balance,
    fetchBalances,
    reset,
  };
}
