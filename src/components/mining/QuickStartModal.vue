<template>
  <Transition name="quick-start-fade">
    <!--
      Outside-click intentionally does NOT close this modal: it drives a serial
      chain of wallet transactions, so an accidental dismissal mid-flow is
      expensive. Only the ✕ closes it.
    -->
    <div v-if="open" class="custom-modal-overlay quick-start-overlay">
      <div class="custom-modal quick-start-modal" @click.stop>
        <button
          class="custom-modal-close"
          type="button"
          :aria-label="$t('common.modals.close')"
          @click="emit('close')"
        >
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
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="custom-modal-title">{{ $t("components.quickStart.title") }}</div>
        <div class="quick-start-sub">{{ $t("components.quickStart.subtitle") }}</div>

        <div class="quick-start-body">
          <!-- Step rail -->
          <ol class="qs-steps">
            <li
              v-for="(step, idx) in steps"
              :key="step.id"
              class="qs-step"
              :class="{
                'is-active': idx === activeIndex,
                'is-done': stepState[step.id] === 'done',
                'is-skipped': stepState[step.id] === 'skipped',
                'is-locked': idx > activeIndex,
              }"
            >
              <div class="qs-step-head">
                <span class="qs-step-dot">
                  <template v-if="stepState[step.id] === 'done'">✓</template>
                  <template v-else-if="stepState[step.id] === 'skipped'">–</template>
                  <template v-else>{{ idx + 1 }}</template>
                </span>
                <span class="qs-step-label">{{ $t(step.labelKey) }}</span>
              </div>

              <div v-if="idx === activeIndex" class="qs-step-body">
                <!-- ============ 1. Approve ============ -->
                <template v-if="step.id === 'approve'">
                  <div v-if="approvalsLoading" class="qs-hint">
                    {{ $t("components.quickStart.approve.checking") }}
                  </div>
                  <div v-else-if="allApproved" class="qs-approve-ok">
                    {{ $t("components.quickStart.approve.approved") }}
                  </div>
                  <template v-else>
                    <!--
                      One full-width button per outstanding approval, in the order
                      they must be cleared. Only the topmost is clickable; an
                      approval that is already in place drops out of the list.
                    -->
                    <div class="qs-approve-list">
                      <template v-for="(item, aIdx) in approvalItems" :key="item.id">
                        <button
                          v-if="!item.approved"
                          class="btn-submit qs-action qs-approve-btn"
                          type="button"
                          :disabled="busy || aIdx !== firstUnapprovedIndex"
                          @click="handleApproveChain"
                        >
                          {{ $t("components.quickStart.approve.action", { token: $t(item.labelKey) }) }}
                        </button>
                      </template>
                    </div>
                    <div class="qs-hint">{{ $t("components.quickStart.approve.hint") }}</div>
                  </template>
                </template>

                <!-- ============ 2. Deposit Fresh VN ============ -->
                <template v-else-if="step.id === 'depositVn'">
                  <div class="qs-row">
                    <span class="qs-row-lbl">{{ $t("components.quickStart.depositVn.vnToDeposit") }}</span>
                    <span class="qs-row-val">{{ formatIntegerAmount(vnPlan.vnCount) }} VN</span>
                  </div>
                  <div class="qs-row">
                    <span class="qs-row-lbl">{{ $t("components.quickStart.depositVn.pairingUsdt") }}</span>
                    <span class="qs-row-val">{{ formatTokenAmount(vnPlanUsdtWithMargin, 6, 2) }} USDT</span>
                  </div>
                  <div class="qs-row">
                    <span class="qs-row-lbl">{{ $t("components.quickStart.depositVn.bonus") }}</span>
                    <span class="qs-row-val">{{ formatTokenAmount(vnPlanBonusBarkx, 18, 2) }} BARKX</span>
                  </div>
                  <div class="qs-lock">{{ $t("components.quickStart.depositVn.lock") }}</div>

                  <button
                    class="btn-submit qs-action"
                    type="button"
                    :disabled="busy || !canDepositVn"
                    @click="handleDepositVn"
                  >
                    {{ $t("components.quickStart.depositVn.action") }}
                  </button>
                  <div v-if="!canDepositVn" class="qs-reason">{{ depositVnReason }}</div>
                </template>

                <!-- ============ 3. Buy BARKX ============ -->
                <template v-else-if="step.id === 'buyBarkx'">
                  <template v-if="buyPlan.shouldBuy">
                    <div class="qs-row">
                      <span class="qs-row-lbl">{{ $t("components.quickStart.buyBarkx.spend") }}</span>
                      <span class="qs-row-val">{{ formatTokenAmount(buyPlan.usdtToSpend, 6, 2) }} USDT</span>
                    </div>
                    <div class="qs-row">
                      <span class="qs-row-lbl">{{ $t("components.quickStart.buyBarkx.receive") }}</span>
                      <span class="qs-row-val">≈ {{ formatTokenAmount(buyQuoteOut, 18, 2) }} BARKX</span>
                    </div>
                    <div class="qs-hint">{{ $t("components.quickStart.buyBarkx.hint") }}</div>
                    <button
                      class="btn-submit qs-action"
                      type="button"
                      :disabled="busy"
                      @click="handleBuyBarkx"
                    >
                      {{ $t("components.quickStart.buyBarkx.action") }}
                    </button>
                  </template>
                  <!--
                    No Skip button here. Every reason not to buy is one the user
                    cannot act on, so the step marks itself skipped and hands off
                    to Mint LP. This branch is only on screen while the pair data
                    that decides it is still loading.
                  -->
                  <div v-else class="qs-hint">
                    {{ $t("components.quickStart.buyBarkx.checking") }}
                  </div>
                </template>

                <!-- ============ 4. Mint LP ============ -->
                <template v-else-if="step.id === 'mintLp'">
                  <template v-if="mintPlan.canMint">
                    <div class="qs-row">
                      <span class="qs-row-lbl">{{ $t("components.quickStart.mintLp.barkxIn") }}</span>
                      <span class="qs-row-val">{{ formatTokenAmount(mintPlan.barkxIn, 18, 2) }} BARKX</span>
                    </div>
                    <div class="qs-row">
                      <span class="qs-row-lbl">{{ $t("components.quickStart.mintLp.usdtIn") }}</span>
                      <span class="qs-row-val">{{ formatTokenAmount(mintPlan.usdtIn, 6, 2) }} USDT</span>
                    </div>
                    <div class="qs-row">
                      <span class="qs-row-lbl">{{ $t("components.quickStart.mintLp.lpOut") }}</span>
                      <span class="qs-row-val">≈ {{ formatTokenAmount(mintPlan.lpOut, 18, 6) }} LP</span>
                    </div>
                    <button
                      class="btn-submit qs-action"
                      type="button"
                      :disabled="busy"
                      @click="handleMintLp"
                    >
                      {{ $t("components.quickStart.mintLp.action") }}
                    </button>
                  </template>
                  <!--
                    No Skip button, same reasoning as Buy BARKX: no mint demand
                    is not a choice the user makes. Only on screen while the
                    pair data that sizes the mint is still loading.
                  -->
                  <div v-else class="qs-hint">
                    {{ $t("components.quickStart.mintLp.checking") }}
                  </div>
                </template>

                <!-- ============ 5. Deposit More LP ============ -->
                <template v-else-if="step.id === 'depositLp'">
                  <template v-if="depositLpPlan.canDeposit">
                    <div class="qs-row">
                      <span class="qs-row-lbl">{{ $t("components.quickStart.depositLp.amount") }}</span>
                      <span class="qs-row-val">{{ formatTokenAmount(depositLpPlan.lpAmount, 18, 6) }} LP</span>
                    </div>
                    <div class="qs-lock">{{ $t("components.quickStart.depositLp.lock") }}</div>
                    <button
                      class="btn-submit qs-action"
                      type="button"
                      :disabled="busy"
                      @click="handleDepositLp"
                    >
                      {{ $t("components.quickStart.depositLp.action") }}
                    </button>
                  </template>
                  <template v-else>
                    <div class="qs-reason">{{ depositLpFinishReason }}</div>
                    <button class="btn-submit qs-action" type="button" @click="emit('close')">
                      {{ $t("components.quickStart.common.finish") }}
                    </button>
                  </template>
                </template>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { maxUint256, parseUnits } from "viem";
