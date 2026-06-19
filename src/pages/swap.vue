<template>
  <MiningShell>
    <div style="text-align: center; margin-bottom: 30px">
      <h1 style="font-size: 28px; color: var(--text-primary)">{{ $t("pages.swap.title") }}</h1>
      <p style="color: var(--text-muted); font-size: 14px">
        {{ $t("pages.swap.subtitle") }}
      </p>
    </div>

    <div class="swap-card">
      <div class="input-group">
        <div class="input-header">
          <span>{{ $t("pages.swap.pay") }}</span><span>{{ topAsset.balance }}</span>
        </div>
        <div class="input-row">
          <input
            v-model="payInput"
            type="text"
            inputmode="decimal"
            class="input-field"
            placeholder="0.00"
          />
          <div class="asset-badge">{{ topAsset.name }}</div>
        </div>
      </div>

      <div class="swap-direction">
        <button class="swap-direction-btn" type="button" @click="swapTokens">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </button>
      </div>

      <div class="input-group">
        <div class="input-header">
          <span>{{ $t("pages.swap.receive") }}</span><span>{{ bottomAsset.balance }}</span>
        </div>
        <div class="input-row">
          <input
            v-model="receiveInput"
            type="text"
            class="input-field"
            placeholder="0.00"
            readonly
          />
          <div class="asset-badge">{{ bottomAsset.name }}</div>
        </div>
      </div>

      <div
        style="
          margin-top: 16px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          border: 1px solid var(--border-dark);
        "
      >
        <div class="data-row" style="padding: 4px 0">
          <span class="data-lbl">{{ $t("pages.swap.rate") }}</span
          ><span class="data-val">{{ rateDisplay }}</span>
        </div>
        <div class="data-row" style="padding: 4px 0">
          <span class="data-lbl">{{ $t("pages.swap.priceImpact") }}</span
          ><span class="data-val" :class="priceImpactColor">{{ priceImpactDisplay }}</span>
        </div>
        <div class="data-row" style="padding: 4px 0">
          <span class="data-lbl">{{ $t("pages.swap.networkFee") }}</span
          ><span class="data-val">{{ networkFeeDisplay }}</span>
        </div>
      </div>

      <ApprovalActionGroup
        :requirements="swapRequirements"
        :check-handler="checkSwapApproval"
        :approve-handler="handleSwapApprove"
        :action-label="swapActionLabel"
        :action-disabled="swapDisabled"
        :action-pending-text="$t('pages.swap.pending')"
        @action="handleSwap"
      />
    </div>

    <SwapOptionsPanel
      v-model:selected-slippage="selectedSlippage"
      v-model:custom-slippage="customSlippage"
      v-model:deadline="deadline"
      v-model:expert-mode="expertMode"
    />

    <PoolStatusCard />
  </MiningShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { formatUnits, maxUint256 } from "viem";
import { useMainStore } from "@/store";
import { useBalances } from "@/composables/useBalances";
import { useApproval } from "@/composables/useApproval";
import { useUniswapV2 } from "@/composables/useUniswapV2";
import { getWalletClient, getGasOverrides, writeContractWithGasBuffer, waitForTx, ADDRESSES } from "@/composables/useContracts";
import { useNotice } from "@/composables/useNotice";
import { resolveUniswapMessage } from "@/components/mining/uniswapMessages";
import { UniswapV2Router02Abi } from "@/abi";
import { formatTokenAmount, safeParseUnits, truncateFixed } from "@/utils/format";
import ApprovalActionGroup from "@/components/mining/ApprovalActionGroup.vue";
import MiningShell from "@/components/mining/MiningShell.vue";
import PoolStatusCard from "@/components/mining/PoolStatusCard.vue";
import SwapOptionsPanel from "@/components/mining/SwapOptionsPanel.vue";

const { t } = useI18n({ useScope: "global" });
const store = useMainStore();
const { account } = storeToRefs(store);
const balances = useBalances();
const { barkxBalance, usdtBalance } = balances;
const approval = useApproval();
const uniswap = useUniswapV2();
const { showNotice } = useNotice();

const isBarkxTop = ref(true);
const payInput = ref("");
const receiveInput = ref("");
const selectedSlippage = ref("0.5%");
const customSlippage = ref("");
const deadline = ref("20");
const expertMode = ref(false);

