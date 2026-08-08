<template>
  <QuickStartModal
    :open="quickStartOpen"
    @close="closeQuickStart"
    @refresh="loadData"
  />

  <Transition name="custom-modal-fade">
    <div
      v-if="activeModalKey"
      class="custom-modal-overlay"
      @click="closeModal"
    >
      <div
        class="custom-modal"
        :class="modalThemeClass"
        @click.stop
      >
        <button
          class="custom-modal-close"
          type="button"
          :aria-label="$t('common.modals.close')"
          @click="closeModal"
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
        <div class="custom-modal-title">{{ modalTitle }}</div>
        <div class="custom-modal-text" v-html="modalContent"></div>
      </div>
    </div>
  </Transition>

  <Transition name="custom-modal-fade">
    <div
      v-if="isWeightModalOpen"
      class="custom-modal-overlay"
      @click="closeWeightModal"
    >
      <div class="custom-modal cyan-theme" @click.stop>
        <button
          class="custom-modal-close"
          type="button"
          :aria-label="$t('common.modals.close')"
          @click="closeWeightModal"
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
        <div class="custom-modal-title">{{ $t("pages.dashboard.nodeWeight.title") }}</div>
        <div class="custom-modal-text">
          <div
            style="
              background: rgba(0, 0, 0, 0.3);
              border: 1px solid var(--border-dark);
              border-radius: 12px;
              padding: 16px;
            "
          >
            <div
              style="
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
              "
            >
              {{ $t("pages.dashboard.nodeWeight.yesterdayWeight") }}
              <span
                style="
                  color: var(--cyan);
                  font-family: 'JetBrains Mono', monospace;
                  font-size: 18px;
                  font-weight: 700;
                  margin-left: 8px;
                "
              >1.00</span>
            </div>
            <div
              style="
                font-size: 13px;
                color: var(--text-secondary);
                line-height: 1.6;
              "
            >
              {{ $t("pages.dashboard.nodeWeight.fetchedFrom") }}
              <strong style="color: var(--text-primary)">{{ $t("pages.dashboard.nodeWeight.sourceName") }}</strong>.<br /><br />
              {{ $t("pages.dashboard.nodeWeight.multiplierBefore") }}
              <strong>{{ $t("pages.dashboard.nodeWeight.averageBalance") }}</strong>{{ $t("pages.dashboard.nodeWeight.multiplierAfter") }}<br /><br />
              {{ $t("pages.dashboard.nodeWeight.learnBefore") }}
              <a
                href="https://opendao.cc/"
                target="_blank"
                rel="noopener noreferrer"
                class="ext-link-inline"
              >{{ $t("pages.dashboard.nodeWeight.linkText") }}</a>
              {{ $t("pages.dashboard.nodeWeight.learnAfter") }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <MiningShell>
    <template v-if="walletConnected && walletIsTargetChain">
      <div style="text-align: center; margin-bottom: 30px">
        <h1 style="font-size: 28px; color: var(--text-primary)">{{ $t("pages.dashboard.title") }}</h1>
        <p style="color: var(--text-muted); font-size: 14px">
          {{ $t("pages.dashboard.subtitle") }}
        </p>
      </div>

      <div class="grid-2">
        <div class="metric-box">
          <div class="metric-val metric-val--gold">
            {{ barkxPrice > 0 ? truncateFixed(barkxPrice, 3) : "—" }}
          </div>
          <div class="metric-lbl">{{ $t("pages.dashboard.metrics.price") }}</div>
        </div>
        <div class="metric-box">
          <div class="metric-val metric-val--gold">{{ marketCapDisplay }}</div>
          <div class="metric-lbl">{{ $t("pages.dashboard.metrics.marketCap") }}</div>
        </div>
      </div>

      <button
        class="quick-start-entry"
        type="button"
        :disabled="quickStartLocked"
        @click="openQuickStart"
      >
        {{
          quickStartLocked
            ? $t("components.quickStart.entryLocked")
            : $t("components.quickStart.entry")
        }}
      </button>

      <div
        class="card clickable-card purple"
        style="border-color: rgba(168, 85, 247, 0.4)"
        @click="openModal('poolDetails')"
      >
        <div class="card-top-tools">
          <div
            class="card-corner-badge"
            :class="nodeStatusClass"
          >
            <span>{{ nodeStatusLabel }}</span>
          </div>
          <div class="info-icon">
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
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
        </div>

        <div
          class="card-title"
          style="color: #c084fc; border-bottom-color: rgba(168, 85, 247, 0.2)"
        >
          {{ $t("pages.dashboard.mainPool.title") }}
        </div>

        <div class="data-row">
          <div class="rate-crossfade-wrapper" style="justify-content: flex-start">
            <span class="data-lbl rate-cf-1">{{ $t("pages.dashboard.mainPool.boostedApr") }}</span>
            <span class="data-lbl rate-cf-2" style="left: 0">{{ $t("pages.dashboard.mainPool.boostedApy") }}</span>
          </div>
          <div style="text-align: right">
            <div class="rate-crossfade-wrapper" style="justify-content: flex-end; width: 110px">
              <div class="data-val green rate-cf-1">{{ boostedAprDisplay }}</div>
              <div class="data-val green rate-cf-2" style="right: 0">{{ boostedApyDisplay }}</div>
            </div>
          </div>
        </div>

        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.vectorNexus") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: #c084fc">{{ formatIntegerAmount(userInfo.vnStaked) }} VN</div>
          </div>
        </div>

        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.lpToken") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: #c084fc">{{ formatTokenAmount(userInfo.stakedLP) }} LP</div>
          </div>
        </div>

        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.pendingRewards") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: #c084fc">{{ formatTokenAmount(pendingRewards, 18, 2) }} BARKX</div>
          </div>
        </div>

        <div class="data-row" style="border-bottom: none">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.totalAchieved") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: #c084fc">{{ formatTokenAmount(historicalIncome, 18, 2) }} BARKX</div>
          </div>
        </div>
      </div>

      <div
        v-if="showEliteCard"
        class="card"
        style="border-color: rgba(20, 184, 166, 0.4)"
      >
        <div
          class="card-title"
          style="color: #14b8a6; border-bottom-color: rgba(20, 184, 166, 0.2)"
        >
          {{ $t("pages.dashboard.elitePool.title") }}
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.boostedApr") }}</span>
          <div style="text-align: right">
            <div class="data-val green">{{ eliteBoostedAprDisplay }}</div>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.vectorNexus") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: #14b8a6">{{ formatIntegerAmount(eliteVn) }} VN</div>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.lpToken") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: #14b8a6">{{ formatTokenAmount(eliteLp) }} LP</div>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.pendingRewards") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: #14b8a6">{{ formatTokenAmount(elitePendingRewards, 18, 2) }} BARKX</div>
          </div>
        </div>
        <div class="data-row" style="border-bottom: none">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.totalAchieved") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: #14b8a6">{{ formatTokenAmount(eliteTotalAchieved, 18, 2) }} BARKX</div>
          </div>
        </div>
      </div>

      <div
        v-if="showVipCard"
        class="card"
        style="border-color: rgba(245, 158, 11, 0.4)"
      >
        <div
          class="card-title"
          style="color: var(--amber); border-bottom-color: rgba(245, 158, 11, 0.2)"
        >
          {{ $t("pages.dashboard.vipPool.title") }}
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.vipPool.apr") }}</span>
          <div style="text-align: right">
            <div class="data-val green">{{ vipAprDisplay }}</div>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.vectorNexus") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--amber)">{{ vipVnDisplay }}</div>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.lpToken") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--amber)">{{ formatTokenAmount(subPoolData.userInfo.value.stakedVLP, 18, 2) }} vLP</div>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.pendingRewards") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--amber)">{{ formatTokenAmount(vipPendingRewards, 18, 2) }} BARKX</div>
          </div>
        </div>
        <div class="data-row" style="border-bottom: none">
          <span class="data-lbl">{{ $t("pages.dashboard.mainPool.totalAchieved") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--amber)">{{ formatTokenAmount(vipTotalClaimed, 18, 2) }} BARKX</div>
          </div>
        </div>
      </div>

      <div
        v-if="showIncubatorCard"
        class="card clickable-card cyan"
        style="border-color: var(--border-glow)"
        @click="openWeightModal"
      >
        <div
          class="info-icon"
          style="position: absolute; top: 16px; right: 16px"
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
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <div
          class="card-title"
          style="color: var(--cyan); border-bottom-color: rgba(56, 189, 248, 0.2)"
        >
          {{ $t("pages.dashboard.incubator.title") }}
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.incubator.myDeposit") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--cyan)">{{ formatTokenAmount(incubatorDeposit, 18, 2) }} vBARKX</div>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.incubator.average30Day") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--cyan)">{{ formatTokenAmount(incubatorAverage, 18, 2) }} vBARKX</div>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.incubator.myQuotaToday") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--cyan)">{{ formatTokenAmount(incubatorQuotaToday, 18, 2) }} vBARKX</div>
          </div>
        </div>
        <div class="data-row" style="border-bottom: none">
          <span class="data-lbl">{{ $t("pages.dashboard.incubator.totalIncubated") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--cyan)">{{ formatTokenAmount(incubatorTotalIncubated, 18, 2) }} BARKX</div>
          </div>
        </div>
      </div>

      <div
        class="card clickable-card green"
        style="border-color: rgba(34, 197, 94, 0.4)"
        @click="openModal('assetsOverview')"
      >
        <div class="info-icon">
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
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <div
          class="card-title"
          style="color: var(--green); border-bottom-color: rgba(34, 197, 94, 0.2)"
        >
          {{ $t("pages.dashboard.assetsInWallet.title") }}
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.assetsInWallet.newVn") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--green)">{{ formatIntegerAmount(vnBalance) }} VN</div>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.assetsInWallet.usedVn") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--green)">{{ formatIntegerAmount(wvn1Balance) }} wVN</div>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.dashboard.assetsInWallet.barkx") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--green)">{{ formatTokenAmount(barkxBalance, 18, 2) }} BARKX</div>
          </div>
        </div>
        <div class="data-row" style="border-bottom: none">
          <span class="data-lbl">{{ $t("pages.dashboard.assetsInWallet.lp") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--green)">{{ formatTokenAmount(lpBalance) }} LP</div>
          </div>
        </div>
      </div>

      <PoolStatusCard style="margin-top: 24px" />
    </template>
  </MiningShell>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { formatUnits, getAddress, isAddress } from "viem";
import MiningShell from "@/components/mining/MiningShell.vue";
import PoolStatusCard from "@/components/mining/PoolStatusCard.vue";
import { useMainStore } from "@/store";
import { usePoolData } from "@/composables/usePoolData";
import { useBalances } from "@/composables/useBalances";
import { useSubPoolData } from "@/composables/useSubPoolData";
import { useElitePoolData } from "@/composables/useElitePoolData";
import { getPublicClient, ADDRESSES } from "@/composables/useContracts";
import {
  getCompoundConfig,
  getCompoundRatio,
  getUserInfo as fetchBackendUserInfo,
  getLatestApr,
} from "@/composables/useBackend";
import { getSubPoolInfo, getSubPoolUserInfo } from "@/composables/useSubPoolBackend";
import {
  getElitePoolInfo,
  getElitePoolPendingRewards,
  getElitePoolUserInfo,
} from "@/composables/useElitePoolBackend";
import { getIncubatorProfile } from "@/composables/useIncubatorBackend";
import { BarkXAbi } from "@/abi";
import {
  calculateApyFromApr,
  formatTokenAmount,
  formatIntegerAmount,
  truncateFixed,
} from "@/utils/format";
import { BARKX_MARKET_CAP_BYPASS_ADDRESSES } from "@/contracts/barkxPoolConfig";
import QuickStartModal from "@/components/mining/QuickStartModal.vue";
import { isLpQuotaNearFull } from "@/utils/quickStartPlan";

const { t } = useI18n({ useScope: "global" });
const { walletConnected, walletIsTargetChain, account } = storeToRefs(useMainStore());

const poolData = usePoolData();
const { barkxPrice, userInfo, modeABuckets, lpCap } = poolData;
const balances = useBalances();
const { vnBalance, wvn1Balance, barkxBalance, lpBalance } = balances;
const subPoolData = useSubPoolData();
const elitePoolData = useElitePoolData();

const barkxBypassSupplyAddresses = computed(() =>
  uniqueAddresses(BARKX_MARKET_CAP_BYPASS_ADDRESSES),
);

const activeModalKey = ref("");
const isWeightModalOpen = ref(false);
const quickStartOpen = ref(false);

// The Quick Start entry is for users who still have quota space to fill. Once
// more than 90% of it is used the button stays on screen but locks, so the
// reason is visible rather than the entry silently vanishing.
const quickStartLocked = computed(() =>
  isLpQuotaNearFull(userInfo.value.stakedLP, lpCap.value),
);
const pendingRewards = ref(0n);
const historicalIncome = ref(0n);
const currentApr = ref("");
const compoundThreshold = ref(50);
const compoundRatio = ref(0);
const backendPoolUserInfo = ref(null);
const vipPendingRewards = ref(0n);
const vipTotalClaimed = ref(0n);
const vipCurrentApr = ref("");
const circulatingSupply = ref(0n);

const eliteCurrentApr = ref("");
const elitePendingRewards = ref(0n);
const eliteHistoricalIncome = ref(0n);

const incubatorDeposit = ref(0n);
const incubatorAverage = ref(0n);
const incubatorQuotaToday = ref(0n);
const incubatorTotalIncubated = ref(0n);

const isNodeActive = computed(() => modeABuckets.value.length > 0);

const nodeStatusLabel = computed(() =>
  t(
    isNodeActive.value
      ? "common.modals.nodeStatus.active"
      : "common.modals.nodeStatus.inactive",
  ),
);

const nodeStatusClass = computed(() =>
  isNodeActive.value ? "status-active" : "status-inactive",
);

const nodeStatusColor = computed(() =>
  isNodeActive.value ? "var(--green)" : "var(--text-muted)",
);

const nodeBoostMultiplier = computed(() => {
  const nodeBoost = backendPoolUserInfo.value?.nodeBoost || {};
  const total = Number.parseFloat(String(nodeBoost.total ?? ""));
  if (Number.isFinite(total) && total > 0) {
    return Math.min(total, 2);
  }

  const bonusRate = Number.parseFloat(String(backendPoolUserInfo.value?.bonusRate ?? "0"));
  const penaltyRate = Number.parseFloat(String(backendPoolUserInfo.value?.penaltyRate ?? "0"));
  const safeBonusRate = Number.isFinite(bonusRate) ? bonusRate : 0;
  const safePenaltyRate = Number.isFinite(penaltyRate) ? penaltyRate : 0;
  const rawBoost = (1 + safeBonusRate) * (1 + safePenaltyRate);

  if (!Number.isFinite(rawBoost) || rawBoost <= 0) {
    return 1;
  }

  return Math.min(rawBoost, 2);
});

const boostedAprDecimal = computed(() => {
  const rawApr = Number(currentApr.value);
  if (!Number.isFinite(rawApr) || rawApr <= 0) {
    return null;
  }

  return rawApr * nodeBoostMultiplier.value;
});

const boostedAprDisplay = computed(() => {
  if (boostedAprDecimal.value === null) {
    return "—";
  }

  return `${truncateFixed(boostedAprDecimal.value * 100, 2)}%`;
});

const boostedApyDisplay = computed(() => {
  if (boostedAprDecimal.value === null) {
    return "—";
  }

  const apy = calculateApyFromApr(boostedAprDecimal.value);
  return `${truncateFixed(apy * 100, 2)}%`;
});

const vipAprDisplay = computed(() => {
  const rawApr = Number(vipCurrentApr.value);
  if (!Number.isFinite(rawApr) || rawApr <= 0) {
    return "—";
  }

  return `${truncateFixed(rawApr, 2)}%`;
});

const vipVnDisplay = computed(() =>
  `${formatIntegerAmount(subPoolData.userInfo.value.vnStaked)}/${formatIntegerAmount(subPoolData.maxWVN2.value)} VN`,
);

const eliteVn = computed(() => elitePoolData.userInfo.value.vnStaked);
const eliteLp = computed(() => elitePoolData.userInfo.value.stakedLP);
const eliteTotalAchieved = computed(() =>
  eliteHistoricalIncome.value > 0n
    ? eliteHistoricalIncome.value
    : elitePoolData.userInfo.value.totalClaimed,
);
const eliteBoostedAprDisplay = computed(() =>
  formatBoostedApr(eliteCurrentApr.value, nodeBoostMultiplier.value),
);

const showEliteCard = computed(() =>
  eliteVn.value > 0n
  || eliteLp.value > 0n
  || elitePendingRewards.value > 0n
  || eliteTotalAchieved.value > 0n,
);

const showVipCard = computed(() =>
  subPoolData.userInfo.value.vnStaked > 0n
  || subPoolData.userInfo.value.stakedVLP > 0n
  || vipPendingRewards.value > 0n
  || vipTotalClaimed.value > 0n,
);

const showIncubatorCard = computed(() => false);

const marketCapDisplay = computed(() => {
  if (circulatingSupply.value <= 0n || barkxPrice.value <= 0) {
    return "—";
  }

  const circulating = Number(formatUnits(circulatingSupply.value, 18));
  if (!Number.isFinite(circulating) || circulating <= 0) {
    return "—";
  }

  return formatCompactUsd(circulating * barkxPrice.value);
});

const modalThemeClass = computed(() => {
  if (activeModalKey.value === "assetsOverview") {
    return "green-theme";
  }

  return "purple-theme";
});

const modalTitle = computed(() => {
  if (activeModalKey.value === "assetsOverview") {
    return t("pages.dashboard.assetsInWallet.overviewTitle");
  }

  if (activeModalKey.value === "poolDetails") {
    return t("pages.dashboard.mainPool.detailsTitle");
  }

  return "";
});

const modalContent = computed(() => {
  if (activeModalKey.value === "assetsOverview") {
    return `
      <div class="modal-inner-card">
        ${buildModalRow(t("pages.dashboard.assetsInWallet.newVn"), `${formatIntegerAmount(vnBalance.value)} VN`)}
        ${buildModalRow(t("pages.dashboard.assetsInWallet.usedVn1"), `${formatIntegerAmount(wvn1Balance.value)} wVN`)}
        ${buildModalRow(t("pages.dashboard.assetsInWallet.usedVn2"), `${formatIntegerAmount(subPoolData.wvn2Balance.value)} wVN2`)}
      </div>
      <div class="modal-inner-card">
        ${buildModalRow(t("pages.dashboard.assetsInWallet.barkx"), `${formatTokenAmount(barkxBalance.value, 18, 2)} BARKX`)}
        ${buildModalRow(t("pages.dashboard.assetsInWallet.vbarkx"), `${formatTokenAmount(elitePoolData.vBarkxBalance.value, 18, 2)} vBARKX`)}
      </div>
      <div class="modal-inner-card">
        ${buildModalRow(t("pages.dashboard.assetsInWallet.lp"), `${formatTokenAmount(lpBalance.value)} LP`)}
        ${buildModalRow(t("pages.dashboard.assetsInWallet.vlp"), `${formatTokenAmount(subPoolData.vlpBalance.value, 18, 2)} vLP`)}
      </div>
    `;
  }

  if (activeModalKey.value === "poolDetails") {
    return `
      <div class="modal-inner-card">
        <div style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
          ${t("common.modals.nodeStatus.title")}
        </div>
        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
          ${t("common.modals.nodeStatus.currentStatus")}
          <span style="color: ${nodeStatusColor.value}; font-weight: 700; margin-left: 8px; text-transform: uppercase;">
            ${nodeStatusLabel.value}
          </span>
        </div>
        <div style="font-size: 12px;">
          ${t("common.modals.nodeStatus.descriptionHtml")}
        </div>
      </div>
      <div class="modal-inner-card">
        <div style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
          ${t("common.modals.compoundEligibility.title")}
        </div>
        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
          ${t("common.modals.compoundEligibility.lifetimeRatio")}
          <span style="color: #c084fc; font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; margin-left: 8px;">
            ${compoundRatio.value}%
          </span>
        </div>
        <div style="font-size: 12px; margin-bottom: 8px;">
          ${t("common.modals.compoundEligibility.metricHint")}
        </div>
        <div style="font-size: 12px;">
          <strong>${t("common.modals.compoundEligibility.rulesTitle")}</strong>
          ${t("common.modals.compoundEligibility.rulesHtml", { threshold: compoundThreshold.value })}
        </div>
      </div>
    `;
  }

  return "";
});

async function fetchPoolApr() {
  try {
    const data = await getLatestApr();
    currentApr.value = data?.apr ?? data?.apy ?? "";
  } catch {
    currentApr.value = "";
  }
}

async function fetchMainPoolUserData() {
  if (!account.value) {
    backendPoolUserInfo.value = null;
    pendingRewards.value = 0n;
    historicalIncome.value = 0n;
    return;
  }

  try {
    const data = await fetchBackendUserInfo(account.value);
    backendPoolUserInfo.value = data ?? null;
    pendingRewards.value = data?.totalIncome ? BigInt(data.totalIncome) : 0n;
    historicalIncome.value = data?.historicalIncome ? BigInt(data.historicalIncome) : 0n;
  } catch {
    backendPoolUserInfo.value = null;
    pendingRewards.value = 0n;
    historicalIncome.value = 0n;
  }
}

async function fetchCompoundData() {
  if (!account.value) {
    compoundRatio.value = 0;
    compoundThreshold.value = 50;
    return;
  }

  const [configResult, ratioResult] = await Promise.allSettled([
    getCompoundConfig(),
    getCompoundRatio(account.value),
  ]);

  if (configResult.status === "fulfilled") {
    const parsedThreshold = Number.parseInt(
      String(configResult.value?.compoundMedalK ?? "50"),
      10,
    );
    compoundThreshold.value = Number.isFinite(parsedThreshold)
      ? parsedThreshold
      : 50;
  } else {
    compoundThreshold.value = 50;
  }

  if (ratioResult.status === "fulfilled") {
    const parsedRatio = Number.parseInt(
      String(ratioResult.value?.compoundRatio ?? "0"),
      10,
    );
    compoundRatio.value = Number.isFinite(parsedRatio) ? parsedRatio : 0;
  } else {
    compoundRatio.value = 0;
  }
}

async function fetchVipData() {
  try {
    const info = await getSubPoolInfo();
    vipCurrentApr.value = info?.apr ?? info?.apy ?? "";
  } catch {
    vipCurrentApr.value = "";
  }

  if (!account.value) {
    vipPendingRewards.value = 0n;
    vipTotalClaimed.value = 0n;
    return;
  }

  try {
    const data = await getSubPoolUserInfo(account.value);
    vipPendingRewards.value = data?.pendingRewards ? BigInt(data.pendingRewards) : 0n;
    vipTotalClaimed.value = data?.totalClaimed ? BigInt(data.totalClaimed) : 0n;
  } catch {
    vipPendingRewards.value = 0n;
    vipTotalClaimed.value = 0n;
  }
}

async function fetchEliteData() {
  try {
    const info = await getElitePoolInfo();
    eliteCurrentApr.value = info?.apr ?? info?.apy ?? "";
  } catch {
    eliteCurrentApr.value = "";
  }

  if (!account.value) {
    elitePendingRewards.value = 0n;
    eliteHistoricalIncome.value = 0n;
    return;
  }

  const [userInfoResult, pendingRewardsResult] = await Promise.allSettled([
    getElitePoolUserInfo(account.value),
    getElitePoolPendingRewards(account.value),
  ]);

  const userData = userInfoResult.status === "fulfilled"
    ? userInfoResult.value
    : null;
  const rewardsData = pendingRewardsResult.status === "fulfilled"
    ? pendingRewardsResult.value
    : null;

  elitePendingRewards.value = parseBackendAmount(
    rewardsData?.pendingRewards ?? userData?.totalIncome ?? 0,
  );
  eliteHistoricalIncome.value = parseBackendAmount(
    userData?.historicalIncome ?? userData?.totalClaimed ?? 0,
  );
}

async function fetchIncubatorData() {
  if (!account.value) {
    incubatorDeposit.value = 0n;
    incubatorAverage.value = 0n;
    incubatorQuotaToday.value = 0n;
    incubatorTotalIncubated.value = 0n;
    return;
  }

  try {
    const data = await getIncubatorProfile(account.value);
    incubatorDeposit.value = parseBackendAmount(
      data?.myInjectionWei ?? data?.userTotalInjectionWei ?? 0,
    );
    incubatorAverage.value = parseBackendAmount(data?.nodeAvgInjectionWei ?? 0);
    incubatorQuotaToday.value = parseBackendAmount(data?.normalQuotaWei ?? 0);
    incubatorTotalIncubated.value =
      parseBackendAmount(data?.userTotalNormalConversionWei ?? 0)
      + parseBackendAmount(data?.userTotalLeaderConversionWei ?? 0);
  } catch {
    incubatorDeposit.value = 0n;
    incubatorAverage.value = 0n;
    incubatorQuotaToday.value = 0n;
    incubatorTotalIncubated.value = 0n;
  }
}

async function fetchCirculatingSupply() {
  if (!ADDRESSES.barkX) {
    circulatingSupply.value = 0n;
    return;
  }

  try {
    const client = getPublicClient();
    const bypassAddresses = barkxBypassSupplyAddresses.value;
    const results = await client.multicall({
      contracts: [
        { address: ADDRESSES.barkX, abi: BarkXAbi, functionName: "totalSupply" },
        ...bypassAddresses.map((address) => ({
          address: ADDRESSES.barkX,
          abi: BarkXAbi,
          functionName: "balanceOf",
          args: [address],
        })),
      ],
    });

    const totalSupply = results[0].result ?? 0n;
    const bypassSupply = results
      .slice(1)
      .reduce((sum, result) => sum + (result.result ?? 0n), 0n);
    circulatingSupply.value = totalSupply > bypassSupply ? totalSupply - bypassSupply : 0n;
  } catch {
    circulatingSupply.value = 0n;
  }
}

async function loadData() {
  if (!walletConnected.value || !walletIsTargetChain.value || !account.value) {
    pendingRewards.value = 0n;
    historicalIncome.value = 0n;
    currentApr.value = "";
    compoundThreshold.value = 50;
    compoundRatio.value = 0;
    backendPoolUserInfo.value = null;
    vipPendingRewards.value = 0n;
    vipTotalClaimed.value = 0n;
    vipCurrentApr.value = "";
    eliteCurrentApr.value = "";
    elitePendingRewards.value = 0n;
    eliteHistoricalIncome.value = 0n;
    incubatorDeposit.value = 0n;
    incubatorAverage.value = 0n;
    incubatorQuotaToday.value = 0n;
    incubatorTotalIncubated.value = 0n;
    circulatingSupply.value = 0n;
    elitePoolData.reset();
    balances.reset();
    closeModal();
    return;
  }

  await Promise.allSettled([
    poolData.fetchAll(account.value),
    balances.fetchBalances(account.value),
    subPoolData.fetchAll(account.value),
    elitePoolData.fetchAll(account.value),
    fetchPoolApr(),
    fetchMainPoolUserData(),
    fetchCompoundData(),
    fetchVipData(),
    fetchEliteData(),
    fetchCirculatingSupply(),
  ]);
}

watch([walletConnected, walletIsTargetChain, account], loadData, { immediate: true });

// Public on-chain reads (price + circulating supply / market cap) do not need a
// connected wallet — load them on mount so the dashboard metrics wire up for
// anonymous visitors too.
async function loadPublicData() {
  await Promise.allSettled([poolData.fetchPrice(), fetchCirculatingSupply()]);
}
loadPublicData();

function openModal(key) {
  document.body.style.overflow = "hidden";
  activeModalKey.value = key;
}

function closeModal() {
  document.body.style.overflow = "";
  activeModalKey.value = "";
}

function openQuickStart() {
  document.body.style.overflow = "hidden";
  quickStartOpen.value = true;
}

function closeQuickStart() {
  document.body.style.overflow = "";
  quickStartOpen.value = false;
}

function openWeightModal() {
  document.body.style.overflow = "hidden";
  isWeightModalOpen.value = true;
}

function closeWeightModal() {
  document.body.style.overflow = "";
  isWeightModalOpen.value = false;
}

onBeforeUnmount(() => {
  document.body.style.overflow = "";
});

function buildModalRow(label, value) {
  return `
    <div class="data-row" style="padding: 4px 0; border: none;">
      <span class="data-lbl">${label}</span>
      <div style="text-align: right">
        <div class="data-val" style="color: var(--green)">${value}</div>
      </div>
    </div>
  `;
}

function parseBackendAmount(value) {
  if (value === null || value === undefined || value === "") {
    return 0n;
  }

  const raw = String(value);
  const normalized = raw.includes(".") ? raw.split(".")[0] : raw;

  try {
    return BigInt(normalized || "0");
  } catch {
    return 0n;
  }
}

function formatBoostedApr(rawApr, boost = 1) {
  const raw = Number(rawApr);
  if (!Number.isFinite(raw) || raw <= 0) {
    return "—";
  }

  return `${truncateFixed(raw * 100 * boost, 2)}%`;
}

function uniqueAddresses(addresses) {
  const seen = new Set();

  return addresses.reduce((result, address) => {
    if (!address || !isAddress(address)) {
      return result;
    }

    const normalizedAddress = getAddress(address);
    const key = normalizedAddress.toLowerCase();
    if (seen.has(key)) {
      return result;
    }

    seen.add(key);
    result.push(normalizedAddress);
    return result;
  }, []);
}

function formatCompactUsd(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "—";
  }

  if (value >= 1_000_000_000_000) {
    return `$${truncateFixed(value / 1_000_000_000_000, 2)}T`;
  }

  if (value >= 1_000_000_000) {
    return `$${truncateFixed(value / 1_000_000_000, 2)}B`;
  }

  if (value >= 1_000_000) {
    return `$${truncateFixed(value / 1_000_000, 2)}M`;
  }

  if (value >= 1_000) {
    return `$${truncateFixed(value / 1_000, 2)}K`;
  }

  return `$${truncateFixed(value, 2)}`;
}
</script>

<style scoped>
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.metric-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
}

.metric-val {
  font-family: "JetBrains Mono", monospace;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.metric-val--gold {
  color: #ffd700;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
}

.metric-lbl {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-top: 4px;
  letter-spacing: 0.5px;
}

.data-lbl {
  color: #ffffff !important;
}

.quick-start-entry {
  display: block;
  width: 100%;
  padding: 16px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, var(--cyan) 0%, #0ea5e9 100%);
  color: #000;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 0 20px var(--cyan-glow);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.quick-start-entry:hover:not(:disabled) {
  box-shadow: 0 0 28px var(--cyan-glow);
}

.quick-start-entry:active:not(:disabled) {
  transform: scale(0.99);
}

/* Locked at >90% quota usage: still readable, but plainly not a target. */
.quick-start-entry:disabled {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.45);
  box-shadow: none;
  cursor: not-allowed;
}

.clickable-card {
  cursor: pointer;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  position: relative;
}

.clickable-card.purple:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(168, 85, 247, 0.15);
}

.clickable-card.cyan:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(56, 189, 248, 0.15);
}

