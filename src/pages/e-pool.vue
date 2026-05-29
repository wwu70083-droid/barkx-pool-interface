<template>
  <MiningShell class="elite-pool-theme">
    <Transition name="custom-modal-fade">
      <div
        v-if="isEstimateModalOpen"
        class="custom-modal-overlay"
        @click="closeEstimateModal"
      >
        <div
          class="custom-modal cyan-theme"
          @click.stop
        >
          <button
            class="custom-modal-close"
            type="button"
            :aria-label="$t('common.modals.close')"
            @click="closeEstimateModal"
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
          <div class="custom-modal-title">{{ $t("pages.ePool.estimate.title") }}</div>
          <div class="custom-modal-text" v-html="estimateModalContent"></div>
        </div>
      </div>
    </Transition>

    <div style="text-align: center; margin-bottom: 20px; position: relative">
      <h1 style="font-size: 28px; color: var(--text-primary)">
        {{ $t("pages.ePool.title") }}
      </h1>
      <p style="color: var(--text-muted); font-size: 14px">
        {{ $t("pages.ePool.subtitle") }}
      </p>

    </div>

    <div class="tabs">
      <div class="tab" :class="{ active: activeTab === 'dep-vn' }" @click="activeTab = 'dep-vn'">
        {{ $t("pages.ePool.tabs.depositVn") }}
      </div>
      <div class="tab" :class="{ active: activeTab === 'dep-vbarkx' }" @click="activeTab = 'dep-vbarkx'">
        {{ $t("pages.ePool.tabs.depositVbarkx") }}
      </div>
      <div class="tab" :class="{ active: activeTab === 'withdraw' }" @click="activeTab = 'withdraw'">
        {{ $t("pages.ePool.tabs.withdraw") }}
      </div>
      <div class="tab" :class="{ active: activeTab === 'rewards' }" @click="activeTab = 'rewards'">
        {{ $t("pages.ePool.tabs.rewards") }}
      </div>
    </div>

    <div class="panel" :class="{ active: activeTab === 'dep-vn' }">
      <div class="info-box">
        {{ $t("pages.ePool.depositVn.info") }}
      </div>

      <div class="stats-grid three-cols">
        <div class="stat-card">
          <div class="stat-card-title">{{ $t("pages.ePool.common.apr") }}</div>
          <div class="stat-card-value green">{{ aprDisplay }}</div>
        </div>
        <div class="stat-card interactive" :title="$t('pages.ePool.common.nodeBoostTitle')" @click="router.push('/node-boost')">
          <div class="stat-card-title">{{ $t("nav.nodeBoost") }}</div>
          <div class="stat-card-value amber stat-card-value--interactive">
            x{{ nodeBoostMultiplier.toFixed(2) }}
            <svg
              class="stat-card-inline-icon"
              width="14"
              height="14"
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
        <div class="stat-card">
          <div class="stat-card-title">{{ $t("pages.ePool.common.lockPeriod") }}</div>
          <div class="stat-card-value" style="color: var(--text-primary)">
            {{ lockPeriodDisplay }}
          </div>
        </div>
      </div>

      <div class="input-group" style="margin-top: 16px">
        <div class="input-header">
          <span>{{ $t("pages.ePool.depositVn.depositNewVn") }}</span>
          <span>{{ $t("common.balance", { amount: formatIntegerAmount(vnBalance) }) }}</span>
        </div>
        <div class="input-row">
          <input
            v-model="depVnInput"
            type="text"
            inputmode="numeric"
            class="input-field"
            placeholder="0"
          />
          <div class="asset-badge">VN</div>
        </div>
        <div class="percent-btns">
          <button class="p-btn" type="button" @click="setMaxVN">
            {{ $t("common.max") }}
          </button>
        </div>
      </div>

      <div class="data-row">
        <span class="data-lbl">{{ $t("pages.ePool.depositVn.capIncrease") }}</span>
        <span class="data-val highlight">+{{ formatTokenAmount(vnCapIncrease, 18, 6) }} LP</span>
      </div>

      <ApprovalActionGroup
        :requirements="depositVnRequirements"
        :check-handler="checkDepositVnApproval"
        :approve-handler="handleDepositVnApprove"
        :action-label="$t('pages.ePool.depositVn.action')"
        :action-disabled="depositVnDisabled"
        :action-pending-text="$t('pages.ePool.depositVn.pending')"
        @action="handleDepositVN"
      />
      <div
        style="
          text-align: center;
          margin-top: 12px;
          font-size: 12px;
          color: var(--text-muted);
        "
      >
        {{ unlockLaterText }}
      </div>
    </div>

    <div class="panel" :class="{ active: activeTab === 'dep-vbarkx' }">
      <div class="info-box">
        {{ $t("pages.ePool.depositVbarkx.infoBefore") }}
        <strong style="color: var(--cyan); text-shadow: 0 0 10px var(--cyan-glow)">1:1</strong>{{ $t("pages.ePool.depositVbarkx.infoAfter") }}
      </div>

      <div class="stats-grid three-cols">
        <div class="stat-card">
          <div class="stat-card-title">{{ $t("pages.ePool.common.apr") }}</div>
          <div class="stat-card-value green">{{ aprDisplay }}</div>
        </div>
        <div class="stat-card interactive" :title="$t('pages.ePool.common.nodeBoostTitle')" @click="router.push('/node-boost')">
          <div class="stat-card-title">{{ $t("nav.nodeBoost") }}</div>
          <div class="stat-card-value amber stat-card-value--interactive">
            x{{ nodeBoostMultiplier.toFixed(2) }}
            <svg
              class="stat-card-inline-icon"
              width="14"
              height="14"
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
        <div class="stat-card">
          <div class="stat-card-title">{{ $t("pages.ePool.common.lockPeriod") }}</div>
          <div class="stat-card-value" style="color: var(--text-primary)">
            {{ lockPeriodDisplay }}
          </div>
        </div>
      </div>

      <div class="input-group" style="margin-top: 16px">
        <div class="input-header">
          <span>{{ $t("pages.ePool.depositVbarkx.depositVbarkx") }}</span>
          <span>{{ $t("common.balance", { amount: formatTokenAmount(vBarkxBalance, 18, 2) + ' vBARKX' }) }}</span>
        </div>
        <div class="input-row">
          <input
            v-model="depVBarkxInput"
            type="text"
            inputmode="decimal"
            class="input-field"
            placeholder="0.00"
            @input="normalizeVBarkxInput"
          />
          <div class="asset-badge">vBARKX</div>
        </div>
        <div class="percent-btns">
          <button class="p-btn" type="button" @click="setMaxVBarkx">
            {{ $t("common.max") }}
          </button>
        </div>
      </div>

      <div
        style="
          text-align: center;
          color: var(--text-muted);
          font-size: 24px;
          margin: 8px 0;
        "
      >
        &darr;
      </div>

      <div class="input-group" style="margin-top: 8px; border-color: var(--cyan)">
        <div class="input-header">
          <span style="color: var(--cyan); font-weight: 600">{{ $t("pages.ePool.depositVbarkx.convertToDeposit") }}</span>
          <span>{{ $t("pages.ePool.common.barkxPrice", { price: barkxPriceDisplay }) }}</span>
        </div>
        <div class="input-row">
          <input
            :value="convertedAmount"
            type="text"
            class="input-field"
            placeholder="0.00"
            readonly
            style="color: var(--cyan)"
          />
          <div class="asset-badge">BARKX</div>
        </div>
      </div>

      <div
        style="
          text-align: center;
          color: var(--text-muted);
          font-size: 24px;
          margin: 8px 0;
        "
      >
        +
      </div>

      <div class="input-group" style="margin-top: 8px">
        <div class="input-header">
          <span>{{ $t("pages.ePool.depositVbarkx.pairingWith") }}</span>
          <span>{{ $t("common.balance", { amount: formatTokenAmount(usdtBalance, 6, 2) + ' USDT' }) }}</span>
        </div>
        <div class="input-row">
          <input
            :value="pairingUsdtAmount"
            type="text"
            class="input-field"
            placeholder="0.00"
            readonly
          />
          <div class="asset-badge">USDT</div>
        </div>
      </div>

      <div class="data-row" style="margin-top: 16px">
        <span class="data-lbl">{{ $t("pages.ePool.depositVbarkx.predictedLp") }}</span>
        <span class="data-val highlight">~{{ predictedLpAmount }} LP</span>
      </div>

      <ApprovalActionGroup
        :requirements="depositVbarkxRequirements"
        :check-handler="checkDepositVbarkxApproval"
        :approve-handler="handleDepositVbarkxApprove"
        :action-label="depositVBarkxButtonLabel"
        :action-disabled="depositVBarkxDisabled"
        :action-pending-text="$t('pages.ePool.depositVbarkx.pending')"
        @action="handleDepositVBarkx"
      />
      <div
        style="
          text-align: center;
          margin-top: 12px;
          font-size: 12px;
          color: var(--text-muted);
        "
      >
        {{ unlockLaterText }}
      </div>
    </div>

    <div class="panel" :class="{ active: activeTab === 'withdraw' }">
      <div class="info-box amber">
        {{ $t("pages.ePool.withdraw.info") }}
      </div>

      <div class="withdraw-select-row">
        <label class="withdraw-select-all">
          <input
            type="checkbox"
            :checked="allOnPageSelected"
            @change="setCurrentPageSelected($event.target.checked)"
          />
          {{ $t("pages.ePool.withdraw.selectAllCurrentPage") }}
        </label>
      </div>

      <div class="order-list">
        <div
          v-for="record in pagedRecords"
          :key="record.key"
          class="order-item"
          :class="{ 'is-selected': selectedRecords.has(record.key) }"
          @click="toggleRecord(record.key)"
        >
          <input
            type="checkbox"
            class="order-checkbox"
            :checked="selectedRecords.has(record.key)"
            @click.stop
            @change="setRecordSelected(record.key, $event.target.checked)"
          />
          <div class="order-details-left">
            <div class="order-id">{{ record.id }}</div>
            <div class="order-status is-unlocked">{{ $t("pages.ePool.withdraw.statusUnlocked") }}</div>
          </div>
          <div class="order-assets-right">
            <div v-if="record.type === 'vn'" class="asset-line">{{ formatIntegerAmount(record.vnAmount) }} VN</div>
            <div v-if="record.type === 'lp'" class="asset-line">{{ formatTokenAmount(record.lpAmount, 18, 6) }} LP</div>
          </div>
        </div>
      </div>

      <div class="pagination">
        <button class="page-btn" type="button" :disabled="currentPage <= 1" @click="currentPage -= 1">
          &#10094;
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="page-btn" type="button" :disabled="currentPage >= totalPages" @click="currentPage += 1">
          &#10095;
        </button>
      </div>

      <div class="withdraw-summary-card">
        <div class="withdraw-summary-title">{{ $t("pages.ePool.withdraw.selectedSummary") }}</div>
        <div class="data-row" style="padding: 4px 0; border: none">
          <span class="data-lbl">{{ $t("pages.ePool.withdraw.totalVn") }}</span>
          <span class="data-val highlight" style="color: var(--cyan); font-size: 16px">
            {{ formatIntegerAmount(selectedSummary.totalVn) }} VN
          </span>
        </div>
        <div class="data-row" style="padding: 4px 0; border: none">
          <span class="data-lbl">{{ $t("pages.ePool.withdraw.totalLp") }}</span>
          <span class="data-val highlight" style="color: var(--cyan); font-size: 16px">
            {{ formatTokenAmount(selectedSummary.totalLp, 18, 6) }} LP
          </span>
        </div>
        <div class="data-row" style="padding: 4px 0; border: none">
          <span class="data-lbl">{{ $t("pages.ePool.withdraw.capDecrease") }}</span>
          <span class="data-val" style="color: var(--amber); font-size: 16px">
            -{{ formatTokenAmount(selectedSummary.capDecrease, 18, 6) }} LP
          </span>
        </div>
      </div>

      <button
        class="btn-submit amber"
        type="button"
        :disabled="selectedRecords.size === 0"
        style="margin-top: 16px"
        @click="handleWithdrawSelected"
      >
        {{ $t("pages.ePool.withdraw.withdrawSelected") }}
      </button>
    </div>

    <div class="panel" :class="{ active: activeTab === 'rewards' }">
      <div class="info-box">
        {{ $t("pages.ePool.rewards.info") }}
      </div>

      <div
        style="
          text-align: center;
          padding: 20px 0;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          border: 1px solid var(--border-dark);
          margin-bottom: 20px;
        "
      >
        <div
          style="
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 12px;
        "
      >
          {{ $t("pages.ePool.rewards.autoAccumulated") }}
        </div>
        <div
          style="
            font-size: 12px;
            color: var(--text-muted);
            text-transform: uppercase;
        "
      >
          {{ $t("pages.ePool.rewards.pendingRewards") }}
        </div>
        <div class="rewards-big-value">
          {{ pendingRewardsAmount }} <span class="rewards-big-unit">BARKX</span>
        </div>
      </div>

      <div
        style="
          border: 1px solid var(--border-dark);
          border-radius: 12px;
          padding: 16px;
        "
      >
        <div style="font-weight: 600; margin-bottom: 10px">
          {{ $t("pages.ePool.rewards.directClaim") }}
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.ePool.rewards.feeRate") }}</span>
          <span class="data-val green">0.00%</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.ePool.rewards.receivingAmount") }}</span>
          <span class="data-val">{{ pendingRewardsAmount }} BARKX</span>
        </div>
        <button
          class="btn-submit"
          type="button"
          :disabled="rewardsDisabled"
          style="margin-top: 10px"
          @click="handleClaim"
        >
          {{ claimButtonLabel }}
        </button>
      </div>
    </div>

    <div class="card" style="margin-top: 24px; border-color: var(--border-glow)">
      <div class="card-title" style="color: var(--cyan); border-bottom-color: var(--border-glow)">
        {{ $t("pages.ePool.depositStatus.title") }}
      </div>

      <div class="data-row">
        <span class="data-lbl">{{ $t("pages.ePool.depositStatus.vectorNexus") }}</span>
        <span class="data-val">{{ formatIntegerAmount(userInfo.vnStaked) }} VN</span>
      </div>

      <div class="data-row" style="align-items: flex-start">
        <span class="data-lbl">{{ $t("pages.ePool.depositStatus.lpToken") }}</span>
        <div style="text-align: right">
          <div class="data-val">{{ formatTokenAmount(userInfo.stakedLP, 18, 6) }} LP</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px">
            {{ stakedLpUsdDisplay }}
          </div>
        </div>
      </div>

      <div class="data-row" style="align-items: flex-start; border-bottom: none">
        <span class="data-lbl">{{ $t("pages.ePool.depositStatus.lpCap") }}</span>
        <div style="text-align: right">
          <div class="data-val">{{ formatTokenAmount(lpCap, 18, 6) }} LP</div>
          <div
            style="
              font-size: 12px;
              color: var(--green);
              margin-top: 4px;
              font-weight: 500;
            "
          >
            {{ $t("pages.ePool.depositStatus.unusedCap", { amount: formatTokenAmount(lpCapUnused, 18, 6) }) }}
          </div>
        </div>
      </div>

      <div
        v-if="hasUnusedLpCapacity"
        style="
          background: rgba(20, 184, 166, 0.1);
          border: 1px dashed var(--cyan);
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
          font-size: 13px;
          color: var(--text-secondary);
          text-align: center;
        "
      >
        &#128161; {{ $t("pages.ePool.depositStatus.note") }}
        <span
          style="color: var(--cyan); cursor: pointer; text-decoration: underline"
          @click="activateDepositMoreLp"
        >
          {{ $t("pages.ePool.depositStatus.cta") }}
        </span>
        {{ $t("pages.ePool.depositStatus.tail") }}
      </div>

      <button
        class="btn-submit"
        style="margin-top: 16px"
        type="button"
        @click="openEstimateModal"
      >
        {{ $t("pages.ePool.depositStatus.estimate") }}
      </button>
    </div>

    <div class="collapsible-card">
      <div class="collapsible-header" @click="leaderboardOpen = !leaderboardOpen">
        <span style="display: flex; align-items: center; gap: 8px">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          {{ $t("pages.ePool.leaderboard.title") }}
        </span>
        <span class="chevron" :class="{ up: leaderboardOpen }">&#9660;</span>
      </div>
      <div class="collapsible-content" :class="{ show: leaderboardOpen }">
        <div class="sub-tab-container">
          <button
            class="sub-tab-btn"
            :class="{ active: leaderboardTab === 'burn' }"
            type="button"
            @click="leaderboardTab = 'burn'"
          >
            {{ $t("pages.ePool.leaderboard.topBurn") }}
          </button>
          <button
            class="sub-tab-btn"
            :class="{ active: leaderboardTab === 'deposit' }"
            type="button"
            @click="leaderboardTab = 'deposit'"
          >
            {{ $t("pages.ePool.leaderboard.topDeposit") }}
          </button>
        </div>

        <div class="sub-panel" :style="{ display: leaderboardTab === 'burn' ? 'block' : 'none' }">
          <div class="lb-list">
            <div v-for="item in burnLeaderboard" :key="`burn-${item.rank}`" class="lb-item" :class="`top-${item.rank}`">
              <span class="lb-rank">{{ item.rank }}</span>
              <span class="lb-address">{{ item.address }}</span>
              <span class="lb-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <div class="sub-panel" :style="{ display: leaderboardTab === 'deposit' ? 'block' : 'none' }">
          <div class="lb-list">
            <div v-for="item in depositLeaderboard" :key="`deposit-${item.rank}`" class="lb-item" :class="`top-${item.rank}`">
              <span class="lb-rank">{{ item.rank }}</span>
              <span class="lb-address">{{ item.address }}</span>
              <span class="lb-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MiningShell>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { formatUnits, maxUint256 } from "viem";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import MiningShell from "@/components/mining/MiningShell.vue";