async function loadData() {
  const tasks = [uniswap.fetchPair(), updateNetworkFee()];
  if (account.value) {
    tasks.push(balances.fetchBalances(account.value));
  }
  await Promise.all(tasks);
}
onMounted(loadData);
watch(() => account.value, loadData);

const topAsset = computed(() =>
  isBarkxTop.value
    ? { icon: "B", iconClass: "barkx", name: "BARKX", balance: t("common.balance", { amount: formatTokenAmount(barkxBalance.value, 18, 2) }) }
    : { icon: "$", iconClass: "usdt", name: "USDT", balance: t("common.balance", { amount: formatTokenAmount(usdtBalance.value, 6, 2) }) },
);
const bottomAsset = computed(() =>
  isBarkxTop.value
    ? { icon: "$", iconClass: "usdt", name: "USDT", balance: t("common.balance", { amount: formatTokenAmount(usdtBalance.value, 6, 2) }) }
    : { icon: "B", iconClass: "barkx", name: "BARKX", balance: t("common.balance", { amount: formatTokenAmount(barkxBalance.value, 18, 2) }) },
);

// --- Swap quote ---
const currentQuote = computed(() => {
  const payVal = Number(payInput.value) || 0;
  if (payVal <= 0) return null;
  const decimals = isBarkxTop.value ? 18 : 6;
  const raw = safeParseUnits(payInput.value, decimals);
  if (!raw) return null;
  return uniswap.getSwapQuote(isBarkxTop.value, raw.toString());
});

// Auto-fill receive
watch(currentQuote, (quote) => {
  receiveInput.value = quote ? quote.amountOutFormatted : "";
});

const slippagePct = computed(() => {
  const custom = parseFloat(customSlippage.value);
  if (custom > 0) return custom;
  return parseFloat(selectedSlippage.value) || 0.5;
});

// Custom slippage clears preset, preset clears custom
watch(customSlippage, (val) => {
  if (parseFloat(val) > 0) selectedSlippage.value = "";
});
watch(selectedSlippage, (val) => {
  if (val) customSlippage.value = "";
});

const rateDisplay = computed(() => {
  if (currentQuote.value) {
    const q = currentQuote.value;
    return `1 ${q.inputSymbol} = ${truncateFixed(q.executionPrice, 3)} ${q.outputSymbol}`;
  }
  if (uniswap.barkxPrice.value <= 0) return "—";
  return isBarkxTop.value
    ? `1 BARKX = ${truncateFixed(uniswap.barkxPrice.value, 3)} USDT`
    : `1 USDT = ${truncateFixed(1 / uniswap.barkxPrice.value, 3)} BARKX`;
});

const priceImpactDisplay = computed(() => {
  if (!currentQuote.value) return "—";
  return `${truncateFixed(currentQuote.value.priceImpact, 2)}%`;
});

const priceImpactColor = computed(() => {
  if (!currentQuote.value) return "";
  const val = currentQuote.value.priceImpact;
  if (val < 1) return "green";
  if (val < 3) return "";
  return "highlight";
});

const minimumReceivedDisplay = computed(() => {
  if (!currentQuote.value) return "—";
  const outDecimals = isBarkxTop.value ? 6 : 18;
  const minOut = currentQuote.value.amountOut * BigInt(Math.floor((1 - slippagePct.value / 100) * 10000)) / 10000n;
  return `${truncateFixed(Number(formatUnits(minOut, outDecimals)), 6)} ${currentQuote.value.outputSymbol}`;
});

// Estimate network fee: ~150k gas for swap on Arbitrum
const networkFeeDisplay = ref("~$0.01");
async function updateNetworkFee() {
  try {
    const client = getPublicClient();
    const block = await client.getBlock({ blockTag: "latest" });
    const baseFee = block.baseFeePerGas ?? 0n;
    // swapExactTokensForTokens ≈ 150k gas on Arbitrum
    const gasEstimate = 150000n;
    const feeWei = baseFee * gasEstimate;
    const feeEth = Number(feeWei) / 1e18;
    // ETH price ≈ fetched from context; Arbitrum fees paid in ETH
    // For simplicity use a rough ETH/USD estimate; in production fetch from oracle
    const ethUsd = 2500;
    const feeUsd = feeEth * ethUsd;
    networkFeeDisplay.value = feeUsd < 0.01 ? "<$0.01" : `~$${truncateFixed(feeUsd, 2)}`;
  } catch {
    networkFeeDisplay.value = "~$0.01";
  }
}