import { useMainStore } from "@/store";
import { usePoolData } from "@/composables/usePoolData";
import { useBalances } from "@/composables/useBalances";
import { useApproval } from "@/composables/useApproval";
import { useUniswapV2 } from "@/composables/useUniswapV2";
import { useNotice } from "@/composables/useNotice";
import { resolveBarkxPoolMessage } from "@/components/mining/barkxPoolMessages";
import { resolveUniswapMessage } from "@/components/mining/uniswapMessages";
import {
  getWalletClient,
  getPublicClient,
  getGasOverrides,
  writeContractWithGasBuffer,
  waitForTx,
  ADDRESSES,
} from "@/composables/useContracts";
import { BarkXPoolAbi, UniswapV2Router02Abi } from "@/abi";
import { formatTokenAmount, formatIntegerAmount } from "@/utils/format";
import {
  computeFreshVnPlan,
  planBuyBarkx,
  computeMintLpPlan,
  computeDepositLpPlan,
  LP_DUST_WEI,
} from "@/utils/quickStartPlan";

const props = defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(["close", "refresh"]);

const { t } = useI18n({ useScope: "global" });
const store = useMainStore();
const { account } = storeToRefs(store);
const { showNotice } = useNotice();

const poolData = usePoolData();
const { userInfo, lpPerVN, barkXPerVN, lpCap, lpCapUnused } = poolData;
const balances = useBalances();
const { vnBalance, usdtBalance, barkxBalance, lpBalance } = balances;
const uniswap = useUniswapV2();
const approval = useApproval();