import ApprovalActionGroup from "@/components/mining/ApprovalActionGroup.vue";
import { useMainStore } from "@/store";
import { useElitePoolData } from "@/composables/useElitePoolData";
import { useApproval } from "@/composables/useApproval";
import { useNotice } from "@/composables/useNotice";
import { useUniswapV2 } from "@/composables/useUniswapV2";
import {
  getElitePoolInfo,
  getElitePoolPendingRewards,
  getElitePoolTopBurn,
  getElitePoolTopDeposit,
  getElitePoolUnlockedLP,
  getElitePoolUnlockedVN,
  getElitePoolUserInfo,
  requestElitePoolClaimSignature,
} from "@/composables/useElitePoolBackend";
import { getUserInfo as getMainPoolUserInfo } from "@/composables/useBackend";
import {
  ADDRESSES,
  getGasOverrides,
  getPublicClient,
  getWalletClient,
  waitForTx,
  writeContractWithGasBuffer,
} from "@/composables/useContracts";
import { BarkXElitePoolAbi } from "@/abi";
import {
  formatIntegerAmount,
  formatTokenAmount,
  parseContractErrorKey,
  safeParseUnits,
  shortenAddress,
  truncateFixed,
} from "@/utils/format";

const { t } = useI18n({ useScope: "global" });
const router = useRouter();
const store = useMainStore();
const { account, walletConnected, walletIsTargetChain } = storeToRefs(store);
const elitePoolData = useElitePoolData();
const approval = useApproval();
const uniswap = useUniswapV2();
const { showNotice } = useNotice();
const ELITE_THEME_VARS = {
  "--cyan": "#14b8a6",
  "--cyan-glow": "rgba(20, 184, 166, 0.4)",
  "--purple": "#0ea5e9",
  "--green": "#10b981",
  "--green-glow": "rgba(16, 185, 129, 0.4)",
  "--amber": "#f59e0b",
  "--bg-dark": "#040909",
  "--bg-card": "rgba(10, 15, 15, 0.95)",
  "--bg-card-solid": "#0a0f0f",
  "--border-dark": "rgba(20, 184, 166, 0.15)",
  "--border-glow": "rgba(20, 184, 166, 0.35)",
};
const savedThemeVars = {};

