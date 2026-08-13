<template>
  <MiningShell class="incubator-page-theme">
    <!-- Page heading -->
    <div style="text-align: center; margin-bottom: 20px">
      <h1 style="font-size: 28px; color: var(--text-primary)">{{ $t("pages.incubator.title") }}</h1>
      <p style="color: var(--text-muted); font-size: 14px">{{ $t("pages.incubator.subtitle") }}</p>
    </div>

    <!-- Not connected -->
    <div v-if="!account" class="info-box" style="text-align: center">
      {{ $t("pages.incubator.connectPrompt") }}
    </div>

    <template v-else>
      <div class="tabs">
        <div class="tab" :class="{ active: activeTab === 'normal' }" @click="activeTab = 'normal'">
          {{ $t("pages.incubator.tabs.normal") }}
        </div>
        <div class="tab" :class="{ active: activeTab === 'leader' }" @click="activeTab = 'leader'">
          {{ $t("pages.incubator.tabs.leader") }}
        </div>
      </div>

      <!-- ───────────── Normal panel ───────────── -->
      <div class="panel" :class="{ active: activeTab === 'normal' }">
        <template v-if="!normalDone">
          <div class="info-box">{{ $t("pages.incubator.normalInfo") }}</div>

          <div class="card stat-card-block">
            <div class="data-row">
              <span class="data-lbl">{{ $t("pages.incubator.stats.myInjection") }}</span>
              <span class="data-val" style="color: var(--cyan-bright)">{{ myInjection }}</span>
            </div>
            <div class="data-row">
              <span class="data-lbl">{{ $t("pages.incubator.stats.avgWeighted") }}</span>
              <span class="data-val">{{ avgWeighted }}</span>
            </div>
            <div class="data-row sub-row">
              <span class="data-lbl">└ {{ $t("pages.incubator.stats.nodeWeight") }}</span>
              <span class="data-val inline-info">
                {{ nodeWeight }}
                <svg class="info-icon" viewBox="0 0 24 24" @click="openModal('weight')">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span>
            </div>
            <div class="data-row">
              <span class="data-lbl">{{ $t("pages.incubator.stats.quotaShare") }}</span>
              <span class="data-val">{{ quotaShare }}</span>
            </div>
            <div class="data-row">
              <span class="data-lbl">{{ $t("pages.incubator.stats.globalQuota") }}</span>
              <span class="data-val">{{ globalQuota }}</span>
            </div>
            <div class="data-row" style="border-bottom: none">
              <span class="data-lbl" style="color: var(--green); font-weight: 600">{{ $t("pages.incubator.stats.myQuota") }}</span>
              <span class="data-val green" style="font-weight: 700">{{ normalQuota }}</span>
            </div>
          </div>

          <div class="input-group" style="border-color: var(--cyan)">
            <div class="input-header">
              <span style="color: var(--cyan-bright); font-weight: 600">{{ $t("pages.incubator.preview.amountToIncubate") }}</span>
              <span>{{ $t("pages.incubator.preview.injected", { amount: myInjection }) }}</span>
            </div>
            <div class="input-row">
              <input :value="normalQuota" type="text" class="input-field" style="color: var(--cyan-bright)" readonly />
              <div class="asset-badge">vBARKX</div>
            </div>
          </div>

          <div class="icon-divider">↓</div>

          <div class="input-group">
            <div class="input-header">
              <span>{{ $t("pages.incubator.preview.convertedAmount") }}</span>
              <span style="color: var(--text-muted); font-size: 11px">{{ $t("pages.incubator.oneToOne") }}</span>
            </div>
            <div class="input-row">
              <input :value="normalQuota" type="text" class="input-field" readonly />
              <div class="asset-badge">BARKX</div>
            </div>
          </div>

          <button class="btn-submit" :disabled="normalBtn.disabled" :style="normalBtn.disabled ? disabledStyle : {}" @click="openConfirm('normal')">
            {{ normalBtn.label }}
          </button>
        </template>

        <div v-else class="done-state-panel">
          <div class="done-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="done-title">{{ $t("pages.incubator.done.normalTitle") }}</div>
          <div class="done-desc">{{ $t("pages.incubator.done.normalDesc") }}<br />{{ $t("pages.incubator.done.comeBack", { time: $t("pages.incubator.updateTime") }) }}</div>
        </div>

        <button class="btn-submit amber" style="margin-top: 12px" @click="openInject">{{ $t("pages.incubator.buttons.inject") }}</button>
      </div>

      <!-- ───────────── Leader panel ───────────── -->
      <div class="panel" :class="{ active: activeTab === 'leader' }">
        <template v-if="!leaderDone">
          <div class="info-box">{{ $t("pages.incubator.leaderInfo") }}</div>

          <div class="card stat-card-block">
            <div class="data-row">
              <span class="data-lbl">{{ $t("pages.incubator.stats.dynamicReward") }}</span>
              <span class="data-val">{{ dynamicReward }}</span>
            </div>
            <div class="data-row sub-row">
              <span class="data-lbl">└ {{ $t("pages.incubator.stats.mappingEfficiency") }}</span>
              <span class="data-val inline-info" style="color: var(--cyan-bright)">
                {{ dynamicEff }}
                <svg class="info-icon" style="color: var(--cyan-bright)" viewBox="0 0 24 24" @click="openModal('dynamic')">
                  <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span>
            </div>
            <div class="data-row">
              <span class="data-lbl">{{ $t("pages.incubator.stats.feedbackReward") }}</span>
              <span class="data-val">{{ feedbackReward }}</span>
            </div>
            <div class="data-row sub-row">
              <span class="data-lbl">└ {{ $t("pages.incubator.stats.mappingEfficiency") }}</span>
              <span class="data-val inline-info" style="color: var(--cyan-bright)">
                {{ feedbackEff }}
                <svg class="info-icon" style="color: var(--cyan-bright)" viewBox="0 0 24 24" @click="openModal('feedback')">
                  <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span>
            </div>
            <div class="data-row dashed-top">
              <span class="data-lbl" style="color: var(--green)">{{ $t("pages.incubator.stats.leaderQuotaGrowth") }}</span>
              <span class="data-val green">{{ leaderQuotaGrowth }}</span>
            </div>
            <div class="data-row" style="border-bottom: none">
              <span class="data-lbl" style="color: var(--purple)">{{ $t("pages.incubator.stats.totalUnused") }}</span>
              <span class="data-val" style="color: var(--purple); font-weight: 700">{{ leaderUnused }}</span>
            </div>
          </div>

          <div class="input-group" style="border-color: var(--purple)">
            <div class="input-header">
              <span style="color: var(--purple); font-weight: 600">{{ $t("pages.incubator.preview.amountToIncubate") }}</span>
              <span>{{ $t("pages.incubator.preview.injected", { amount: myInjection }) }}</span>
            </div>
            <div class="input-row">
              <input :value="leaderUnused" type="text" class="input-field" style="color: var(--purple)" readonly />
              <div class="asset-badge">vBARKX</div>
            </div>
          </div>

          <div class="icon-divider">↓</div>

          <div class="input-group">
            <div class="input-header">
              <span>{{ $t("pages.incubator.preview.convertedAmount") }}</span>
              <span style="color: var(--text-muted); font-size: 11px">{{ $t("pages.incubator.oneToOne") }}</span>
            </div>
            <div class="input-row">
              <input :value="leaderUnused" type="text" class="input-field" readonly />
              <div class="asset-badge">BARKX</div>
            </div>
          </div>

          <button class="btn-submit purple" :disabled="leaderBtn.disabled" :style="leaderBtn.disabled ? disabledStyle : {}" @click="openConfirm('leader')">
            {{ leaderBtn.label }}
          </button>
        </template>

        <div v-else class="done-state-panel">
          <div class="done-icon" style="color: var(--purple); filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="done-title">{{ $t("pages.incubator.done.leaderTitle") }}</div>
          <div class="done-desc">{{ $t("pages.incubator.done.leaderDesc") }}<br />{{ $t("pages.incubator.done.comeBack", { time: $t("pages.incubator.updateTime") }) }}</div>
        </div>

        <button class="btn-submit amber" style="margin-top: 12px" @click="openInject">{{ $t("pages.incubator.buttons.inject") }}</button>
      </div>

      <!-- ───────────── Leaderboard ───────────── -->
      <div class="collapsible-card">
        <div class="collapsible-header" @click="leaderboardOpen = !leaderboardOpen">
          <span style="display: flex; align-items: center; gap: 8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            {{ $t("pages.incubator.leaderboard.title") }}
          </span>
          <span class="chevron" :class="{ up: leaderboardOpen }">▼</span>
        </div>
        <div class="collapsible-content" :class="{ show: leaderboardOpen }">
          <div class="lb-list">
            <div v-for="item in leaderboard" :key="item.rank" class="lb-item" :class="`top-${item.rank}`">
              <span class="lb-rank">{{ item.rank }}</span>
              <span class="lb-address">{{ lbShort(item.address) }}</span>
              <span class="lb-value">{{ $t("pages.incubator.leaderboard.value", { amount: fmtInt(item.totalConvertedWei) }) }}</span>
            </div>
            <div v-if="!leaderboard.length" class="lb-item"><span class="lb-address" style="color: var(--text-muted)">—</span></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Powered by OpenDAO (prototype footer) -->
    <footer style="text-align: center; margin-top: 24px">
      <div style="font-size: 12px; color: var(--text-muted); opacity: 0.6; letter-spacing: 0.5px">Powered by OpenDAO</div>
    </footer>

    <!-- ───────────── Confirm Incubation modal ───────────── -->
    <div v-if="confirmModal" class="custom-modal-overlay" @click="confirmModal = false">
      <div class="custom-modal cyan-theme" @click.stop>
        <button class="custom-modal-close" type="button" @click="confirmModal = false">✕</button>
        <div class="custom-modal-title">{{ $t("pages.incubator.confirm.title") }}</div>
        <div class="custom-modal-text" v-html="confirmMessage"></div>
        <button class="btn-submit" :disabled="converting || confirmButton.disabled" :style="confirmButton.disabled ? disabledStyle : {}" style="margin-top: 20px" @click="doConvert">
          {{ confirmButton.label }}
        </button>
      </div>
    </div>

    <!-- ───────────── Inject modal ───────────── -->
    <!-- Outside-click intentionally does NOT close this modal (amount entry —
         avoid accidental dismissal); only the × button closes it. -->
    <div v-if="injectModal" class="custom-modal-overlay">
      <div class="custom-modal cyan-theme" style="max-width: 460px; width: 90%" @click.stop>
        <button class="custom-modal-close" type="button" @click="closeInject">✕</button>
        <div class="custom-modal-title">{{ $t("pages.incubator.inject.title") }}</div>
        <div class="info-box" style="margin-top: 8px" v-html="$t('pages.incubator.inject.info')"></div>
        <div class="card stat-card-block" style="margin-top: 12px; margin-bottom: 16px; padding: 10px 16px">
          <div class="data-row" style="border-bottom: none; padding: 0">
            <span class="data-lbl">{{ $t("pages.incubator.stats.myInjection") }}</span>
            <span class="data-val" style="color: var(--cyan-bright)">{{ myInjection }}</span>
          </div>
        </div>
        <div class="input-group">
          <div class="input-header">
            <span>{{ $t("pages.incubator.inject.amount") }}</span>
            <span>{{ $t("common.balance", { amount: `${walletVbarkx} vBARKX` }) }}</span>
          </div>
          <div class="input-row">
            <input v-model="injectInput" type="text" inputmode="decimal" class="input-field" placeholder="0.00" />
            <div class="asset-badge">vBARKX</div>
          </div>
          <div class="percent-btns">
            <button class="p-btn" type="button" @click="setInjectMax">{{ $t("common.max") }}</button>
          </div>
        </div>
        <ApprovalActionGroup
          :requirements="injectRequirements"
          :check-handler="checkInjectApproval"
          :approve-handler="handleInjectApprove"
          :action-label="injectActionLabel"
          :action-disabled="injectActionDisabled"
          @action="doInject"
        />
        <div class="info-box amber" style="margin-top: 16px; margin-bottom: 0">{{ $t("pages.incubator.inject.warning") }}</div>
      </div>
    </div>

    <!-- ───────────── Info modals (tier tables) ───────────── -->
    <div v-if="infoModal" class="custom-modal-overlay" @click="infoModal = null">
      <div class="custom-modal cyan-theme" @click.stop>
        <button class="custom-modal-close" type="button" @click="infoModal = null">✕</button>
        <div class="custom-modal-title">{{ infoModalContent.title }}</div>
        <div class="custom-modal-text" v-html="infoModalContent.desc"></div>
        <table class="modal-table">
          <thead><tr><th>{{ infoModalContent.colA }}</th><th>{{ infoModalContent.colB }}</th></tr></thead>
          <tbody>
            <tr v-for="row in infoModalContent.rows" :key="row.name"><td>{{ row.name }}</td><td>{{ row.value }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </MiningShell>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { formatUnits, maxUint256 } from "viem";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import MiningShell from "@/components/mining/MiningShell.vue";
import ApprovalActionGroup from "@/components/mining/ApprovalActionGroup.vue";
import { useMainStore } from "@/store";
import { useApproval } from "@/composables/useApproval";
import { useNotice } from "@/composables/useNotice";
import {
  getPublicClient,
  getWalletClient,
  waitForTx,
  writeContractWithGasBuffer,
  getGasOverrides,
} from "@/composables/useContracts";
import { BarkXIncubatorAbi, VBARKXAbi } from "@/abi";
import { INCUBATOR_CONFIG } from "@/contracts/incubatorConfig";
import { formatTokenAmount, truncateFixed, safeParseUnits, shortenAddress } from "@/utils/format";
import {
  getIncubatorProfile,
  getIncubatorConfig,
  getIncubatorLeaderboard,
  getConvertChallenge,
  requestNormalConvertSignature,
  requestLeaderConvertSignature,
} from "@/composables/useIncubatorBackend";

const { t } = useI18n({ useScope: "global" });
const store = useMainStore();
const { account } = storeToRefs(store);
const { ensureErc20Approval } = useApproval();
const { showNotice } = useNotice();

const activeTab = ref("normal");
const leaderboardOpen = ref(false);
const confirmModal = ref(false);
const confirmMechanism = ref("normal");
const injectModal = ref(false);
const infoModal = ref(null); // 'weight' | 'dynamic' | 'feedback'
const injectInput = ref("");
const converting = ref(false);

const profile = ref(null);
const config = ref(null);
const leaderboard = ref([]);
const walletVbarkxRaw = ref("0");
// My Injection / Injected come straight from the contract (userInjection),
// independent of the backend — per SPEC these must read on-chain and stay
// correct even when the backend is offline.
const onchainInjectionWei = ref("0");

const disabledStyle = {
  opacity: "0.5",
  pointerEvents: "none",
  color: "#e2e8f0",
  background: "linear-gradient(135deg, #475569 0%, #334155 100%)",
  boxShadow: "none",
};

// ── helpers ──
const WEI = 10n ** 18n;
function fmt(wei) {
  // Truncate to 2 decimals (spec: display values truncated to target precision).
  return formatTokenAmount(wei ?? "0", 18, 2);
}
// Leaderboard: integer-truncated BARKX (prototype "452,100"), address as 0x00...00.
function fmtInt(wei) {
  return formatTokenAmount(wei ?? "0", 18, 0);
}
function lbShort(a) {
  return a ? `${a.slice(0, 4)}...${a.slice(-2)}` : "—";
}
function shorten(a) {
  return shortenAddress(a, 4);
}
function big(wei) {
  try { return BigInt(wei ?? "0"); } catch { return 0n; }
}

// ── display computeds ──
const myInjection = computed(() => fmt(onchainInjectionWei.value));
const avgWeighted = computed(() => fmt(profile.value?.nodeWeightedAvgInjectionWei));
const nodeWeight = computed(() => `${truncateFixed((profile.value?.nodeWeightPct ?? 100) / 100, 2)}`);
const quotaShare = computed(() => `${truncateFixed((profile.value?.nodeShare ?? 0) * 100, 2)}%`);
const globalQuota = computed(() => fmt(profile.value?.globalQuotaWei));
const normalQuota = computed(() => fmt(profile.value?.normalQuotaWei));
const dynamicReward = computed(() => fmt(profile.value?.dynamicRewardWei));
const dynamicEff = computed(() => `${profile.value?.dynamicMappingEfficiencyPct ?? 0}%`);
const feedbackReward = computed(() => fmt(profile.value?.feedbackRewardWei));
const feedbackEff = computed(() => `${profile.value?.feedbackMappingEfficiencyPct ?? 0}%`);
const leaderQuotaGrowth = computed(() => fmt(profile.value?.leaderQuotaGrowthWei));
const leaderUnused = computed(() => fmt(profile.value?.totalUnusedLeaderQuotaWei));
const walletVbarkx = computed(() => fmt(walletVbarkxRaw.value));

// Optimistic done: set on on-chain confirm so the UI flips to Completed
// without waiting for the backend listener (~12 blocks). Resets on reload.
const optimisticDone = ref({ normal: false, leader: false });
const normalDone = computed(() => Boolean(profile.value?.normalDoneToday) || optimisticDone.value.normal);
const leaderDone = computed(() => Boolean(profile.value?.leaderDoneToday) || optimisticDone.value.leader);

// ── button state machine (Insufficient Injection / Less than 1 BARKX / Incubate) ──
function btnState(quotaWei) {
  if (profile.value?.suspended) {
    return { disabled: true, label: t("pages.incubator.buttons.suspended") };
  }
  const quota = big(quotaWei);
  const injection = big(onchainInjectionWei.value);
  if (injection < quota) return { disabled: true, label: t("pages.incubator.buttons.insufficientInjection") };
  if (quota < WEI) return { disabled: true, label: t("pages.incubator.buttons.lessThanOne") };
  return { disabled: false, label: t("pages.incubator.buttons.incubate") };
}
const normalBtn = computed(() => btnState(profile.value?.normalQuotaWei));
const leaderBtn = computed(() => btnState(profile.value?.totalUnusedLeaderQuotaWei));

const confirmAmount = computed(() => fmt(confirmMechanism.value === "normal" ? profile.value?.normalQuotaWei : profile.value?.totalUnusedLeaderQuotaWei));
const confirmMessage = computed(() => {
  const key = confirmMechanism.value === "normal" ? "pages.incubator.confirm.messageNormal" : "pages.incubator.confirm.messageLeader";
  return t(key, { amount: confirmAmount.value });});

// Pending signatures are a soft relay hint after the seq hardening: display the
// countdown, but let users retry if they canceled a wallet or relay step.
const cooldownActive = ref(false);
const nowSec = ref(Math.floor(Date.now() / 1000));
const confirmPendingUntil = computed(() =>
  confirmMechanism.value === "normal" ? profile.value?.normalPendingUntil : profile.value?.leaderPendingUntil,
);
const confirmPending = computed(() => Boolean(confirmPendingUntil.value));
const pendingRemaining = computed(() =>
  confirmPendingUntil.value ? Math.max(0, confirmPendingUntil.value - nowSec.value) : 0,
);
const confirmButton = computed(() => {
  if (confirmPending.value) {
    const r = pendingRemaining.value;
    return { disabled: false, label: r > 0 ? `${t("pages.incubator.confirm.inProgress")} (${r}s)` : t("pages.incubator.confirm.inProgress") };
  }
  if (cooldownActive.value) return { disabled: true, label: t("pages.incubator.confirm.inCooldown") };
  return { disabled: false, label: t("pages.incubator.confirm.confirm") };
});

// While the Confirm modal is open, tick the relay-hint countdown and refresh
// once it elapses so the label returns to the normal confirm state.
let confirmTimer = null;
watch(confirmModal, (open) => {
  if (open) {
    nowSec.value = Math.floor(Date.now() / 1000);
    if (confirmTimer) clearInterval(confirmTimer);
    confirmTimer = setInterval(() => {
      nowSec.value = Math.floor(Date.now() / 1000);
      if (confirmPending.value && pendingRemaining.value <= 0) loadProfile();
    }, 1000);
  } else if (confirmTimer) {
    clearInterval(confirmTimer);
    confirmTimer = null;
  }
});
onBeforeUnmount(() => { if (confirmTimer) clearInterval(confirmTimer); });

// Inject action button (approval handled separately by ApprovalActionGroup).
const injectRequirements = [{ id: "incubator:vbarkx", label: "vBARKX" }];
const injectAmountWei = computed(() => safeParseUnits(injectInput.value || "0", 18));
const injectInsufficient = computed(() => injectAmountWei.value > big(walletVbarkxRaw.value));
const injectActionDisabled = computed(() => injectAmountWei.value <= 0n || injectInsufficient.value);
const injectActionLabel = computed(() =>
  injectInsufficient.value ? t("pages.incubator.buttons.insufficientBalance") : t("pages.incubator.buttons.inject"),
);

// Approve-first: check allowance up front; default to NOT approved on any error.
async function checkInjectApproval() {
  if (!account.value) return false;
  try {
    const allowance = await getPublicClient().readContract({
      address: INCUBATOR_CONFIG.vbarkx,
      abi: VBARKXAbi,
      functionName: "allowance",
      args: [account.value, INCUBATOR_CONFIG.incubator],
    });
    return allowance > 0n;
  } catch {
    return false;
  }
}
async function handleInjectApprove() {
  return ensureErc20Approval(INCUBATOR_CONFIG.vbarkx, VBARKXAbi, INCUBATOR_CONFIG.incubator, maxUint256, "vBARKX");
}

function setInjectMax() {
  injectInput.value = formatUnits(big(walletVbarkxRaw.value), 18);
}

function getIncubatorErrorText(error, fallbackKey) {
  const code = String(error?.code || error?.responseCode || "");
  const keyMap = {
    USER_SUSPENDED: "pages.incubator.errors.userSuspended",
    ALREADY_CONVERTED_TODAY: "pages.incubator.errors.alreadyConverted",
    INSUFFICIENT_INJECTION: "pages.incubator.errors.insufficientInjection",
    QUOTA_BELOW_MIN: "pages.incubator.errors.quotaBelowMin",
    APPROVER_LOCKED: "pages.incubator.errors.approverLocked",
    NOT_CONFIGURED: "pages.incubator.errors.notConfigured",
    AUTH_REQUIRED: "pages.incubator.errors.authRequired",
    BAD_SIGNATURE: "pages.incubator.errors.badSignature",
    SIG_MISMATCH: "pages.incubator.errors.badSignature",
    BAD_CHALLENGE: "pages.incubator.errors.badChallenge",
    RATE_LIMITED: "pages.incubator.errors.rateLimited",
    SIGN_FAILED: "pages.incubator.errors.signFailed",
  };
  const mappedKey = keyMap[code];

  if (mappedKey) {
    return t(mappedKey);
  }

  const blob = `${error?.shortMessage || ""} ${error?.message || ""} ${error?.details || ""}`;
  if (/ConvertCooldown/i.test(blob)) {
    return t("pages.incubator.confirm.cooldown");
  }
  if (/UserRejected|user rejected|rejected|denied/i.test(blob)) {
    return t("wallet.errors.rejected");
  }

  return t(fallbackKey);
}

// Map backend tier names → i18n keys. Only zh ships translations; every other
// locale falls back to the English names in en.json (tiers stay untranslated).
const TIER_I18N_KEY = {
  "Not Registered": "notRegistered",
  Nova: "nova",
  Voyager: "voyager",
  Navigator: "navigator",
  Commander: "commander",
  "Stellar Master": "stellarMaster",
};
function tierName(name) {
  const key = TIER_I18N_KEY[name];
  return key ? t(`pages.incubator.tiers.${key}`) : name;
}

// ── info modal content ──
const infoModalContent = computed(() => {
  const tiers = config.value?.tiers ?? [];
  if (infoModal.value === "weight") {
    return {
      title: t("pages.incubator.weightModal.title"),
      desc: t("pages.incubator.weightModal.desc"),
      colA: t("pages.incubator.weightModal.colTier"),
      colB: t("pages.incubator.weightModal.colWeight"),
      rows: tiers.map((x) => ({ name: tierName(x.name), value: truncateFixed(x.weightPct / 100, 2) })),
    };
  }
  if (infoModal.value === "dynamic") {
    return {
      title: t("pages.incubator.dynamicModal.title"),
      desc: t("pages.incubator.dynamicModal.desc"),
      colA: t("pages.incubator.weightModal.colTier"),
      colB: t("pages.incubator.dynamicModal.colEfficiency"),
      rows: tiers.map((x) => ({ name: tierName(x.name), value: `${x.dynamicEffPct}%` })),
    };
  }
  return {
    title: t("pages.incubator.feedbackModal.title"),
    desc: t("pages.incubator.feedbackModal.desc"),
    colA: t("pages.incubator.weightModal.colTier"),
    colB: t("pages.incubator.feedbackModal.colEfficiency"),
    rows: tiers.map((x) => ({ name: tierName(x.name), value: `${x.feedbackEffPct}%` })),
  };
});

// ── data loading ──
async function loadProfile() {
  if (!account.value) return;
  // Read userInjection straight from the contract first — independent of the
  // backend, so My Injection / Injected stay correct even if the backend is down.
  try {
    onchainInjectionWei.value = (
      await getPublicClient().readContract({
        address: INCUBATOR_CONFIG.incubator,
        abi: BarkXIncubatorAbi,
        functionName: "userInjection",
        args: [account.value],
      })
    ).toString();
  } catch (e) {
    onchainInjectionWei.value = "0";
  }
  try {
    profile.value = await getIncubatorProfile(account.value);
  } catch (e) {
    console.error("[incubator] profile load failed", e);
  }
  try {
    walletVbarkxRaw.value = (
      await getPublicClient().readContract({
        address: INCUBATOR_CONFIG.vbarkx,
        abi: VBARKXAbi,
        functionName: "balanceOf",
        args: [account.value],
      })
    ).toString();
  } catch (e) {
    walletVbarkxRaw.value = "0";
  }
}
async function loadStatic() {
  try { config.value = await getIncubatorConfig(); } catch (e) { console.error(e); }
  try { leaderboard.value = await getIncubatorLeaderboard(); } catch (e) { console.error(e); }
}

// ── actions ──
function openModal(which) { infoModal.value = which; }
function openInject() { injectInput.value = ""; injectModal.value = true; }
function closeInject() { injectModal.value = false; }
async function openConfirm(mechanism) {
  const btn = mechanism === "normal" ? normalBtn.value : leaderBtn.value;
  if (btn.disabled) return;
  confirmMechanism.value = mechanism;
  cooldownActive.value = false;
  confirmModal.value = true;
  // Refresh relay-hint state and read the on-chain cooldown so the Confirm
  // button can show "Pending for Relay" / "Conversion in Cooldown" up front.
  loadProfile();
  try {
    const c = getPublicClient();
    const [last, cur] = await Promise.all([
      c.readContract({ address: INCUBATOR_CONFIG.incubator, abi: BarkXIncubatorAbi, functionName: "lastConvertHeight", args: [account.value] }),
      c.readContract({ address: INCUBATOR_CONFIG.incubator, abi: BarkXIncubatorAbi, functionName: "currentConvertBlock" }),
    ]);
    cooldownActive.value = last !== 0n && cur < last + 8n;
  } catch (e) {
    cooldownActive.value = false;
  }
}

async function doInject() {
  if (injectActionDisabled.value) return;
  const amount = injectAmountWei.value;
  const injectedDisplay = fmt(amount.toString());
  try {
    const walletClient = getWalletClient();
    const [acct] = await walletClient.getAddresses();
    store.setWalletPendingState({ pending: true, text: t("pages.incubator.buttons.inject") });
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: INCUBATOR_CONFIG.incubator,
      abi: BarkXIncubatorAbi,
      functionName: "inject",
      args: [amount],
      account: acct,
      ...(await getGasOverrides()),
    });
    await waitForTx(hash);
    injectModal.value = false;
    await loadProfile();
    showNotice({ outcome: "success", text: t("pages.incubator.inject.success", { amount: injectedDisplay }) });
  } catch (e) {
    showNotice({ outcome: "failure", text: getIncubatorErrorText(e, "pages.incubator.inject.failure") });
  } finally {
    store.clearWalletPendingState();
  }
}