/**
 * Fixed slippage/deadline for every write this modal makes. The modal has no
 * settings panel of its own, and these mirror the defaults the standalone pages
 * ship with (0.5% / 20 min).
 */
const SLIPPAGE_BPS = 50n;
const BPS_DENOM = 10000n;
const DEADLINE_MINUTES = 20;

const STEPS = [
  { id: "approve", labelKey: "components.quickStart.approve.title" },
  { id: "depositVn", labelKey: "components.quickStart.depositVn.title" },
  { id: "buyBarkx", labelKey: "components.quickStart.buyBarkx.title" },
  { id: "mintLp", labelKey: "components.quickStart.mintLp.title" },
  { id: "depositLp", labelKey: "components.quickStart.depositLp.title" },
];
const steps = STEPS;

const activeIndex = ref(0);
const stepState = ref({});
const busy = ref(false);
const approvalsLoading = ref(false);
const autoAdvanceTimer = ref(null);

/** The five approvals, in the order the user must clear them. */
const approvalItems = ref([
  { id: "vn", labelKey: "components.quickStart.approve.vn", approved: false },
  { id: "usdtPool", labelKey: "components.quickStart.approve.usdtPool", approved: false },
  { id: "usdtRouter", labelKey: "components.quickStart.approve.usdtRouter", approved: false },
  { id: "barkx", labelKey: "components.quickStart.approve.barkx", approved: false },
  { id: "lp", labelKey: "components.quickStart.approve.lp", approved: false },
]);

const firstUnapprovedIndex = computed(() =>
  approvalItems.value.findIndex((item) => !item.approved),
);
const allApproved = computed(() => approvalItems.value.every((item) => item.approved));

// --- Plans -----------------------------------------------------------------

const reserves = computed(() => ({
  barkxReserve: uniswap.barkxReserve.value,
  usdtReserve: uniswap.usdtReserve.value,
  totalSupply: uniswap.totalSupply.value,
}));

const vnPlan = computed(() =>
  computeFreshVnPlan({
    vnBalance: vnBalance.value,
    usdtBalance: usdtBalance.value,
    barkXPerVN: barkXPerVN.value,
    barkxReserve: reserves.value.barkxReserve,
    usdtReserve: reserves.value.usdtReserve,
  }),
);

const vnPlanUsdtWithMargin = computed(() => vnPlan.value.usdtToSend);

const vnPlanBonusBarkx = computed(() => vnPlan.value.vnCount * barkXPerVN.value);