const {
  userInfo,
  lpPerVN,
  lockPeriod,
  minDeposit,
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
} = elitePoolData;

const activeTab = ref("dep-vn");
const depVnInput = ref("");
const depVBarkxInput = ref("");
const leaderboardOpen = ref(false);
const leaderboardTab = ref("burn");
const currentPage = ref(1);
const selectedRecords = ref(new Set());
const locallyWithdrawnRecordKeys = ref(new Set());
const pendingRewardsServer = ref(0n);
const pendingRewardsOverride = ref(null);
const pendingRewards = computed(() =>
  pendingRewardsOverride.value ?? pendingRewardsServer.value,
);
const currentApr = ref("");
const backendUserInfo = ref(null);
const mainPoolUserInfo = ref(null);
const backendWithdrawRecords = ref([]);
const backendWithdrawRecordsLoaded = ref(false);
const burnLeaderboard = ref([]);
const depositLeaderboard = ref([]);
const isEstimateModalOpen = ref(false);

const PAGE_SIZE = 20;
const TX_DEADLINE_MINUTES = 20;
const DEFAULT_SLIPPAGE_BPS = 50n;
const MIN_REWARD_ACTION_AMOUNT = 1000000000000000000n;
const REWARD_DISPLAY_DECIMALS = 4;
const MIN_ESTIMATE_LP_CAP = 100000000000000n;
const PENDING_REWARDS_OVERRIDE_TTL_MS = 10 * 60 * 1000;
const PENDING_REWARDS_RESYNC_INTERVAL_MS = 3000;
const PENDING_REWARDS_RESYNC_MAX_ATTEMPTS = 10;
const ELITE_POOL_ERROR_TRANSLATION_KEYS = Object.freeze({
  BelowMinDeposit: "belowMinDeposit",
  InsufficientBalance: "insufficientBalance",
  InvalidBucket: "invalidBucket",
  InvalidParam: "invalidParam",
  InvalidSignature: "invalidSignature",
  LPCapExceeded: "lpCapExceeded",
  NoVNStaked: "noVnStaked",
  NothingToWithdraw: "nothingToWithdraw",
  Paused: "paused",
  SignatureExpired: "signatureExpired",
  SlippageExceeded: "slippageExceeded",
  StillLocked: "stillLocked",
  ZeroAmount: "zeroAmount",
});

let pendingRewardsOverrideTimer = null;
let pendingRewardsResyncTimer = null;
let pendingRewardsResyncAttempts = 0;

const depositVnRequirements = [
  { id: "elite:vn", label: "VN" },
];
const depositVbarkxRequirements = [
  { id: "elite:vbarkx", label: "vBARKX" },
  { id: "elite:usdt", label: "USDT" },
];

const aprDisplay = computed(() => {
  const raw = Number(currentApr.value);
  if (!Number.isFinite(raw) || raw <= 0) {
    return "—";
  }
  const pct = raw * 100;
  return `${truncateFixed(pct, 2)}%`;
});

const nodeBoostMultiplier = computed(() => {
  const nodeBoost = mainPoolUserInfo.value?.nodeBoost || {};
  const total = Number.parseFloat(String(nodeBoost.total ?? ""));
  if (Number.isFinite(total) && total > 0) {
    return total;
  }

  const bonusRate = Number.parseFloat(String(mainPoolUserInfo.value?.bonusRate ?? "0"));
  const penaltyRate = Number.parseFloat(String(mainPoolUserInfo.value?.penaltyRate ?? "0"));
  const safeBonusRate = Number.isFinite(bonusRate) ? bonusRate : 0;
  const safePenaltyRate = Number.isFinite(penaltyRate) ? penaltyRate : 0;
  const rawBoost = (1 + safeBonusRate) * (1 + safePenaltyRate);

  if (!Number.isFinite(rawBoost) || rawBoost <= 0) {
    return 1;
  }

  return Math.min(rawBoost, 2);
});