async function doConvert() {
  if (converting.value) return;
  converting.value = true;
  const mechanism = confirmMechanism.value;
  try {
    const walletClient = getWalletClient();
    const [acct] = await walletClient.getAddresses();

    // Wallet authentication (audit #1): prove control of the address by
    // personal-signing a one-time challenge before requesting the approval.
    const challenge = await getConvertChallenge(account.value);
    const signature = await walletClient.signMessage({ account: acct, message: challenge.message });
    const authBody = { address: account.value, signature, challengeNonce: challenge.challengeNonce };
    const signed = mechanism === "normal"
      ? await requestNormalConvertSignature(authBody)
      : await requestLeaderConvertSignature(authBody);

    const convertedDisplay = fmt(signed.amount);
    store.setWalletPendingState({ pending: true, text: t("pages.incubator.buttons.incubate") });
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: INCUBATOR_CONFIG.incubator,
      abi: BarkXIncubatorAbi,
      functionName: "convert",
      args: [BigInt(signed.amount), BigInt(signed.seq), BigInt(signed.nonce), BigInt(signed.deadline), signed.signature],
      account: acct,
      ...(await getGasOverrides()),
    });
    await waitForTx(hash);
    confirmModal.value = false;
    // Optimistically flip to the Completed state immediately on on-chain
    // confirmation — don't wait the ~12-block listener gap before the backend
    // reflects normalDoneToday/leaderDoneToday. A manual refresh during the gap
    // may briefly show the active view again; acceptable. The contract's
    // per-user seq makes a duplicate submission in this window revert, so it's safe.
    optimisticDone.value = { ...optimisticDone.value, [mechanism]: true };
    await Promise.all([loadProfile(), loadStatic()]);
    showNotice({ outcome: "success", text: t("pages.incubator.confirm.success", { amount: convertedDisplay }) });
  } catch (e) {
    showNotice({ outcome: "failure", text: getIncubatorErrorText(e, "pages.incubator.confirm.failure") });
  } finally {
    store.clearWalletPendingState();
    converting.value = false;
  }
}