.clickable-card.green:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(34, 197, 94, 0.15);
}

.card-top-tools {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-corner-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color 0.3s ease;
}

.status-active {
  color: var(--green);
}

.status-inactive {
  color: var(--text-muted);
}

.info-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  color: var(--text-muted);
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
}

.card-top-tools .info-icon {
  position: static;
}

.clickable-card.purple:hover .card-corner-badge,
.clickable-card.purple:hover .info-icon {
  color: #c084fc;
}

.clickable-card.green:hover .info-icon {
  color: var(--green);
}

.clickable-card.cyan:hover .info-icon {
  color: var(--cyan);
  opacity: 1;
}

.ext-link-inline {
  color: var(--cyan);
  text-decoration: none;
  transition: color 0.3s ease;
}

.ext-link-inline:hover {
  color: #fff;
  text-decoration: underline;
}

.rate-crossfade-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 24px;
}

.rate-cf-1,
.rate-cf-2 {
  display: inline-block;
  white-space: nowrap;
}

.rate-cf-2 {
  position: absolute;
}

@keyframes cf-slide-1 {
  0%,
  42% {
    opacity: 1;
    transform: translateY(0);
  }

  48%,
  50% {
    opacity: 0;
    transform: translateY(-8px);
  }

  51%,
  91% {
    opacity: 0;
    transform: translateY(8px);
  }

  98%,
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cf-slide-2 {
  0%,
  41% {
    opacity: 0;
    transform: translateY(8px);
  }

  48%,
  91% {
    opacity: 1;
    transform: translateY(0);
  }

  98%,
  100% {
    opacity: 0;
    transform: translateY(-8px);
  }
}

.rate-cf-1 {
  animation: cf-slide-1 6s infinite cubic-bezier(0.4, 0, 0.2, 1);
}

.rate-cf-2 {
  animation: cf-slide-2 6s infinite cubic-bezier(0.4, 0, 0.2, 1);
}

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
}