const lockPeriodDisplay = computed(() => formatLockPeriod(lockPeriod.value));
const unlockLaterText = computed(() => t("pages.ePool.common.unlockLater", { lockPeriod: lockPeriodDisplay.value }));
const barkxPriceDisplay = computed(() =>
  uniswap.barkxPrice.value > 0 ? truncateFixed(uniswap.barkxPrice.value, 3) : "—",
);
const estimateRemainingCap = computed(() =>
  lpCapUnused.value > 0n ? lpCapUnused.value : 0n,
);
const estimateBarkxPriceDisplay = computed(() => {
  const price = uniswap.barkxPrice.value;
  return Number.isFinite(price) && price > 0 ? price.toFixed(3) : "0.000";
});
const estimateModalContent = computed(() => {
  if (userInfo.value.vnStaked === 0n || estimateRemainingCap.value < MIN_ESTIMATE_LP_CAP) {
    return `
      <div style="text-align: center; padding: 20px 0;">
        <div style="font-size: 32px; margin-bottom: 12px;">💡</div>
        <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">
          ${t("pages.ePool.estimate.emptyMessage")}<br><br>
          ${t("pages.ePool.estimate.emptyActionBefore")} <strong>1 VN</strong> ${t("pages.ePool.estimate.emptyActionAfter")}
        </div>
      </div>
    `;
  }

  const estimatedAssets = getEstimatedAssetsForLp(estimateRemainingCap.value);

  return `
    <div class="modal-inner-card">
      <div class="data-row" style="padding: 4px 0; border: none;">
        <span class="data-lbl">${t("pages.ePool.estimate.barkxPrice")}</span>
        <span class="data-val" style="color: var(--text-primary);">${estimateBarkxPriceDisplay.value} USDT</span>
      </div>
      <div class="data-row" style="padding: 4px 0; border: none;">
        <span class="data-lbl">${t("pages.ePool.estimate.plannedLp")}</span>
        <span class="data-val" style="color: var(--cyan);">${formatTokenAmount(estimateRemainingCap.value, 18, 6)} LP</span>
      </div>
    </div>
    <div style="text-align: center; color: var(--text-muted); font-size: 20px; margin: 8px 0;">↓</div>
    <div class="modal-inner-card">
      <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px; text-align: center;">${t("pages.ePool.estimate.assetsRequired")}</div>
      <div style="text-align: center; padding: 8px 0;">
        <span style="color: var(--green); font-size: 24px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${estimatedAssets.barkx} vBARKX</span>
      </div>
      <div style="text-align: center; padding: 8px 0;">
        <span style="color: var(--green); font-size: 24px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${estimatedAssets.usdt} USDT</span>
      </div>
    </div>
  `;
});

const depVnAmount = computed(() => {
  const raw = String(depVnInput.value ?? "").trim();
  if (!/^\d+$/.test(raw)) {
    return null;
  }

  try {
    return BigInt(raw);
  } catch {
    return null;
  }
});

const depositVnDisabled = computed(() =>
  depVnAmount.value === null
  || depVnAmount.value <= 0n
  || depVnAmount.value > vnBalance.value
  || isPausedDepositVN.value,
);

const vnCapIncrease = computed(() => {
  if (depVnAmount.value === null || depVnAmount.value <= 0n) {
    return 0n;
  }

  return depVnAmount.value * lpPerVN.value;
});

const pagedRecords = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return withdrawRecords.value.slice(start, start + PAGE_SIZE);
});

const withdrawRecords = computed(() => {
  const locallyWithdrawnKeys = locallyWithdrawnRecordKeys.value;

  if (backendWithdrawRecordsLoaded.value) {
    return backendWithdrawRecords.value.filter(record => !locallyWithdrawnKeys.has(record.key));
  }

  const vnRecords = vnBuckets.value
    .filter(bucket => bucket.isUnlocked)
    .map(bucket => ({
      key: `vn-${bucket.idx}`,
      id: `VN #${bucket.idx}`,
      type: "vn",
      vnAmount: bucket.vnAmount,
      lpAmount: 0n,
      unlocksAt: bucket.unlocksAt,
    }));

  const lpRecords = lpBuckets.value
    .filter(bucket => bucket.isUnlocked)
    .map(bucket => ({
      key: `lp-${bucket.idx}`,
      id: `LP #${bucket.idx}`,
      type: "lp",
      vnAmount: 0n,
      lpAmount: bucket.lpAmount,
      unlocksAt: bucket.unlocksAt,
    }));

  return [...vnRecords, ...lpRecords]
    .filter(record => !locallyWithdrawnKeys.has(record.key))
    .sort((a, b) => Number(b.unlocksAt - a.unlocksAt));
});

const totalPages = computed(() => Math.max(1, Math.ceil(withdrawRecords.value.length / PAGE_SIZE)));

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value;
  }
});

const allOnPageSelected = computed(() =>
  pagedRecords.value.length > 0
  && pagedRecords.value.every(record => selectedRecords.value.has(record.key)),
);

const selectedSummary = computed(() =>
  withdrawRecords.value.reduce((summary, record) => {
    if (!selectedRecords.value.has(record.key)) {
      return summary;
    }

    summary.totalVn += record.vnAmount;
    summary.totalLp += record.lpAmount;
    summary.capDecrease += record.vnAmount * lpPerVN.value;
    return summary;
  }, { totalVn: 0n, totalLp: 0n, capDecrease: 0n }),
);

const depVBarkxAmount = computed(() =>
  safeParseUnits(String(depVBarkxInput.value ?? "").trim(), 18),
);

const minDepositAmount = computed(() => minDeposit.value);

const convertedAmount = computed(() =>
  depVBarkxAmount.value && depVBarkxAmount.value > 0n
    ? formatTokenAmount(depVBarkxAmount.value, 18, 2)
    : "",
);

const pairingUsdtAmountRaw = computed(() => {
  if (!depVBarkxAmount.value || depVBarkxAmount.value <= 0n) {
    return 0n;
  }

  if (uniswap.barkxReserve.value <= 0n || uniswap.usdtReserve.value <= 0n) {
    return 0n;
  }

  return depVBarkxAmount.value * uniswap.usdtReserve.value / uniswap.barkxReserve.value;
});

const pairingUsdtAmount = computed(() =>
  pairingUsdtAmountRaw.value > 0n ? formatTokenAmount(pairingUsdtAmountRaw.value, 6, 2) : "",
);

const predictedLpAmount = computed(() =>
  depVBarkxAmount.value && depVBarkxAmount.value > 0n && pairingUsdtAmountRaw.value > 0n
    ? uniswap.estimateAddLiquidityLP(depVBarkxAmount.value.toString(), pairingUsdtAmountRaw.value.toString())
    : "0.000000",
);

const predictedLpAmountRaw = computed(() =>
  safeParseUnits(predictedLpAmount.value, 18) ?? 0n,
);

const depositVBarkxDisabled = computed(() => {
  if (!depVBarkxAmount.value || depVBarkxAmount.value < minDepositAmount.value) {
    return true;
  }

  if (depVBarkxAmount.value > vBarkxBalance.value) {
    return true;
  }

  if (isPausedDepositLP.value || userInfo.value.vnStaked <= 0n) {
    return true;
  }

  if (pairingUsdtAmountRaw.value <= 0n || pairingUsdtAmountRaw.value > usdtBalance.value) {
    return true;
  }

  if (predictedLpAmountRaw.value <= 0n || predictedLpAmountRaw.value > lpCapUnused.value) {
    return true;
  }

  return false;
});

const depositVBarkxButtonLabel = computed(() =>
  !depVBarkxAmount.value || depVBarkxAmount.value < minDepositAmount.value
    ? t("pages.ePool.depositVbarkx.minimum", { amount: formatTokenAmount(minDepositAmount.value, 18, 0) })
    : t("pages.ePool.depositVbarkx.action"),
);

const pendingRewardsAmount = computed(() =>
  formatTokenAmount(pendingRewards.value, 18, REWARD_DISPLAY_DECIMALS),
);

const hasClaimableRewards = computed(() =>
  pendingRewards.value >= MIN_REWARD_ACTION_AMOUNT,
);

const rewardsDisabled = computed(() =>
  pendingRewards.value < MIN_REWARD_ACTION_AMOUNT || isPausedClaim.value,
);

const claimButtonLabel = computed(() =>
  hasClaimableRewards.value ? t("pages.ePool.rewards.claimToWallet") : t("pages.ePool.rewards.lessThanOneAction"),
);