const canDepositVn = computed(() => vnPlan.value.vnCount > 0n);

const depositVnReason = computed(() => {
  // VN balance zero is the primary reason; insufficient USDT is secondary.
  if (vnBalance.value <= 0n) return t("components.quickStart.depositVn.reasonNoVn");
  return t("components.quickStart.depositVn.reasonNoUsdt");
});

const buyPlan = computed(() =>
  planBuyBarkx({
    lpToFill: lpCapUnused.value,
    lpBalance: lpBalance.value,
    stakedLP: userInfo.value.stakedLP,
    lpCap: lpCap.value,
    barkxBalance: barkxBalance.value,
    usdtBalance: usdtBalance.value,
    ...reserves.value,
  }),
);

const buyQuoteOut = computed(() => {
  if (!buyPlan.value.shouldBuy) return 0n;
  const quote = uniswap.getSwapQuote(false, buyPlan.value.usdtToSpend.toString());
  return quote?.amountOut ?? 0n;
});

const mintPlan = computed(() =>
  computeMintLpPlan({
    lpToFill: lpCapUnused.value,
    lpBalance: lpBalance.value,
    barkxBalance: barkxBalance.value,
    usdtBalance: usdtBalance.value,
    ...reserves.value,
  }),
);

const depositLpPlan = computed(() =>
  computeDepositLpPlan({
    lpBalance: lpBalance.value,
    lpToFill: lpCapUnused.value,
  }),
);

const depositLpFinishReason = computed(() => {
  // Two very different endings share the Finish button — say which one it is.
  if (lpCapUnused.value < LP_DUST_WEI) {
    return t("components.quickStart.depositLp.finishQuotaFull");
  }
  return t("components.quickStart.depositLp.finishNoLp");
});

// --- Data refresh ----------------------------------------------------------

async function refreshAll() {
  if (!account.value) return;
  await Promise.allSettled([
    poolData.fetchAll(account.value),
    balances.fetchBalances(account.value),
    uniswap.fetchPair(),
  ]);
  emit("refresh");
}

async function checkApprovals() {
  approvalsLoading.value = true;
  try {
    const [vn, usdtPool, usdtRouter, barkx, lp] = await Promise.all([
      approval.isVnApprovedForPool(),
      approval.isUsdtApprovedForPool(),
      approval.isUsdtApprovedForRouter(),
      approval.isBarkXApprovedForRouter(),
      approval.isLpApprovedForPool(),
    ]);
    const flags = { vn, usdtPool, usdtRouter, barkx, lp };
    approvalItems.value = approvalItems.value.map((item) => ({
      ...item,
      approved: Boolean(flags[item.id]),
    }));
  } catch (err) {
    console.error("[QuickStart] approval check failed:", err);
  } finally {
    approvalsLoading.value = false;
  }
}

// --- Step control ----------------------------------------------------------

function clearAutoAdvance() {
  if (autoAdvanceTimer.value !== null) {
    window.clearTimeout(autoAdvanceTimer.value);
    autoAdvanceTimer.value = null;
  }
}

function goToIndex(idx) {
  clearAutoAdvance();
  activeIndex.value = Math.min(idx, STEPS.length - 1);
}

function completeStep(id, state = "done") {
  stepState.value = { ...stepState.value, [id]: state };
  const idx = STEPS.findIndex((s) => s.id === id);
  if (idx >= 0 && idx + 1 < STEPS.length) goToIndex(idx + 1);
}

function skipStep(id) {
  completeStep(id, "skipped");
}

/**
 * Buy BARKX and Mint LP both resolve themselves. Every reason to sit either one
 * out — dust USDT, the wallet already holding the BARKX side, no mint demand
 * left — follows from balances and the quota, not from anything the user
 * decides here. A Skip button would only ask them to confirm a decision that
 * was never theirs, so each step marks itself skipped and hands off.
 *
 * Deposit More LP keeps its terminal button: it is the end of the flow, and
 * Finish closes the modal rather than advancing.
 */
const selfResolvingSteps = [
  { id: "buyBarkx", hasWork: () => buyPlan.value.shouldBuy },
  { id: "mintLp", hasWork: () => mintPlan.value.canMint },
];