onMounted(() => {
  loadStatic();
  loadProfile();
});
// Reload when the wallet account changes.
watch(account, () => loadProfile());
</script>

<style lang="less">
.incubator-page-theme {
  /* Prototype's own sea-blue theme (incubator_sample.html :root) — deeper
     than the global sky-blue/purple, like e-pool/v-pool each have their own. */
  --cyan: #0284c7;
  --cyan-bright: #38bdf8;
  --cyan-glow: rgba(2, 132, 199, 0.4);
  --purple: #a855f7;
  --green: #22c55e;
  --green-glow: rgba(34, 197, 94, 0.5);
  --amber: #f59e0b;
  --red: #ef4444;
  --bg-card: rgba(15, 23, 42, 0.95);
  --bg-card-solid: #0f172a;
  --border-dark: rgba(2, 132, 199, 0.2);
  --border-glow: rgba(2, 132, 199, 0.4);
  background: transparent;
}

/* Base page background — the prototype's body { background: #020617 }. A fixed
   full-screen layer behind the grid (z-2) and glow (z-1) overlays, scoped to
   the incubator page so it never touches the global body background. */
.incubator-page-theme::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -3;
  background: #020617;
}

.incubator-page-theme .header {
  background: rgba(2, 6, 23, 0.85) !important;
}
.incubator-page-theme .grid-bg {
  background-image:
    linear-gradient(rgba(2, 132, 199, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(2, 132, 199, 0.05) 1px, transparent 1px) !important;
}
.incubator-page-theme .glow-bg {
  background:
    radial-gradient(ellipse at 20% 0%, rgba(2, 132, 199, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(56, 189, 248, 0.08) 0%, transparent 50%) !important;
}

.incubator-page-theme .tab.active {
  background: rgba(2, 132, 199, 0.15) !important;
  border-color: var(--cyan) !important;
  color: var(--cyan-bright) !important;
}

.incubator-page-theme .stat-card-block {
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border: 1px solid var(--border-dark);
  border-radius: 12px;
}
.incubator-page-theme .sub-row {
  padding-left: 16px;
  border-bottom: none !important;
  font-size: 13px;
  opacity: 0.85;
}
.incubator-page-theme .dashed-top {
  border-top: 1px dashed var(--border-dark);
  margin-top: 6px;
  padding-top: 12px;
}
.incubator-page-theme .inline-info {
  display: inline-flex;
  align-items: center;
}
.incubator-page-theme .info-icon {
  width: 14px;
  height: 14px;
  cursor: pointer;
  margin-left: 6px;
  color: #fff;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* done state */
.incubator-page-theme .done-state-panel {
  text-align: center;
  padding: 40px 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 16px;
  margin-top: 10px;
}
.incubator-page-theme .done-icon {
  color: var(--green);
  margin-bottom: 16px;
  filter: drop-shadow(0 0 10px var(--green-glow));
}
.incubator-page-theme .done-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.incubator-page-theme .done-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
}

/* collapsible leaderboard */
.incubator-page-theme .collapsible-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 16px;
  margin-top: 24px;
  overflow: hidden;
}
.incubator-page-theme .collapsible-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  color: var(--cyan-bright);
  font-size: 15px;
}
.incubator-page-theme .collapsible-content {
  padding: 0 20px;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
}
.incubator-page-theme .collapsible-content.show {
  padding: 0 20px 20px;
  max-height: 800px;
}
.incubator-page-theme .chevron {
  transition: transform 0.3s ease;
}
.incubator-page-theme .chevron.up {
  transform: rotate(180deg);
}
.incubator-page-theme .lb-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.incubator-page-theme .lb-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-size: 14px;
}
.incubator-page-theme .lb-rank {
  font-family: "JetBrains Mono", monospace;
  color: var(--text-muted);
  width: 24px;
  font-weight: 600;
}
.incubator-page-theme .lb-address {
  font-family: "JetBrains Mono", monospace;
  color: var(--text-primary);
  flex: 1;
}
.incubator-page-theme .lb-value {
  font-family: "JetBrains Mono", monospace;
  color: var(--cyan-bright);
  font-weight: 600;
}
.incubator-page-theme .lb-item.top-1 .lb-rank { color: #fbbf24; }
.incubator-page-theme .lb-item.top-2 .lb-rank { color: #94a3b8; }
.incubator-page-theme .lb-item.top-3 .lb-rank { color: #b45309; }

/* modals */
.incubator-page-theme .custom-modal-overlay,
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
  padding: 20px;
}
.custom-modal {
  width: 100%;
  max-width: 360px;
  background: rgba(15, 18, 25, 0.97);
  border: 1px solid var(--cyan, #38bdf8);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}
.custom-modal-close {
  position: absolute;
  top: 14px;
  right: 16px;
  color: #64748b;
  cursor: pointer;
  background: transparent;
  border: none;
  font-size: 18px;
  line-height: 1;
}
.custom-modal-close:hover { color: var(--cyan-bright, #00d4ff); }
.custom-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 16px;
  padding-right: 24px;
}
.custom-modal-text {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
}
.modal-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 14px;
  font-size: 13px;
}
.modal-table th {
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
  padding: 8px 6px;
  color: #00d4ff;
  font-weight: 600;
  text-align: left;
}
.modal-table td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 8px 6px;
  color: #94a3b8;
}
.modal-table tr:last-child td { border-bottom: none; }
</style>