const stakedLpUsdDisplay = computed(() => {
  if (userInfo.value.stakedLP <= 0n || uniswap.totalSupply.value <= 0n || uniswap.usdtReserve.value <= 0n) {
    return "≈ $0.00";
  }

  const usd =
    Number(userInfo.value.stakedLP)
    / Number(uniswap.totalSupply.value)
    * 2
    * Number(uniswap.usdtReserve.value)
    / 1e6;

  if (!Number.isFinite(usd) || usd <= 0) {
    return "≈ $0.00";
  }

  if (usd >= 1_000_000) {
    return `≈ $${truncateFixed(usd / 1_000_000, 2)}M`;
  }

  if (usd >= 1_000) {
    return `≈ $${truncateFixed(usd / 1_000, 2)}K`;
  }

  return `≈ $${truncateFixed(usd, 2)}`;
});

const hasUnusedLpCapacity = computed(() => lpCapUnused.value > 0n);

function normalizeVBarkxInput() {
  depVBarkxInput.value = normalizeDecimalInput(depVBarkxInput.value, 2);
}

function toggleRecord(key) {
  const next = new Set(selectedRecords.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  selectedRecords.value = next;
}

function setRecordSelected(key, checked) {
  const next = new Set(selectedRecords.value);
  if (checked) {
    next.add(key);
  } else {
    next.delete(key);
  }
  selectedRecords.value = next;
}

function setCurrentPageSelected(checked) {
  const next = new Set(selectedRecords.value);
  pagedRecords.value.forEach((record) => {
    if (checked) {
      next.add(record.key);
    } else {
      next.delete(record.key);
    }
  });
  selectedRecords.value = next;
}

function activateDepositMoreLp() {
  activeTab.value = "dep-vbarkx";
  window.scrollTo({ top: 0, left: 0 });
}

function openEstimateModal() {
  document.body.style.overflow = "hidden";
  isEstimateModalOpen.value = true;
}

function closeEstimateModal() {
  document.body.style.overflow = "";
  isEstimateModalOpen.value = false;
}

function getEstimatedAssetsForLp(lpAmount) {
  if (lpAmount <= 0n || uniswap.totalSupply.value <= 0n) {
    return { barkx: "0.00", usdt: "0.00" };
  }

  const neededBarkx = lpAmount * uniswap.barkxReserve.value / uniswap.totalSupply.value;
  const neededUsdt = lpAmount * uniswap.usdtReserve.value / uniswap.totalSupply.value;

  return {
    barkx: formatEstimateTokenAmount(neededBarkx, 18),
    usdt: formatEstimateTokenAmount(neededUsdt, 6),
  };
}

function formatEstimateTokenAmount(value, decimals) {
  const amount = Number(formatUnits(value, decimals));
  if (!Number.isFinite(amount) || amount <= 0) {
    return "0.00";
  }

  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function setMaxVN() {
  depVnInput.value = vnBalance.value > 0n ? vnBalance.value.toString() : "";
}

function setMaxVBarkx() {
  depVBarkxInput.value = formatInputAmount(vBarkxBalance.value, 18, 2);
}

function formatInputAmount(value, decimals = 18, displayDecimals = 2) {
  if (!value || value <= 0n) {
    return "";
  }

  const [intPart, decimalPart = ""] = formatUnits(value, decimals).split(".");
  const trimmedDecimals = decimalPart.slice(0, displayDecimals).replace(/0+$/, "");
  return trimmedDecimals ? `${intPart}.${trimmedDecimals}` : intPart;
}

function normalizeDecimalInput(value, maxDecimals = 2) {
  const cleaned = String(value ?? "").replace(/[^\d.]/g, "");
  const dotIndex = cleaned.indexOf(".");

  if (dotIndex === -1) {
    return cleaned;
  }

  const integerPart = cleaned.slice(0, dotIndex);
  const decimalPart = cleaned.slice(dotIndex + 1).replace(/\./g, "").slice(0, maxDecimals);
  return `${integerPart}.${decimalPart}`;
}

function formatLockPeriod(seconds) {
  const totalSeconds = Number(seconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return t("pages.ePool.time.fallback");
  }

  const days = Math.floor(totalSeconds / 86400);
  if (days > 0) {
    return t(days === 1 ? "pages.ePool.time.day" : "pages.ePool.time.days", { count: days });
  }

  const hours = Math.floor(totalSeconds / 3600);
  if (hours > 0) {
    return t(hours === 1 ? "pages.ePool.time.hour" : "pages.ePool.time.hours", { count: hours });
  }

  const minutes = Math.floor(totalSeconds / 60);
  if (minutes > 0) {
    return t(minutes === 1 ? "pages.ePool.time.minute" : "pages.ePool.time.minutes", { count: minutes });
  }

  return t("pages.ePool.time.lessThanMinute");
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

function normalizeBackendRecordAmount(value) {
  return parseBackendAmount(value);
}

function normalizeUnlockedVnRecord(record) {
  const idx = Number(record?.bucketIdx ?? 0);
  return {
    key: `vn-${idx}`,
    id: `VN #${idx}`,
    type: "vn",
    vnAmount: normalizeBackendRecordAmount(record?.vnAmount),
    lpAmount: 0n,
    unlocksAt: parseBackendAmount(record?.unlocksAt),
  };
}

function normalizeUnlockedLpRecord(record) {
  const idx = Number(record?.bucketIdx ?? 0);
  return {
    key: `lp-${idx}`,
    id: `LP #${idx}`,
    type: "lp",
    vnAmount: 0n,
    lpAmount: normalizeBackendRecordAmount(record?.lpAmount),
    unlocksAt: parseBackendAmount(record?.unlocksAt),
  };
}

function formatLeaderboardAddress(address) {
  return address ? shortenAddress(address, 2) : "—";
}

function normalizeTopBurnItem(item, index) {
  return {
    rank: Number(item?.rank ?? index + 1),
    address: formatLeaderboardAddress(item?.address),
    value: `${formatTokenAmount(parseBackendAmount(item?.totalBurned), 18, 0)} vBARKX`,
  };
}

function normalizeTopDepositItem(item, index) {
  return {
    rank: Number(item?.rank ?? index + 1),
    address: formatLeaderboardAddress(item?.address),
    value: `${formatTokenAmount(parseBackendAmount(item?.stakedLp), 18, 6)} LP`,
  };
}

function getErrorText(error, fallbackKey) {
  const translationKey = ELITE_POOL_ERROR_TRANSLATION_KEYS[parseContractErrorKey(error)];
  return translationKey ? t(`pages.ePool.errors.${translationKey}`) : t(fallbackKey);
}

function clearPendingRewardsOverride() {
  if (pendingRewardsOverrideTimer !== null) {
    window.clearTimeout(pendingRewardsOverrideTimer);
    pendingRewardsOverrideTimer = null;
  }
  pendingRewardsOverride.value = null;
}

function stopPendingRewardsResync() {
  if (pendingRewardsResyncTimer !== null) {
    window.clearTimeout(pendingRewardsResyncTimer);
    pendingRewardsResyncTimer = null;
  }
  pendingRewardsResyncAttempts = 0;
}

function setPendingRewardsOverride(value) {
  clearPendingRewardsOverride();
  pendingRewardsOverride.value = value;
  pendingRewardsOverrideTimer = window.setTimeout(() => {
    pendingRewardsOverride.value = null;
    pendingRewardsOverrideTimer = null;
  }, PENDING_REWARDS_OVERRIDE_TTL_MS);
}

function schedulePendingRewardsResync() {
  stopPendingRewardsResync();

  const run = async () => {
    pendingRewardsResyncTimer = null;
    pendingRewardsResyncAttempts += 1;

    await fetchBackendUserInfo();

    if (pendingRewardsOverride.value === null || pendingRewardsServer.value === 0n) {
      clearPendingRewardsOverride();
      stopPendingRewardsResync();
      return;
    }

    if (pendingRewardsResyncAttempts >= PENDING_REWARDS_RESYNC_MAX_ATTEMPTS) {
      stopPendingRewardsResync();
      return;
    }

    pendingRewardsResyncTimer = window.setTimeout(run, PENDING_REWARDS_RESYNC_INTERVAL_MS);
  };

  pendingRewardsResyncTimer = window.setTimeout(run, PENDING_REWARDS_RESYNC_INTERVAL_MS);
}

function settlePendingRewardsLocally() {
  pendingRewardsServer.value = 0n;
  setPendingRewardsOverride(0n);
  schedulePendingRewardsResync();
}

function settleWithdrawRecordsLocally(records) {
  const withdrawnKeys = new Set(locallyWithdrawnRecordKeys.value);
  const nextSelected = new Set(selectedRecords.value);

  records.forEach((record) => {
    withdrawnKeys.add(record.key);
    nextSelected.delete(record.key);
  });

  locallyWithdrawnRecordKeys.value = withdrawnKeys;
  selectedRecords.value = nextSelected;
  backendWithdrawRecords.value = backendWithdrawRecords.value.filter(
    record => !withdrawnKeys.has(record.key),
  );
}

async function fetchBackendUserInfo() {
  if (!account.value) {
    backendUserInfo.value = null;
    pendingRewardsServer.value = 0n;
    clearPendingRewardsOverride();
    stopPendingRewardsResync();
    return;
  }

  try {
    const [userInfoResult, pendingRewardsResult] = await Promise.allSettled([
      getElitePoolUserInfo(account.value),
      getElitePoolPendingRewards(account.value),
    ]);

    const userData = userInfoResult.status === "fulfilled" ? userInfoResult.value : null;
    const rewardsData = pendingRewardsResult.status === "fulfilled" ? pendingRewardsResult.value : null;
    backendUserInfo.value = userData || null;
    pendingRewardsServer.value = parseBackendAmount(rewardsData?.pendingRewards ?? userData?.totalIncome ?? 0);
    if (pendingRewardsOverride.value !== null && pendingRewardsServer.value === 0n) {
      clearPendingRewardsOverride();
      stopPendingRewardsResync();
    }
  } catch (error) {
    if (error?.responseCode === 1002 || /user not found/i.test(error?.message || "")) {
      backendUserInfo.value = null;
      pendingRewardsServer.value = 0n;
      clearPendingRewardsOverride();
      stopPendingRewardsResync();
      return;
    }

    console.error("[elitePool] fetchBackendUserInfo failed:", error);
    backendUserInfo.value = null;
    pendingRewardsServer.value = 0n;
  }
}

async function fetchMainPoolUserInfo() {
  if (!account.value) {
    mainPoolUserInfo.value = null;
    return;
  }

  try {
    mainPoolUserInfo.value = await getMainPoolUserInfo(account.value) || null;
  } catch {
    mainPoolUserInfo.value = null;
  }
}

async function fetchApr() {
  try {
    const data = await getElitePoolInfo();
    currentApr.value = data?.apr ?? data?.apy ?? "";
  } catch (error) {
    console.error("[elitePool] fetchApr failed:", error);
    currentApr.value = "";
  }
}

async function fetchUnlockedRecords() {
  if (!account.value) {
    backendWithdrawRecords.value = [];
    backendWithdrawRecordsLoaded.value = true;
    return;
  }

  try {
    const [vnResult, lpResult] = await Promise.all([
      getElitePoolUnlockedVN(account.value),
      getElitePoolUnlockedLP(account.value),
    ]);
    backendWithdrawRecords.value = [
      ...(Array.isArray(vnResult) ? vnResult.map(normalizeUnlockedVnRecord) : []),
      ...(Array.isArray(lpResult) ? lpResult.map(normalizeUnlockedLpRecord) : []),
    ].sort((a, b) => Number(b.unlocksAt - a.unlocksAt));
    backendWithdrawRecordsLoaded.value = true;
  } catch (error) {
    console.error("[elitePool] fetchUnlockedRecords failed:", error);
    backendWithdrawRecords.value = [];
    backendWithdrawRecordsLoaded.value = false;
  }
}

async function fetchLeaderboards() {
  const [burnResult, depositResult] = await Promise.allSettled([
    getElitePoolTopBurn(),
    getElitePoolTopDeposit(),
  ]);

  burnLeaderboard.value = burnResult.status === "fulfilled" && Array.isArray(burnResult.value)
    ? burnResult.value.map(normalizeTopBurnItem)
    : [];
  depositLeaderboard.value = depositResult.status === "fulfilled" && Array.isArray(depositResult.value)
    ? depositResult.value.map(normalizeTopDepositItem)
    : [];
}

async function loadData() {
  await Promise.all([
    uniswap.fetchPair(),
    fetchApr(),
    fetchBackendUserInfo(),
    fetchMainPoolUserInfo(),
    fetchUnlockedRecords(),
    fetchLeaderboards(),
    walletConnected.value && walletIsTargetChain.value && account.value
      ? elitePoolData.fetchAll(account.value)
      : Promise.resolve().then(() => elitePoolData.reset()),
  ]);
}

function refreshPageDataInBackground() {
  loadData().catch((error) => {
    console.error("[elitePool] refresh failed:", error);
  });
}

async function checkDepositVnApproval() {
  return approval.isVnApprovedForElitePool();
}

async function handleDepositVnApprove() {
  const approved = await approval.approveVnForElitePool();
  if (approved) {
    refreshPageDataInBackground();
  }
  return approved;
}

async function checkDepositVbarkxApproval(requirement) {
  if (requirement.id === "elite:vbarkx") {
    return approval.isVbarkxApprovedForElitePool();
  }

  if (requirement.id === "elite:usdt") {
    return approval.isUsdtApprovedForElitePool();
  }

  return false;
}

async function handleDepositVbarkxApprove(requirement) {
  let approved = false;

  if (requirement.id === "elite:vbarkx") {
    approved = await approval.approveVbarkxForElitePool(maxUint256);
  } else if (requirement.id === "elite:usdt") {
    approved = await approval.approveUsdtForElitePool(maxUint256);
  }

  if (approved) {
    refreshPageDataInBackground();
  }

  return approved;
}

function getDepositVnPrecheckNotice() {
  if (isPausedDepositVN.value) {
    return t("pages.ePool.depositVn.paused");
  }

  return "";
}

function getDepositVbarkxPrecheckNotice() {
  if (isPausedDepositLP.value) {
    return t("pages.ePool.depositVbarkx.paused");
  }

  if (userInfo.value.vnStaked <= 0n) {
    return t("pages.ePool.depositVbarkx.depositVnFirst");
  }

  if (pairingUsdtAmountRaw.value <= 0n) {
    return t("pages.ePool.depositVbarkx.priceUnavailable");
  }

  if (pairingUsdtAmountRaw.value > usdtBalance.value) {
    return t("pages.ePool.depositVbarkx.insufficientUsdt");
  }

  if (predictedLpAmountRaw.value > lpCapUnused.value) {
    return t("pages.ePool.depositVbarkx.capExceeded");
  }

  return "";
}

function getWithdrawPrecheckNotice(selectedItems) {
  const hasVn = selectedItems.some(item => item.type === "vn");
  const hasLp = selectedItems.some(item => item.type === "lp");

  if (hasVn && isPausedWithdrawVN.value) {
    return t("pages.ePool.withdraw.vnPaused");
  }

  if (hasLp && isPausedWithdrawLP.value) {
    return t("pages.ePool.withdraw.lpPaused");
  }

  const totalSelectedVn = selectedItems.reduce((sum, item) => sum + item.vnAmount, 0n);
  const totalSelectedLp = selectedItems.reduce((sum, item) => sum + item.lpAmount, 0n);
  const remainingVn = userInfo.value.vnStaked > totalSelectedVn
    ? userInfo.value.vnStaked - totalSelectedVn
    : 0n;
  const remainingLp = userInfo.value.stakedLP > totalSelectedLp
    ? userInfo.value.stakedLP - totalSelectedLp
    : 0n;

  if (totalSelectedVn > 0n && remainingLp > remainingVn * lpPerVN.value) {
    return t("pages.ePool.withdraw.withdrawLpFirst");
  }

  return "";
}

async function handleDepositVN() {
  if (depositVnDisabled.value || depVnAmount.value === null || depVnAmount.value <= 0n) {
    return;
  }

  const notice = getDepositVnPrecheckNotice();
  if (notice) {
    showNotice({ outcome: "failure", text: notice });
    return;
  }

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.ePool.depositVn.pending") });
    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();

    await getPublicClient().simulateContract({
      address: ADDRESSES.elitePool,
      abi: BarkXElitePoolAbi,
      functionName: "depositVN",
      args: [depVnAmount.value],
      account: userAccount,
    });

    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.elitePool,
      abi: BarkXElitePoolAbi,
      functionName: "depositVN",
      args: [depVnAmount.value],
      account: userAccount,
      ...gasOverrides,
    });

    await waitForTx(hash);
    depVnInput.value = "";
    await loadData();
    showNotice({ outcome: "success", text: t("pages.ePool.depositVn.success") });
  } catch (error) {
    console.error("[elitePool] depositVN failed:", error);
    showNotice({ outcome: "failure", text: getErrorText(error, "pages.ePool.depositVn.failure") });
  } finally {
    store.clearWalletPendingState();
  }
}