/**
 * Gate for the auto-skip: zero reserves make every plan read as "nothing to
 * do", and skipping on that would silently hide a step the user needs.
 */
const pairLoaded = computed(
  () =>
    reserves.value.barkxReserve > 0n &&
    reserves.value.usdtReserve > 0n &&
    reserves.value.totalSupply > 0n,
);

watch(
  [
    () => props.open,
    activeIndex,
    () => buyPlan.value.shouldBuy,
    () => mintPlan.value.canMint,
    pairLoaded,
    busy,
  ],
  ([isOpen, idx, , , loaded, isBusy]) => {
    if (!isOpen || isBusy || !loaded) return;
    const step = selfResolvingSteps.find((s) => s.id === STEPS[idx]?.id);
    if (!step || step.hasWork()) return;
    skipStep(step.id);
  },
  { immediate: true },
);

/**
 * Bumped on every open and every close. The detection pass awaits network reads
 * before arming its timers, so a modal that is closed (or reopened) mid-flight
 * would otherwise have a stale continuation jump the user past the approval step.
 * Every await and every timer callback re-checks this token before touching state.
 */
const openGeneration = ref(0);

/**
 * Detection pass that runs every time the modal opens. It always restarts at the
 * approval step; the two auto-advance rules then carry an existing user forward.
 * Nothing auto-advances from Buy BARKX onward — every later step is a deliberate
 * click, because each one spends money.
 */
async function runOpeningDetection() {
  clearAutoAdvance();
  const gen = ++openGeneration.value;
  const isStale = () => gen !== openGeneration.value || !props.open;

  activeIndex.value = 0;
  stepState.value = {};

  await refreshAll();
  if (isStale()) return;
  await checkApprovals();
  if (isStale()) return;

  if (!allApproved.value) return;

  autoAdvanceTimer.value = window.setTimeout(() => {
    autoAdvanceTimer.value = null;
    if (isStale()) return;

    stepState.value = { ...stepState.value, approve: "done" };
    activeIndex.value = 1;

    // Already has a Main Pool position -> the fresh-VN step is behind them.
    if (userInfo.value.vnStaked > 0n) {
      autoAdvanceTimer.value = window.setTimeout(() => {
        autoAdvanceTimer.value = null;
        if (isStale()) return;
        stepState.value = { ...stepState.value, depositVn: "done" };
        activeIndex.value = 2;
      }, 1000);
    }
  }, 1000);
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      runOpeningDetection();
    } else {
      // Invalidate any in-flight detection pass as well as any armed timer.
      openGeneration.value += 1;
      clearAutoAdvance();
    }
  },
  { immediate: true },
);

onBeforeUnmount(clearAutoAdvance);

// --- Actions ---------------------------------------------------------------

/**
 * Approve every outstanding token in one click. The user can only ever trigger
 * the topmost unapproved item; the wallet then prompts for each remaining one in
 * turn. A rejection stops the chain where it is and leaves the rest pending.
 */
async function handleApproveChain() {
  if (busy.value) return;
  busy.value = true;
  try {
    for (const item of approvalItems.value) {
      if (item.approved) continue;

      if (item.id === "vn") await approval.approveVnForPool();
      else if (item.id === "usdtPool") await approval.approveUsdtForPool(maxUint256);
      else if (item.id === "usdtRouter") await approval.approveUsdtForRouter(maxUint256);
      else if (item.id === "barkx") await approval.approveBarkXForRouter(maxUint256);
      else if (item.id === "lp") await approval.approveLpForPool(maxUint256);

      item.approved = true;
    }
  } catch (err) {
    // A rejected or failed approval stops the chain where it is. Say so — the
    // button otherwise just fails to advance with no explanation.
    console.error("[QuickStart] approval chain stopped:", err);
    showNotice({ outcome: "failure", text: t("components.quickStart.approve.failed") });
  } finally {
    busy.value = false;
    await checkApprovals();
    if (allApproved.value) completeStep("approve");
  }
}