.custom-modal {
  width: 88%;
  max-width: 360px;
  background: #111827;
  border: 1px solid var(--cyan);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.9);
}

.custom-modal.purple-theme {
  border-color: #c084fc;
}

.custom-modal.green-theme {
  border-color: var(--green);
}

.custom-modal.cyan-theme {
  border-color: var(--cyan);
}

.custom-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.3s ease;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
}

.custom-modal.purple-theme .custom-modal-close:hover {
  color: #c084fc;
}

.custom-modal.green-theme .custom-modal-close:hover {
  color: var(--green);
}

.custom-modal.cyan-theme .custom-modal-close:hover {
  color: var(--cyan);
}

.custom-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-right: 24px;
}

.custom-modal-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.custom-modal-text :deep(strong) {
  color: var(--text-primary);
}

.custom-modal-text :deep(.modal-inner-card) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.custom-modal-text :deep(.modal-inner-card:last-child) {
  margin-bottom: 0;
}

.custom-modal-text :deep(.data-lbl) {
  color: #ffffff !important;
}

.custom-modal-fade-enter-active,
.custom-modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.custom-modal-fade-enter-from,
.custom-modal-fade-leave-to {
  opacity: 0;
}

.custom-modal-fade-enter-from .custom-modal,
.custom-modal-fade-leave-to .custom-modal {
  transform: translateY(20px);
}
</style>