async function handleDepositVBarkx() {
  if (!depVBarkxAmount.value || depositVBarkxDisabled.value) {
    return;
  }

  const notice = getDepositVbarkxPrecheckNotice();
  if (notice) {
    showNotice({ outcome: "failure", text: notice });
    return;
  }

  const deadlineSec = BigInt(Math.floor(Date.now() / 1000) + TX_DEADLINE_MINUTES * 60);
  const minLP = predictedLpAmountRaw.value > 0n
    ? predictedLpAmountRaw.value * (10000n - DEFAULT_SLIPPAGE_BPS) / 10000n
    : 0n;

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.ePool.depositVbarkx.pending") });
    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();

    await getPublicClient().simulateContract({
      address: ADDRESSES.elitePool,
      abi: BarkXElitePoolAbi,
      functionName: "depositLP",
      args: [depVBarkxAmount.value, pairingUsdtAmountRaw.value, minLP, deadlineSec],
      account: userAccount,
    });

    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.elitePool,
      abi: BarkXElitePoolAbi,
      functionName: "depositLP",
      args: [depVBarkxAmount.value, pairingUsdtAmountRaw.value, minLP, deadlineSec],
      account: userAccount,
      ...gasOverrides,
    });

    await waitForTx(hash);
    depVBarkxInput.value = "";
    await loadData();
    showNotice({ outcome: "success", text: t("pages.ePool.depositVbarkx.success") });
  } catch (error) {
    console.error("[elitePool] depositLP failed:", error);
    showNotice({ outcome: "failure", text: getErrorText(error, "pages.ePool.depositVbarkx.failure") });
  } finally {
    store.clearWalletPendingState();
  }
}