async function handleDepositVn() {
  if (busy.value || !canDepositVn.value) return;
  const vnCount = vnPlan.value.vnCount;
  const usdtAmt = vnPlanUsdtWithMargin.value;

  busy.value = true;
  try {
    store.setWalletPendingState({ pending: true, text: t("pages.pool.depositVn.pending") });

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const deadlineSec = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60);

    // minLP guards the gift's own mint. The gift BARKX is supplied by the pool,
    // so the LP it produces is sized from the gift, not from the wallet.
    const estLp = uniswap.estimateAddLiquidityLP(
      vnPlanBonusBarkx.value.toString(),
      usdtAmt.toString(),
    );
    let minLP = 0n;
    if (estLp !== "0.000000") {
      minLP = (parseUnits(estLp, 18) * (BPS_DENOM - SLIPPAGE_BPS)) / BPS_DENOM;
    }

    const args = [vnCount, usdtAmt, minLP, deadlineSec];
    const gasOverrides = await getGasOverrides();

    await getPublicClient().simulateContract({
      address: ADDRESSES.barkXPool,
      abi: BarkXPoolAbi,
      functionName: "depositModeA",
      args,
      account: userAccount,
    });

    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.barkXPool,
      abi: BarkXPoolAbi,
      functionName: "depositModeA",
      args,
      account: userAccount,
      ...gasOverrides,
    });

    await waitForTx(hash);
    await refreshAll();
    showNotice(
      resolveBarkxPoolMessage("deposit_vn_lp_success", { lpAmount: formatTokenAmount(minLP) }),
    );
    completeStep("depositVn");
  } catch (err) {
    console.error("[QuickStart] depositModeA failed:", err);
    showNotice(resolveBarkxPoolMessage("deposit_vn_lp_failure_retry"));
  } finally {
    store.clearWalletPendingState();
    busy.value = false;
  }
}

async function handleBuyBarkx() {
  if (busy.value || !buyPlan.value.shouldBuy) return;
  const amountIn = buyPlan.value.usdtToSpend;

  busy.value = true;
  try {
    store.setWalletPendingState({ pending: true, text: t("pages.swap.pending") });

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();

    const quote = uniswap.getSwapQuote(false, amountIn.toString());
    if (!quote) throw new Error("no swap quote");
    const amountOutMin = (quote.amountOut * (BPS_DENOM - SLIPPAGE_BPS)) / BPS_DENOM;
    const deadlineSec = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60);

    const gasOverrides = await getGasOverrides();
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.router,
      abi: UniswapV2Router02Abi,
      functionName: "swapExactTokensForTokens",
      args: [amountIn, amountOutMin, [ADDRESSES.usdt, ADDRESSES.barkX], userAccount, deadlineSec],
      account: userAccount,
      ...gasOverrides,
    });

    await waitForTx(hash);
    await refreshAll();
    showNotice(resolveUniswapMessage("uniswap_swap_success"));
    completeStep("buyBarkx");
  } catch (err) {
    console.error("[QuickStart] swap failed:", err);
    showNotice(resolveUniswapMessage("uniswap_swap_failure_retry"));
  } finally {
    store.clearWalletPendingState();
    busy.value = false;
  }
}

async function handleMintLp() {
  if (busy.value || !mintPlan.value.canMint) return;
  const { barkxIn, usdtIn } = mintPlan.value;

  busy.value = true;
  try {
    store.setWalletPendingState({ pending: true, text: t("pages.liquidity.add.pending") });

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const barkxMin = (barkxIn * (BPS_DENOM - SLIPPAGE_BPS)) / BPS_DENOM;
    const usdtMin = (usdtIn * (BPS_DENOM - SLIPPAGE_BPS)) / BPS_DENOM;
    const deadlineSec = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60);

    const gasOverrides = await getGasOverrides();
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.router,
      abi: UniswapV2Router02Abi,
      functionName: "addLiquidity",
      args: [
        ADDRESSES.barkX,
        ADDRESSES.usdt,
        barkxIn,
        usdtIn,
        barkxMin,
        usdtMin,
        userAccount,
        deadlineSec,
      ],
      account: userAccount,
      ...gasOverrides,
    });

    await waitForTx(hash);
    const lpBefore = lpBalance.value;
    await refreshAll();
    const minted = lpBalance.value > lpBefore ? lpBalance.value - lpBefore : mintPlan.value.lpOut;
    showNotice(
      resolveUniswapMessage("uniswap_add_liquidity_success", {
        lpAmount: formatTokenAmount(minted, 18, 6),
      }),
    );
    completeStep("mintLp");
  } catch (err) {
    console.error("[QuickStart] addLiquidity failed:", err);
    showNotice(resolveUniswapMessage("uniswap_add_liquidity_failure_retry"));
  } finally {
    store.clearWalletPendingState();
    busy.value = false;
  }
}