const highImpact = computed(() =>
  !expertMode.value && currentQuote.value && currentQuote.value.priceImpact > 15,
);
const swapInputInvalid = computed(() => {
  const rawValue = String(payInput.value ?? "").trim();
  const payVal = Number(rawValue) || 0;
  if (payVal <= 0) return true;

  const decimals = isBarkxTop.value ? 18 : 6;
  const amount = safeParseUnits(rawValue, decimals);
  if (!amount) return true;

  const balance = isBarkxTop.value ? barkxBalance.value : usdtBalance.value;
  if (amount > balance) return true;

  return false;
});
const swapDisabled = computed(() => swapInputInvalid.value || highImpact.value || !currentQuote.value);
const swapActionLabel = computed(() =>
  highImpact.value ? t("pages.swap.priceImpactTooHigh") : t("pages.swap.action"),
);

const swapRequirements = computed(() => [
  {
    id: isBarkxTop.value ? "router:barkx" : "router:usdt",
    label: isBarkxTop.value ? "BARKX" : "USDT",
  },
]);

function swapTokens() {
  isBarkxTop.value = !isBarkxTop.value;
  payInput.value = "";
  receiveInput.value = "";
}

async function checkSwapApproval(requirement) {
  if (requirement.id === "router:barkx") return approval.isBarkXApprovedForRouter();
  if (requirement.id === "router:usdt") return approval.isUsdtApprovedForRouter();
  return false;
}

async function handleSwapApprove(requirement) {
  if (requirement.id === "router:barkx") return approval.approveBarkXForRouter(maxUint256);
  if (requirement.id === "router:usdt") return approval.approveUsdtForRouter(maxUint256);
  return false;
}

async function handleSwap() {
  if (swapInputInvalid.value) return;
  if (!currentQuote.value) return;

  // Expert mode guard: block high-impact trades unless expert mode is on
  if (!expertMode.value && currentQuote.value.priceImpact > 15) {
    console.warn("Price impact too high, enable expert mode to proceed");
    return;
  }

  const payVal = Number(payInput.value) || 0;
  if (payVal <= 0) return;

  const inDecimals = isBarkxTop.value ? 18 : 6;
  const amountIn = safeParseUnits(payInput.value, inDecimals);
  if (!amountIn) return;
  const amountOutMin = currentQuote.value.amountOut * BigInt(Math.floor((1 - slippagePct.value / 100) * 10000)) / 10000n;
  const deadlineSec = BigInt(Math.floor(Date.now() / 1000) + Number(deadline.value) * 60);
  const path = isBarkxTop.value
    ? [ADDRESSES.barkX, ADDRESSES.usdt]
    : [ADDRESSES.usdt, ADDRESSES.barkX];

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.swap.pending") });

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();

    const gasOverrides = await getGasOverrides();
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.router,
      abi: UniswapV2Router02Abi,
      functionName: "swapExactTokensForTokens",
      args: [amountIn, amountOutMin, path, userAccount, deadlineSec],
      account: userAccount,
      ...gasOverrides,
    });

    await waitForTx(hash);
    await loadData();
    payInput.value = "";
    receiveInput.value = "";
    showNotice(resolveUniswapMessage("uniswap_swap_success"));
  } catch (err) {
    console.error("swap failed:", err);
    showNotice(resolveUniswapMessage("uniswap_swap_failure_retry"));
  } finally {
    store.clearWalletPendingState();
  }
}
</script>

<style scoped>
.data-lbl {
  flex-shrink: 0;
  white-space: nowrap;
  margin-right: 12px;
}
.data-val {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.swap-direction {
  margin-top: -24px;
  margin-bottom: -8px;
}

.swap-direction-btn {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.swap-direction-btn:hover {
  transform: rotate(180deg);
  box-shadow: 0 0 15px var(--cyan-glow);
}
</style>