async function submitBatchWithdraw(vnIdxs, lpIdxs, accountAddress, gasOverrides) {
  const args = [vnIdxs, lpIdxs];

  await getPublicClient().simulateContract({
    address: ADDRESSES.elitePool,
    abi: BarkXElitePoolAbi,
    functionName: "batchWithdraw",
    args,
    account: accountAddress,
  });

  const walletClient = getWalletClient();
  const hash = await writeContractWithGasBuffer(walletClient, {
    address: ADDRESSES.elitePool,
    abi: BarkXElitePoolAbi,
    functionName: "batchWithdraw",
    args,
    account: accountAddress,
    ...gasOverrides,
  });

  await waitForTx(hash);
}

async function handleWithdrawSelected() {
  if (selectedRecords.value.size === 0) {
    return;
  }

  const selectedItems = withdrawRecords.value.filter(item => selectedRecords.value.has(item.key));
  if (selectedItems.length === 0) {
    return;
  }

  const notice = getWithdrawPrecheckNotice(selectedItems);
  if (notice) {
    showNotice({ outcome: "failure", text: notice });
    return;
  }

  const lpIdxs = selectedItems
    .filter(item => item.type === "lp")
    .map(item => BigInt(item.key.split("-")[1]));
  const vnIdxs = selectedItems
    .filter(item => item.type === "vn")
    .map(item => BigInt(item.key.split("-")[1]));

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.ePool.withdraw.withdrawPending") });
    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();

    await submitBatchWithdraw(vnIdxs, lpIdxs, userAccount, gasOverrides);

    settleWithdrawRecordsLocally(selectedItems);
    await loadData();
    showNotice({ outcome: "success", text: t("pages.ePool.withdraw.withdrawSuccess") });
  } catch (error) {
    console.error("[elitePool] withdraw failed:", error);
    await loadData();
    showNotice({ outcome: "failure", text: getErrorText(error, "pages.ePool.withdraw.withdrawFailure") });
  } finally {
    store.clearWalletPendingState();
  }
}

async function handleClaim() {
  if (rewardsDisabled.value) {
    return;
  }

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.ePool.rewards.claimPending") });
    const { amount, deadline, signature } = await requestElitePoolClaimSignature(account.value);
    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();
    const claimAmount = parseBackendAmount(amount);
    const claimDeadline = parseBackendAmount(deadline);

    await getPublicClient().simulateContract({
      address: ADDRESSES.elitePool,
      abi: BarkXElitePoolAbi,
      functionName: "claim",
      args: [claimAmount, claimDeadline, signature],
      account: userAccount,
    });

    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.elitePool,
      abi: BarkXElitePoolAbi,
      functionName: "claim",
      args: [claimAmount, claimDeadline, signature],
      account: userAccount,
      ...gasOverrides,
    });

    await waitForTx(hash);
    await loadData();
    settlePendingRewardsLocally();
    showNotice({
      outcome: "success",
      text: t("pages.ePool.rewards.claimSuccess", { amount: formatTokenAmount(claimAmount, 18, 2) }),
    });
  } catch (error) {
    console.error("[elitePool] claim failed:", error);
    showNotice({ outcome: "failure", text: getErrorText(error, "pages.ePool.rewards.claimFailure") });
  } finally {
    store.clearWalletPendingState();
  }
}

watch(
  () => [walletConnected.value, walletIsTargetChain.value, account.value],
  () => {
    selectedRecords.value = new Set();
    locallyWithdrawnRecordKeys.value = new Set();
    clearPendingRewardsOverride();
    stopPendingRewardsResync();
    refreshPageDataInBackground();
  },
  { immediate: true },
);

onMounted(() => {
  const root = document.documentElement;

  for (const [key, val] of Object.entries(ELITE_THEME_VARS)) {
    savedThemeVars[key] = root.style.getPropertyValue(key);
    root.style.setProperty(key, val);
  }
});

onBeforeUnmount(() => {
  const root = document.documentElement;

  for (const [key] of Object.entries(ELITE_THEME_VARS)) {
    if (savedThemeVars[key]) {
      root.style.setProperty(key, savedThemeVars[key]);
    } else {
      root.style.removeProperty(key);
    }
  }

  clearPendingRewardsOverride();
  stopPendingRewardsResync();
  document.body.style.overflow = "";
});
</script>

<style lang="less">
.elite-pool-theme {
  --cyan: #14b8a6;
  --cyan-glow: rgba(20, 184, 166, 0.4);
  --purple: #0ea5e9;
  --green: #10b981;
  --green-glow: rgba(16, 185, 129, 0.4);
  --amber: #f59e0b;
  --bg-dark: #040909;
  --bg-card: rgba(10, 15, 15, 0.95);
  --bg-card-solid: #0a0f0f;
  --border-dark: rgba(20, 184, 166, 0.15);
  --border-glow: rgba(20, 184, 166, 0.35);
  min-height: 100vh;
  background: transparent;
}

.elite-pool-theme .header {
  background: rgba(4, 9, 9, 0.85) !important;
}

.elite-pool-theme .grid-bg {
  position: fixed;
  inset: 0;
  z-index: -2;
  background-image:
    linear-gradient(rgba(20, 184, 166, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(20, 184, 166, 0.03) 1px, transparent 1px) !important;
  background-size: 60px 60px;
}

.elite-pool-theme .glow-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(20, 184, 166, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(14, 165, 233, 0.08) 0%, transparent 50%) !important;
}

.elite-pool-theme .tab.active {
  background: rgba(20, 184, 166, 0.15) !important;
}

.elite-pool-theme .info-box {
  background: rgba(20, 184, 166, 0.05) !important;
  border-left-color: var(--cyan) !important;
}