async function handleDepositLp() {
  if (busy.value || !depositLpPlan.value.canDeposit) return;
  const amount = depositLpPlan.value.lpAmount;

  busy.value = true;
  try {
    store.setWalletPendingState({ pending: true, text: t("components.quickStart.depositLp.pending") });

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();
    const args = [amount, true];

    // The quota is checked exactly on-chain and the whole transaction reverts on
    // breach (LPCapExceeded). The plan clamps to the quota, but it was read
    // before this click — simulate so a stale figure costs no gas.
    await getPublicClient().simulateContract({
      address: ADDRESSES.barkXPool,
      abi: BarkXPoolAbi,
      functionName: "depositModeBLP",
      args,
      account: userAccount,
    });

    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.barkXPool,
      abi: BarkXPoolAbi,
      functionName: "depositModeBLP",
      args,
      account: userAccount,
      ...gasOverrides,
    });

    await waitForTx(hash);
    await refreshAll();
    showNotice(resolveBarkxPoolMessage("deposit_lp_only_success"));
    completeStep("depositLp");
  } catch (err) {
    console.error("[QuickStart] depositModeBLP failed:", err);
    showNotice(resolveBarkxPoolMessage("deposit_lp_only_failure_retry"));
  } finally {
    store.clearWalletPendingState();
    busy.value = false;
  }
}
</script>

<style scoped>
.custom-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.3s ease;
  padding: 16px;
}

.custom-modal {
  width: 100%;
  max-width: 460px;
  max-height: 88vh;
  overflow-y: auto;
  background: rgba(18, 21, 30, 0.97);
  border: 1px solid var(--cyan);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}

.custom-modal::-webkit-scrollbar {
  width: 4px;
}

.custom-modal::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.custom-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.3s;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  z-index: 2;
}

.custom-modal-close:hover {
  color: var(--cyan);
}

.custom-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  padding-right: 28px;
}

.quick-start-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin: 6px 0 18px;
  padding-right: 28px;
}

.qs-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qs-step {
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.3);
  transition: border-color 0.3s, opacity 0.3s;
}

.qs-step.is-active {
  border-color: var(--cyan);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.15);
}

.qs-step.is-locked {
  opacity: 0.45;
}

.qs-step-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qs-step-dot {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  border-radius: 50%;
  border: 1px solid var(--border-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--text-muted);
}

.qs-step.is-active .qs-step-dot {
  border-color: var(--cyan);
  color: var(--cyan);
}

.qs-step.is-done .qs-step-dot {
  border-color: var(--green);
  color: var(--green);
}

.qs-step.is-skipped .qs-step-dot {
  border-color: var(--text-muted);
  color: var(--text-muted);
}

.qs-step-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.qs-step-body {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-dark);
}

.qs-approve-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qs-approve-ok {
  font-size: 12px;
  color: var(--green);
}

.qs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 5px 0;
}

.qs-row-lbl {
  font-size: 12px;
  color: var(--text-muted);
}

.qs-row-val {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
  text-align: right;
}

.qs-hint,
.qs-lock,
.qs-reason {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
  line-height: 1.5;
}

.qs-lock {
  color: var(--cyan);
}

.qs-action {
  margin-top: 14px;
  padding: 13px;
  font-size: 14px;
}

.qs-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

/* The approval list spaces its own buttons — .qs-action's top margin would double it. */
.qs-action.qs-approve-btn {
  margin-top: 0;
}

.quick-start-fade-enter-active,
.quick-start-fade-leave-active {
  transition: opacity 0.3s ease;
}

.quick-start-fade-enter-from,
.quick-start-fade-leave-to {
  opacity: 0;
}
</style>