.elite-pool-theme .info-box.amber {
  background: rgba(245, 158, 11, 0.05) !important;
  border-left-color: var(--amber) !important;
}

.elite-pool-theme .p-btn {
  background: rgba(20, 184, 166, 0.1) !important;
  border-color: rgba(20, 184, 166, 0.3) !important;
  color: var(--cyan) !important;
}

.elite-pool-theme .p-btn:hover {
  background: rgba(20, 184, 166, 0.2) !important;
}

.elite-pool-theme .nav-link:hover,
.elite-pool-theme .nav-link.active {
  background: rgba(20, 184, 166, 0.1) !important;
  color: var(--cyan) !important;
}

.elite-pool-theme .btn-submit {
  background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%) !important;
  color: #fff !important;
  box-shadow: 0 0 20px rgba(20, 184, 166, 0.3) !important;
}

.elite-pool-theme .btn-submit.amber {
  background: linear-gradient(135deg, var(--amber) 0%, #d97706 100%) !important;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.3) !important;
}

.elite-pool-theme .btn-submit:disabled,
.elite-pool-theme .btn-submit[disabled] {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none !important;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: var(--text-muted) !important;
}

.elite-pool-theme .brand-logo {
  box-shadow: 0 0 10px rgba(20, 184, 166, 0.15) !important;
}

.elite-pool-theme .brand-logo:hover {
  box-shadow: 0 0 15px rgba(20, 184, 166, 0.4) !important;
}

.elite-pool-theme input[type="number"]::-webkit-outer-spin-button,
.elite-pool-theme input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.elite-pool-theme input[type="number"] {
  -moz-appearance: textfield;
}

.elite-pool-theme .custom-modal-overlay {
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

.elite-pool-theme .custom-modal {
  width: 88%;
  max-width: 360px;
  background: rgba(10, 15, 15, 0.95);
  border: 1px solid var(--cyan);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}

.elite-pool-theme .custom-modal.cyan-theme {
  border-color: var(--cyan);
}

.elite-pool-theme .custom-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.3s ease;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0;
}

.elite-pool-theme .custom-modal-close:hover {
  color: var(--cyan);
}

.elite-pool-theme .custom-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-right: 24px;
}

.elite-pool-theme .custom-modal-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.elite-pool-theme .custom-modal-text strong {
  color: var(--text-primary);
}

.elite-pool-theme .custom-modal-text .modal-inner-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.elite-pool-theme .custom-modal-text .modal-inner-card:last-child {
  margin-bottom: 0;
}

.elite-pool-theme .custom-modal-fade-enter-active,
.elite-pool-theme .custom-modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.elite-pool-theme .custom-modal-fade-enter-from,
.elite-pool-theme .custom-modal-fade-leave-to {
  opacity: 0;
}

.elite-pool-theme .custom-modal-fade-enter-from .custom-modal,
.elite-pool-theme .custom-modal-fade-leave-to .custom-modal {
  transform: translateY(20px);
}

.elite-pool-theme .stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.elite-pool-theme .stats-grid.three-cols {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.elite-pool-theme .stat-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.elite-pool-theme .stats-grid.three-cols .stat-card {
  padding: 12px 6px;
}

.elite-pool-theme .stats-grid.three-cols .stat-card-title {
  font-size: 10px;
  letter-spacing: 0;
  margin-bottom: 6px;
}

.elite-pool-theme .stats-grid.three-cols .stat-card-value {
  font-size: 16px;
}

.elite-pool-theme .stat-card.interactive {
  background: rgba(245, 158, 11, 0.05);
  border: 1px dashed rgba(245, 158, 11, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.elite-pool-theme .stat-card.interactive:hover {
  background: rgba(245, 158, 11, 0.12);
  border-style: solid;
  transform: translateY(-2px);
  border-color: var(--amber);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
}

.elite-pool-theme .stat-card.interactive .stat-card-title {
  color: var(--amber);
}

.elite-pool-theme .stat-card-title {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.elite-pool-theme .stat-card-value {
  font-family: "JetBrains Mono", monospace;
  font-size: 20px;
  font-weight: 600;
}

.elite-pool-theme .stat-card-value--interactive {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.elite-pool-theme .stat-card-inline-icon {
  opacity: 0.8;
  margin-top: 1px;
}

.elite-pool-theme .rewards-big-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--cyan);
  font-family: "JetBrains Mono", monospace;
}

.elite-pool-theme .rewards-big-unit {
  font-size: 20px;
}

.elite-pool-theme .withdraw-select-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.elite-pool-theme .withdraw-select-all {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.elite-pool-theme .withdraw-select-all input {
  margin-right: 8px;
  accent-color: var(--cyan);
  transform: scale(1.2);
}

.elite-pool-theme .order-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  min-height: 200px;
}

.elite-pool-theme .order-item {
  display: flex;
  align-items: center;
  padding: 14px;
  min-height: 80px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.elite-pool-theme .order-item:hover {
  border-color: var(--amber);
  background: rgba(245, 158, 11, 0.05);
}

.elite-pool-theme .order-item.is-selected {
  border-color: rgba(245, 158, 11, 0.55);
  background: rgba(245, 158, 11, 0.08);
}

.elite-pool-theme .order-checkbox {
  margin-right: 14px;
  accent-color: var(--cyan);
  transform: scale(1.3);
  cursor: pointer;
}

.elite-pool-theme .order-details-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.elite-pool-theme .order-id {
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}

.elite-pool-theme .order-status {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.elite-pool-theme .order-status.is-unlocked {
  color: var(--green);
}

.elite-pool-theme .order-assets-right {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.elite-pool-theme .asset-line {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.elite-pool-theme .pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  margin-bottom: 8px;
}

.elite-pool-theme .page-info {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
  letter-spacing: 1px;
}

.elite-pool-theme .page-btn {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 8px;
  color: var(--text-primary);
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}

.elite-pool-theme .page-btn:hover:not(:disabled) {
  border-color: var(--amber);
  color: var(--amber);
  background: rgba(245, 158, 11, 0.1);
}

.elite-pool-theme .page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.elite-pool-theme .withdraw-summary-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.elite-pool-theme .withdraw-summary-title {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.elite-pool-theme .sub-tab-container {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}

.elite-pool-theme .sub-tab-btn {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.elite-pool-theme .sub-tab-btn.active {
  background: rgba(20, 184, 166, 0.15);
  color: var(--cyan);
  box-shadow: 0 0 10px rgba(20, 184, 166, 0.2);
}

.elite-pool-theme .sub-panel {
  animation: elite-pool-fade-in 0.3s ease;
}

.elite-pool-theme .collapsible-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 16px;
  margin-top: 24px;
  margin-bottom: 24px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.elite-pool-theme .collapsible-card:hover {
  border-color: var(--border-glow);
}

.elite-pool-theme .collapsible-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  color: var(--cyan);
  font-size: 15px;
}

.elite-pool-theme .collapsible-content {
  padding: 0 20px 20px;
  display: none;
}

.elite-pool-theme .collapsible-content.show {
  display: block;
  animation: elite-pool-fade-in 0.3s ease;
}

.elite-pool-theme .chevron {
  transition: transform 0.3s ease;
  display: inline-block;
}

.elite-pool-theme .chevron.up {
  transform: rotate(180deg);
}

.elite-pool-theme .lb-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.elite-pool-theme .lb-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-size: 14px;
}

.elite-pool-theme .lb-rank {
  font-family: "JetBrains Mono", monospace;
  color: var(--text-muted);
  width: 24px;
  font-weight: 600;
}

.elite-pool-theme .lb-address {
  font-family: "JetBrains Mono", monospace;
  color: var(--text-primary);
  flex: 1;
}

.elite-pool-theme .lb-value {
  font-family: "JetBrains Mono", monospace;
  color: var(--cyan);
  font-weight: 600;
}

.elite-pool-theme .lb-item.top-1 .lb-rank {
  color: #fbbf24;
}

.elite-pool-theme .lb-item.top-2 .lb-rank {
  color: #94a3b8;
}

.elite-pool-theme .lb-item.top-3 .lb-rank {
  color: #b45309;
}

@keyframes elite-pool-fade-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
