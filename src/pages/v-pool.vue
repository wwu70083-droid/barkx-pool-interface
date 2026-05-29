<template>
  <MiningShell>
    <div style="text-align: center; margin-bottom: 20px; position: relative">
      <div
        style="
          display: inline-block;
          padding: 4px 12px;
          background: rgba(251, 191, 36, 0.15);
          border: 1px solid var(--cyan);
          border-radius: 20px;
          color: var(--cyan);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 12px;
          letter-spacing: 1px;
          cursor: pointer;
        "
        @click="openInvite"
        :title="$t('pages.vPool.viewInvitation')"
      >
        {{ $t("pages.vPool.badge") }}
      </div>
      <h1 style="font-size: 28px; color: var(--text-primary)">
        {{ $t("pages.vPool.title") }}
      </h1>
      <p style="color: var(--text-muted); font-size: 14px">{{ $t("pages.vPool.subtitle") }}</p>
    </div>

    <div class="tabs">
      <div class="tab" :class="{ active: activeTab === 'dep-vn' }" @click="activeTab = 'dep-vn'">
        {{ $t("pages.vPool.tabs.depositVn") }}
      </div>
      <div class="tab" :class="{ active: activeTab === 'dep-vlp' }" @click="activeTab = 'dep-vlp'">
        {{ $t("pages.vPool.tabs.depositVlp") }}
      </div>
      <div class="tab" :class="{ active: activeTab === 'withdraw' }" @click="activeTab = 'withdraw'">
        {{ $t("pages.vPool.tabs.withdraw") }}
      </div>
      <div class="tab" :class="{ active: activeTab === 'rewards' }" @click="activeTab = 'rewards'">
        {{ $t("pages.vPool.tabs.rewards") }}
      </div>
    </div>

    <!-- ==================== Tab 1: Deposit VN ==================== -->
    <div id="dep-vn" class="panel" :class="{ active: activeTab === 'dep-vn' }">
      <div class="info-box">{{ $t("pages.vPool.depositVn.info") }}</div>

      <div class="sub-tab-container">
        <button class="sub-tab-btn" :class="{ active: activeDepositVnTab === 'dep-vn-new' }" type="button" @click="activeDepositVnTab = 'dep-vn-new'">
          {{ $t("pages.vPool.depositVn.vn") }}
        </button>
        <button class="sub-tab-btn" :class="{ active: activeDepositVnTab === 'dep-vn-wvn' }" type="button" @click="activeDepositVnTab = 'dep-vn-wvn'">
          {{ $t("pages.vPool.depositVn.wvn") }}
        </button>
        <button class="sub-tab-btn" :class="{ active: activeDepositVnTab === 'dep-vn-wvn2' }" type="button" @click="activeDepositVnTab = 'dep-vn-wvn2'">
          {{ $t("pages.vPool.depositVn.wvn2") }}
        </button>
      </div>

      <!-- Sub-tab: VN -->
      <div class="sub-panel" :style="{ display: activeDepositVnTab === 'dep-vn-new' ? 'block' : 'none' }">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-title">{{ $t("pages.pool.depositVn.currentApy") }}</div>
            <div class="stat-card-value green">{{ aprDisplay }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-title">{{ $t("pages.pool.depositVn.lockPeriod") }}</div>
            <div class="stat-card-value" style="color: var(--text-primary)">{{ formatLockPeriod(subPoolData.lockPeriod.value) }}</div>
          </div>
        </div>
        <div class="input-group" style="margin-top: 16px">
          <div class="input-header">
            <span>{{ $t("pages.vPool.depositVn.depositNewVn") }}</span>
            <span>{{ $t("common.balance", { amount: formatIntegerAmount(subPoolData.vnBalance.value) }) }}</span>
          </div>
          <div class="input-row">
            <input v-model="depositVnInput" type="text" inputmode="numeric" class="input-field" placeholder="0" />
            <div class="asset-badge">VN</div>
          </div>
          <div class="percent-btns">
            <button class="p-btn" type="button" @click="depositVnInput = String(subPoolData.vnBalance.value)">{{ $t("common.max") }}</button>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.vPool.depositVn.capIncrease") }}</span>
          <span class="data-val highlight">+{{ formatTokenAmount(vnCapIncrease, 18, 2) }} vLP</span>
        </div>
        <ApprovalActionGroup
          :requirements="[{ id: 'subpool:vn', label: 'VN' }]"
          :check-handler="checkVnApproval"
          :approve-handler="handleVnApprove"
          :action-label="$t('pages.vPool.depositVn.depositVnAction')"
          :action-disabled="depositVnDisabled"
          :action-pending-text="$t('pages.vPool.depositVn.depositVnPending')"
          @action="handleDepositVN"
        />
        <div style="text-align: center; margin-top: 12px; font-size: 12px; color: var(--text-muted)">
          {{ $t("pages.vPool.depositVn.unlockLater", { lockPeriod: formatLockPeriod(subPoolData.lockPeriod.value) }) }}
        </div>
      </div>

      <!-- Sub-tab: wVN -->
      <div class="sub-panel" :style="{ display: activeDepositVnTab === 'dep-vn-wvn' ? 'block' : 'none' }">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-title">{{ $t("pages.pool.depositVn.currentApy") }}</div>
            <div class="stat-card-value green">{{ aprDisplay }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-title">{{ $t("pages.pool.depositVn.lockPeriod") }}</div>
            <div class="stat-card-value" style="color: var(--text-primary)">{{ formatLockPeriod(subPoolData.lockPeriod.value) }}</div>
          </div>
        </div>
        <div class="input-group" style="margin-top: 16px">
          <div class="input-header">
            <span>{{ $t("pages.vPool.depositVn.depositWvn") }}</span>
            <span>{{ $t("common.balance", { amount: formatIntegerAmount(subPoolData.wvn1Balance.value) }) }}</span>
          </div>
          <div class="input-row">
            <input v-model="depositWvnInput" type="text" inputmode="numeric" class="input-field" placeholder="0" />
            <div class="asset-badge" style="background: var(--bg-card-solid)">wVN</div>
          </div>
          <div class="percent-btns">
            <button class="p-btn" type="button" @click="depositWvnInput = String(subPoolData.wvn1Balance.value)">{{ $t("common.max") }}</button>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.vPool.depositVn.capIncrease") }}</span>
          <span class="data-val highlight">+{{ formatTokenAmount(wvnCapIncrease, 18, 2) }} vLP</span>
        </div>
        <ApprovalActionGroup
          :requirements="[{ id: 'subpool:wvn1', label: 'wVN' }]"
          :check-handler="checkWvn1Approval"
          :approve-handler="handleWvn1Approve"
          :action-label="$t('pages.vPool.depositVn.depositWvnAction')"
          :action-disabled="depositWvnDisabled"
          :action-pending-text="$t('pages.vPool.depositVn.depositWvnPending')"
          @action="handleDepositWVN1"
        />
        <div style="text-align: center; margin-top: 12px; font-size: 12px; color: var(--text-muted)">
          {{ $t("pages.vPool.depositVn.unlockLater", { lockPeriod: formatLockPeriod(subPoolData.lockPeriod.value) }) }}
        </div>
      </div>

      <!-- Sub-tab: wVN2 -->
      <div class="sub-panel" :style="{ display: activeDepositVnTab === 'dep-vn-wvn2' ? 'block' : 'none' }">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-title">{{ $t("pages.pool.depositVn.currentApy") }}</div>
            <div class="stat-card-value green">{{ aprDisplay }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-title">{{ $t("pages.pool.depositVn.lockPeriod") }}</div>
            <div class="stat-card-value" style="color: var(--text-primary)">{{ formatLockPeriod(subPoolData.lockPeriod.value) }}</div>
          </div>
        </div>
        <div class="input-group" style="margin-top: 16px">
          <div class="input-header">
            <span>{{ $t("pages.vPool.depositVn.depositWvn2") }}</span>
            <span>{{ $t("common.balance", { amount: formatIntegerAmount(subPoolData.wvn2Balance.value) }) }}</span>
          </div>
          <div class="input-row">
            <input v-model="depositWvn2Input" type="text" inputmode="numeric" class="input-field" placeholder="0" />
            <div class="asset-badge" style="background: var(--bg-card-solid); border-color: var(--cyan)">
              <span style="color: var(--cyan)">wVN2</span>
            </div>
          </div>
          <div class="percent-btns">
            <button class="p-btn" type="button" @click="depositWvn2Input = String(subPoolData.wvn2Balance.value)">{{ $t("common.max") }}</button>
          </div>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.vPool.depositVn.capIncrease") }}</span>
          <span class="data-val highlight">+{{ formatTokenAmount(wvn2CapIncrease, 18, 2) }} vLP</span>
        </div>
        <ApprovalActionGroup
          :requirements="[{ id: 'subpool:wvn2', label: 'wVN2' }]"
          :check-handler="checkWvn2Approval"
          :approve-handler="handleWvn2Approve"
          :action-label="$t('pages.vPool.depositVn.depositWvn2Action')"
          :action-disabled="depositWvn2Disabled"
          :action-pending-text="$t('pages.vPool.depositVn.depositWvn2Pending')"
          @action="handleDepositWVN2"
        />
        <div style="text-align: center; margin-top: 12px; font-size: 12px; color: var(--text-muted)">
          {{ $t("pages.vPool.depositVn.unlockLater", { lockPeriod: formatLockPeriod(subPoolData.lockPeriod.value) }) }}
        </div>
      </div>
    </div>

    <!-- ==================== Tab 2: Deposit vLP ==================== -->
    <div id="dep-vlp" class="panel" :class="{ active: activeTab === 'dep-vlp' }">
      <div class="info-box">{{ $t("pages.vPool.depositVlp.info") }}</div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-title">{{ $t("pages.pool.depositVn.currentApy") }}</div>
          <div class="stat-card-value green">{{ aprDisplay }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">{{ $t("pages.pool.depositVn.lockPeriod") }}</div>
          <div class="stat-card-value" style="color: var(--text-primary)">
            {{ formatLockPeriod(subPoolData.lockPeriod.value) }}
          </div>
        </div>
      </div>

      <div class="input-group" style="margin-top: 16px">
        <div class="input-header">
          <span>{{ $t("pages.vPool.depositVlp.depositVlp") }}</span>
          <span>{{ $t("common.balance", { amount: formatTokenAmount(subPoolData.vlpBalance.value, 18, 2) }) }}</span>
        </div>
        <div class="input-row">
          <input v-model="depositVlpInput" type="text" inputmode="decimal" class="input-field" placeholder="0.00" />
          <div class="asset-badge">vLP</div>
        </div>
        <div class="percent-btns">
          <button v-for="pct in [25, 50, 75, 100]" :key="pct" class="p-btn" type="button" @click="setVlpPercent(pct)">{{ pct }}%</button>
        </div>
      </div>
      <ApprovalActionGroup
        :requirements="[{ id: 'subpool:vlp', label: 'vLP' }]"
        :check-handler="checkVlpApproval"
        :approve-handler="handleVlpApprove"
        :action-label="$t('pages.vPool.depositVlp.action')"
        :action-disabled="depositVlpDisabled"
        :action-pending-text="$t('pages.vPool.depositVlp.pending')"
        @action="handleDepositVLP"
      />
      <div style="text-align: center; margin-top: 12px; font-size: 12px; color: var(--text-muted)">
        {{ $t("pages.vPool.depositVlp.unlockLater", { lockPeriod: formatLockPeriod(subPoolData.lockPeriod.value) }) }}
      </div>
    </div>

    <!-- ==================== Tab 3: Withdraw ==================== -->
    <div id="withdraw" class="panel" :class="{ active: activeTab === 'withdraw' }">
      <div class="info-box amber">{{ $t("pages.vPool.withdraw.info") }}</div>

      <div class="withdraw-select-row">
        <label class="withdraw-select-all">
          <input type="checkbox" :checked="wdSelectAllChecked" @change="setCurrentPageSelected($event.target.checked)" />
          {{ $t("pages.vPool.withdraw.selectAllCurrentPage") }}
        </label>
      </div>

      <div class="order-list">
        <div v-if="wdPagedList.length === 0" class="order-empty">
          {{ $t("pages.vPool.withdraw.noUnlockedRecords") }}
        </div>
        <div
          v-for="item in wdPagedList"
          :key="item.key"
          class="order-item"
          :class="{ 'is-selected': wdSelected.has(item.key), 'is-locked': !item.isUnlocked || item.isConfirming }"
          @click="item.isUnlocked && !item.isConfirming && toggleSelect(item.key)"
        >
          <input
            type="checkbox"
            class="order-checkbox"
            :checked="isWithdrawItemSelected(item.key)"
            :disabled="!item.isUnlocked || item.isConfirming"
            @click.stop
            @change="setWithdrawItemSelected(item.key, $event.target.checked)"
          />
          <div class="order-details-left">
            <div class="order-id">{{ item.txHash ? (item.txHash.slice(0, 6) + '...' + item.txHash.slice(-4)) : '#' + item.idx }}</div>
            <div v-if="item.isConfirming" class="order-status is-confirming">
              {{ $t("pages.vPool.withdraw.statusConfirming") }}
            </div>
            <div v-else class="order-status" :class="item.isUnlocked ? 'is-unlocked' : 'is-locked'">
              {{ item.isUnlocked ? $t("pages.vPool.withdraw.statusUnlocked") : $t("pages.vPool.withdraw.statusLocked") }}
            </div>
          </div>
          <div class="order-assets-right">
            <div v-if="item.type === 'vn'" class="asset-line">{{ item.vnCount }} wVN2</div>
            <div v-if="item.type === 'vlp'" class="asset-line">{{ formatTokenAmount(item.vlpAmount, 18, 2) }} vLP</div>
            <div style="font-size: 11px; color: var(--text-muted)">{{ formatUnlockDate(item.unlocksAt) }}</div>
          </div>
        </div>
      </div>

      <div class="pagination">
        <button class="page-btn" :disabled="wdPage <= 1" @click="wdPage--">&#10094;</button>
        <span class="page-info">{{ wdPage }} / {{ wdTotalPages }}</span>
        <button class="page-btn" :disabled="wdPage >= wdTotalPages" @click="wdPage++">&#10095;</button>
      </div>

      <div class="withdraw-summary-card">
        <div class="withdraw-summary-title">{{ $t("pages.vPool.withdraw.selectedSummary") }}</div>
        <div class="data-row" style="padding: 4px 0; border: none">
          <span class="data-lbl">{{ $t("pages.vPool.withdraw.totalWvn2") }}</span>
          <span class="data-val" style="color: var(--amber); font-size: 16px">{{ wdSummary.vnCount }} wVN2</span>
        </div>
        <div class="data-row" style="padding: 4px 0; border: none">
          <span class="data-lbl">{{ $t("pages.vPool.withdraw.totalVlp") }}</span>
          <span class="data-val" style="color: var(--amber); font-size: 16px">{{ formatTokenAmount(wdSummary.vlpAmount, 18, 2) }} vLP</span>
        </div>
        <div class="data-row" style="padding: 4px 0; border: none">
          <span class="data-lbl">{{ $t("pages.vPool.withdraw.capDecrease") }}</span>
          <span class="data-val" style="color: var(--amber); font-size: 16px">-{{ formatTokenAmount(wdSummary.capDecrease, 18, 2) }} vLP</span>
        </div>
      </div>

      <button
        class="btn-submit amber"
        style="margin-top: 16px"
        :disabled="wdSelected.size === 0"
        @click="handleWithdraw"
      >
        {{ $t("pages.vPool.withdraw.withdrawSelected") }}
      </button>
    </div>

    <!-- ==================== Tab 4: Rewards ==================== -->
    <div id="rewards" class="panel" :class="{ active: activeTab === 'rewards' }">
      <div class="info-box">{{ $t("pages.vPool.rewards.info") }}</div>

      <div style="text-align: center; padding: 20px 0; background: rgba(0,0,0,0.2); border-radius: 16px; border: 1px solid var(--border-dark); margin-bottom: 20px">
        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px">
          {{ $t("pages.vPool.rewards.autoAccumulated") }}
        </div>
        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase">
          {{ $t("pages.vPool.rewards.pendingRewards") }}
        </div>
        <div class="rewards-big-value">
          {{ formatTokenAmount(pendingRewards, 18, REWARD_DISPLAY_DECIMALS) }} <span class="rewards-big-unit">BARKX</span>
        </div>
      </div>

      <div style="border: 1px solid var(--border-dark); border-radius: 12px; padding: 16px; margin-bottom: 16px">
        <div style="font-weight: 600; margin-bottom: 10px">{{ $t("pages.vPool.rewards.directClaim") }}</div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.vPool.rewards.feeRate") }}</span>
          <span class="data-val green">0.00%</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.vPool.rewards.receivingAmount") }}</span>
          <span class="data-val">{{ formatTokenAmount(pendingRewards, 18, REWARD_DISPLAY_DECIMALS) }} BARKX</span>
        </div>
        <button
          class="btn-submit"
          style="margin-top: 10px"
          :disabled="rewardsDisabled"
          @click="handleClaim"
        >
          {{ claimButtonLabel }}
        </button>
      </div>
    </div>

    <!-- ==================== Deposit Status Card ==================== -->
    <div class="card" style="margin-top: 24px; border-color: var(--border-glow)">
      <div class="card-title" style="color: var(--cyan); border-bottom-color: var(--border-glow)">
        {{ $t("pages.vPool.depositStatus.title") }}
      </div>

      <div class="data-row">
        <span class="data-lbl">{{ $t("pages.vPool.depositStatus.personalCapacity") }}</span>
        <span class="data-val">{{ formatIntegerAmount(subPoolData.userInfo.value.vnStaked) }}/{{ formatIntegerAmount(subPoolData.maxWVN2.value) }} VN</span>
      </div>

      <div class="data-row" style="align-items: flex-start">
        <span class="data-lbl">{{ $t("pages.vPool.depositStatus.vlpToken") }}</span>
        <div style="text-align: right">
          <div class="data-val">{{ formatTokenAmount(subPoolData.userInfo.value.stakedVLP, 18, 2) }} vLP</div>
        </div>
      </div>

      <div class="data-row" style="align-items: flex-start; border-bottom: none">
        <span class="data-lbl">{{ $t("pages.vPool.depositStatus.vlpCap") }}</span>
        <div style="text-align: right">
          <div class="data-val">{{ formatTokenAmount(subPoolData.vlpCap.value, 18, 2) }} vLP</div>
          <div v-if="subPoolData.vlpCapUnused.value > 0n" style="font-size: 12px; color: var(--green); margin-top: 4px; font-weight: 500">
            {{ $t("pages.vPool.depositStatus.unusedCap", { amount: formatTokenAmount(subPoolData.vlpCapUnused.value, 18, 2) }) }}
          </div>
        </div>
      </div>

      <div
        v-if="subPoolData.vlpCapUnused.value > 0n"
        style="
          background: rgba(251, 191, 36, 0.1);
          border: 1px dashed var(--cyan);
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
          font-size: 13px;
          color: var(--text-secondary);
          text-align: center;
        "
      >
        💡 {{ $t("pages.vPool.depositStatus.note") }}
        <span
          style="color: var(--cyan); cursor: pointer; text-decoration: underline"
          @click="openDepositMoreVlp"
          >{{ $t("pages.vPool.depositStatus.cta") }}</span
        >
        {{ $t("pages.vPool.depositStatus.tail") }}
      </div>
    </div>
    <!-- VIP Invite Popup -->
    <Teleport to="body">
      <div v-if="showInvite" class="vip-overlay" @click.self="closeInvite">
        <div class="vip-card" @click="cycleVipLanguage" :title="$t('pages.vPool.invitation.changeLanguage')">
          <button class="vip-close" @click.stop="closeInvite">✕</button>
          <div class="vip-header-title">V.I.P</div>
          <div class="vip-body-text" ref="vipBodyRef"></div>
          <div class="vip-signature">
            <span ref="vipSigRef"></span>
            <strong>BarkAI</strong>
          </div>
          <div class="vip-icon-box"></div>
        </div>
      </div>
    </Teleport>
  </MiningShell>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { maxUint256, formatUnits, parseUnits } from "viem";
import ApprovalActionGroup from "@/components/mining/ApprovalActionGroup.vue";
import MiningShell from "@/components/mining/MiningShell.vue";
import { useMainStore } from "@/store";
import { useSubPoolData } from "@/composables/useSubPoolData";
import { useApproval } from "@/composables/useApproval";
import { useNotice } from "@/composables/useNotice";
import { getWalletClient, getGasOverrides, writeContractWithGasBuffer, waitForTx, ADDRESSES } from "@/composables/useContracts";
import { BarkXSubPoolAbi } from "@/abi";
import { SUPPORTED_LOCALES } from "@/i18n";
import { formatTokenAmount, formatIntegerAmount, safeParseUnits, truncateFixed } from "@/utils/format";
import { getSubPoolUserInfo, requestSubPoolClaimSignature, claimConfirm, getSubPoolInfo, getSubPoolDeposits } from "@/composables/useSubPoolBackend";

const { t, locale } = useI18n({ useScope: "global" });
const store = useMainStore();
const { account, walletConnected, walletIsTargetChain } = storeToRefs(store);
const route = useRoute();
const router = useRouter();
const { showNotice } = useNotice();
const subPoolData = useSubPoolData();
const approval = useApproval();

const activeTab = ref("dep-vn");
const activeDepositVnTab = ref("dep-vn-new");

// --- Inputs ---
const depositVnInput = ref("");
const depositWvnInput = ref("");
const depositWvn2Input = ref("");
const depositVlpInput = ref("");
const pendingRewards = ref(0n);
const currentApr = ref("");
const MIN_REWARD_ACTION_AMOUNT = 1000000000000000000n;
const REWARD_DISPLAY_DECIMALS = 4;
const aprDisplay = computed(() => {
  if (!currentApr.value) return "—";
  const num = Number(currentApr.value);
  return isFinite(num) ? `${truncateFixed(num, 2)}%` : "—";
});

const rewardsDisabled = computed(() => pendingRewards.value < MIN_REWARD_ACTION_AMOUNT);
const claimButtonLabel = computed(() =>
  rewardsDisabled.value
    ? t("pages.vPool.rewards.lessThanOneAction")
    : t("pages.vPool.rewards.claimToWallet"),
);

// --- VIP Invite Popup: DOM-based toggle (matches origin exactly) ---
const showInvite = ref(false);
const vipBodyRef = ref(null);
const vipSigRef = ref(null);
const vipLangOrder = SUPPORTED_LOCALES.filter(lang => lang !== "ar");
let currentVipLangIndex = 0;
let isVipAnimating = false;

const inviteTextKeys = [
  "pages.vPool.invitation.lines.greeting",
  "pages.vPool.invitation.lines.welcome",
  "pages.vPool.invitation.lines.contribution",
  "pages.vPool.invitation.lines.honor",
  "pages.vPool.invitation.lines.rewards",
];
const inviteSignatureKey = "pages.vPool.invitation.signature";

function translateVipInvite(key, lang) {
  return t(key, {}, { locale: lang });
}

function renderVipText(animate = false) {
  const container = vipBodyRef.value;
  const sigText = vipSigRef.value;
  const card = container?.closest(".vip-card");
  if (!container || !sigText || !card) return;

  const lang = vipLangOrder[currentVipLangIndex];
  const lines = inviteTextKeys.map(key => translateVipInvite(key, lang));
  const sigLine = translateVipInvite(inviteSignatureKey, lang);
  const htmlContent = lines.map(line => `<p>${line}</p>`).join("");

  if (animate) {
    // 1. Fade out
    container.style.opacity = "0";
    sigText.style.opacity = "0";

    setTimeout(() => {
      card.style.boxSizing = "border-box";
      container.style.boxSizing = "border-box";

      // 2. Lock current heights
      const currentCardHeight = card.offsetHeight;
      const currentTextHeight = container.offsetHeight;

      // 3. Inject new content to measure target height
      container.innerHTML = htmlContent;
      sigText.innerText = sigLine;

      // 4. Measure target heights
      card.style.height = "auto";
      container.style.height = "auto";
      const targetCardHeight = card.offsetHeight;
      const targetTextHeight = container.offsetHeight;

      // 5. Restore to old heights
      card.style.height = currentCardHeight + "px";
      container.style.height = currentTextHeight + "px";

      const prevOverflow = card.style.overflowY || "auto";
      card.style.overflowY = "hidden";

      // 6. Set transitions
      card.style.transition = "height 0.3s linear";
      container.style.transition = "height 0.3s linear, opacity 0.3s ease";

      // 7. Force reflow
      void card.offsetHeight;

      // 8. Animate to target heights + fade in
      card.style.height = targetCardHeight + "px";
      container.style.height = targetTextHeight + "px";
      container.style.opacity = "1";
      sigText.style.opacity = "1";

      // 9. Cleanup after animation
      setTimeout(() => {
        card.style.transition = "";
        card.style.height = "";
        card.style.overflowY = prevOverflow;
        container.style.transition = "opacity 0.3s ease";
        container.style.height = "";
        isVipAnimating = false;
      }, 300);
    }, 300);
  } else {
    container.innerHTML = htmlContent;
    sigText.innerText = sigLine;
    container.style.opacity = "1";
    sigText.style.opacity = "1";
    isVipAnimating = false;
  }
}

function cycleVipLanguage(e) {
  if (e.target.closest(".vip-close")) return;
  if (isVipAnimating) return;
  isVipAnimating = true;
  currentVipLangIndex = (currentVipLangIndex + 1) % vipLangOrder.length;
  renderVipText(true);
}

function closeInvite() {
  showInvite.value = false;
  document.body.style.overflow = "";
  document.cookie = "vpool_invited=true; max-age=31536000; path=/";
}
function openInvite() {
  // Initial language follows project locale
  const langIdx = vipLangOrder.indexOf(locale.value);
  currentVipLangIndex = langIdx >= 0 ? langIdx : 0;
  isVipAnimating = false;
  showInvite.value = true;
  document.body.style.overflow = "hidden";
  nextTick(() => {
    renderVipText(false);
    const card = document.querySelector(".vip-card");
    if (card) card.scrollTop = 0;
  });
}
function openDepositMoreVlp() { activeTab.value = "dep-vlp"; window.scrollTo(0, 0); }

function formatLockPeriod(seconds) {
  const s = Number(seconds);
  if (s <= 0) return "—";
  if (s === 86400) return t("common.duration.hours24");
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const parts = [];
  if (days > 0) parts.push(t(days === 1 ? "common.duration.day" : "common.duration.days", { count: days }));
  if (hours > 0) parts.push(t(hours === 1 ? "common.duration.hour" : "common.duration.hours", { count: hours }));
  if (minutes > 0) parts.push(t(minutes === 1 ? "common.duration.minute" : "common.duration.minutes", { count: minutes }));
  return parts.length > 0 ? parts.join(" ") : t("common.duration.lessThanMinute");
}

// --- Cap increase computed ---
const vnCapIncrease = computed(() => {
  const n = BigInt(parseInt(depositVnInput.value, 10) || 0);
  return n > 0n ? n * subPoolData.vlpPerVN.value : 0n;
});
const wvnCapIncrease = computed(() => {
  const n = BigInt(parseInt(depositWvnInput.value, 10) || 0);
  return n > 0n ? n * subPoolData.vlpPerVN.value : 0n;
});
const wvn2CapIncrease = computed(() => {
  const n = BigInt(parseInt(depositWvn2Input.value, 10) || 0);
  return n > 0n ? n * subPoolData.vlpPerVN.value : 0n;
});

// --- Disabled states ---
function intInputInvalid(val, balance) {
  const raw = String(val ?? "").trim();
  if (!/^\d+$/.test(raw) || raw.length > 10) return true;
  const n = BigInt(raw);
  if (n <= 0n) return true;
  if (n > balance) return true;
  return false;
}

const depositVnDisabled = computed(() => {
  const reasons = [];
  if (!subPoolData.isWhitelisted.value) reasons.push("notWhitelisted: maxWVN2=" + subPoolData.maxWVN2.value);
  if (intInputInvalid(depositVnInput.value, subPoolData.vnBalance.value)) reasons.push("inputInvalid: input=" + depositVnInput.value + " balance=" + subPoolData.vnBalance.value);
  const n = BigInt(parseInt(depositVnInput.value, 10) || 0);
  if (subPoolData.userInfo.value.vnStaked + n > subPoolData.maxWVN2.value) reasons.push("capExceeded: vnStaked=" + subPoolData.userInfo.value.vnStaked + " +n=" + n + " maxWVN2=" + subPoolData.maxWVN2.value);
  if (reasons.length) console.log("[vPool] depositVnDisabled:", reasons.join(", "));
  return reasons.length > 0;
});

const depositWvnDisabled = computed(() => {
  const reasons = [];
  if (!subPoolData.isWhitelisted.value) reasons.push("notWhitelisted");
  if (intInputInvalid(depositWvnInput.value, subPoolData.wvn1Balance.value)) reasons.push("inputInvalid: input=" + depositWvnInput.value + " balance=" + subPoolData.wvn1Balance.value);
  const n = BigInt(parseInt(depositWvnInput.value, 10) || 0);
  if (subPoolData.userInfo.value.vnStaked + n > subPoolData.maxWVN2.value) reasons.push("capExceeded");
  if (reasons.length) console.log("[vPool] depositWvnDisabled:", reasons.join(", "));
  return reasons.length > 0;
});

const depositWvn2Disabled = computed(() => {
  const reasons = [];
  if (!subPoolData.isWhitelisted.value) reasons.push("notWhitelisted");
  if (intInputInvalid(depositWvn2Input.value, subPoolData.wvn2Balance.value)) reasons.push("inputInvalid: input=" + depositWvn2Input.value + " balance=" + subPoolData.wvn2Balance.value);
  const n = BigInt(parseInt(depositWvn2Input.value, 10) || 0);
  if (subPoolData.userInfo.value.vnStaked + n > subPoolData.maxWVN2.value) reasons.push("capExceeded");
  if (reasons.length) console.log("[vPool] depositWvn2Disabled:", reasons.join(", "));
  return reasons.length > 0;
});

const depositVlpDisabled = computed(() => {
  const reasons = [];
  if (!subPoolData.isWhitelisted.value) reasons.push("notWhitelisted");
  const raw = String(depositVlpInput.value ?? "").trim();
  const val = Number(raw) || 0;
  if (val <= 0) reasons.push("zeroInput");
  const parsed = safeParseUnits(raw, 18);
  if (!parsed && val > 0) reasons.push("parseError");
  if (parsed && parsed > subPoolData.vlpBalance.value) reasons.push("exceedsBalance: parsed=" + parsed + " balance=" + subPoolData.vlpBalance.value);
  if (parsed && subPoolData.userInfo.value.stakedVLP + parsed > subPoolData.vlpCap.value) reasons.push("vlpCapExceeded");
  if (reasons.length) console.log("[vPool] depositVlpDisabled:", reasons.join(", "));
  return reasons.length > 0;
});

// --- vLP percent buttons ---
function setVlpPercent(pct) {
  if (subPoolData.vlpBalance.value <= 0n) return;
  const amount = (subPoolData.vlpBalance.value * BigInt(pct)) / 100n;
  depositVlpInput.value = formatUnits(amount, 18);
}

// --- Approval handlers ---
async function checkVnApproval(req) { return approval.isVnApprovedForSubPool(); }
async function handleVnApprove(req) { return approval.approveVnForSubPool(); }
async function checkWvn1Approval(req) { return approval.isWvn1ApprovedForSubPool(); }
async function handleWvn1Approve(req) { return approval.approveWvn1ForSubPool(); }
async function checkWvn2Approval(req) { return approval.isWvn2ApprovedForSubPool(); }
async function handleWvn2Approve(req) { return approval.approveWvn2ForSubPool(); }
async function checkVlpApproval(req) { return approval.isVlpApprovedForSubPool(); }
async function handleVlpApprove(req) { return approval.approveVlpForSubPool(maxUint256); }

// --- Deposit handlers ---
async function handleDepositVN() {
  const amount = parseInt(depositVnInput.value, 10) || 0;
  if (amount <= 0) return;
  if (subPoolData.userInfo.value.vnStaked + BigInt(amount) > subPoolData.maxWVN2.value) {
    showNotice({ outcome: "failure", text: t("pages.vPool.depositVn.vnCapReached") });
    return;
  }
  try {
    store.setWalletPendingState({ pending: true, text: t("pages.vPool.depositVn.depositVnPending") });
    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.subPool, abi: BarkXSubPoolAbi,
      functionName: "depositVN", args: [BigInt(amount)],
      account: userAccount, ...gasOverrides,
    });
    await waitForTx(hash);
    await loadData();
    depositVnInput.value = "";
    showNotice({ outcome: "success", text: t("pages.vPool.depositVn.depositVnSuccess") });
  } catch (err) {
    console.error("depositVN failed:", err);
    showNotice({ outcome: "failure", text: t("pages.vPool.depositVn.depositVnFailure") });
  } finally {
    store.clearWalletPendingState();
  }
}

async function handleDepositWVN1() {
  const count = parseInt(depositWvnInput.value, 10) || 0;
  if (count <= 0) return;
  if (subPoolData.userInfo.value.vnStaked + BigInt(count) > subPoolData.maxWVN2.value) {
    showNotice({ outcome: "failure", text: t("pages.vPool.depositVn.vnCapReached") });
    return;
  }
  try {
    store.setWalletPendingState({ pending: true, text: t("pages.vPool.depositVn.depositWvnPending") });
    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    // Get user's wVN1 token IDs (enumerate first N)
    const tokenIds = await getUserWvn1TokenIds(userAccount, count);
    if (tokenIds.length === 0) return;
    const gasOverrides = await getGasOverrides();
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.subPool, abi: BarkXSubPoolAbi,
      functionName: "depositWVN1", args: [tokenIds],
      account: userAccount, ...gasOverrides,
    });
    await waitForTx(hash);
    await loadData();
    depositWvnInput.value = "";
    showNotice({ outcome: "success", text: t("pages.vPool.depositVn.depositWvnSuccess") });
  } catch (err) {
    console.error("depositWVN1 failed:", err);
    showNotice({ outcome: "failure", text: t("pages.vPool.depositVn.depositWvnFailure") });
  } finally {
    store.clearWalletPendingState();
  }
}

async function handleDepositWVN2() {
  const count = parseInt(depositWvn2Input.value, 10) || 0;
  if (count <= 0) return;
  if (subPoolData.userInfo.value.vnStaked + BigInt(count) > subPoolData.maxWVN2.value) {
    showNotice({ outcome: "failure", text: t("pages.vPool.depositVn.vnCapReached") });
    return;
  }
  try {
    store.setWalletPendingState({ pending: true, text: t("pages.vPool.depositVn.depositWvn2Pending") });
    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const tokenIds = await getUserWvn2TokenIds(userAccount, count);
    if (tokenIds.length === 0) return;
    const gasOverrides = await getGasOverrides();
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.subPool, abi: BarkXSubPoolAbi,
      functionName: "depositWVN2", args: [tokenIds],
      account: userAccount, ...gasOverrides,
    });
    await waitForTx(hash);
    await loadData();
    depositWvn2Input.value = "";
    showNotice({ outcome: "success", text: t("pages.vPool.depositVn.depositWvn2Success") });
  } catch (err) {
    console.error("depositWVN2 failed:", err);
    showNotice({ outcome: "failure", text: t("pages.vPool.depositVn.depositWvn2Failure") });
  } finally {
    store.clearWalletPendingState();
  }
}

async function handleDepositVLP() {
  const raw = String(depositVlpInput.value ?? "").trim();
  const parsed = safeParseUnits(raw, 18);
  if (!parsed || parsed <= 0n) return;
  try {
    store.setWalletPendingState({ pending: true, text: t("pages.vPool.depositVlp.pending") });
    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.subPool, abi: BarkXSubPoolAbi,
      functionName: "depositVLP", args: [parsed],
      account: userAccount, ...gasOverrides,
    });
    await waitForTx(hash);
    await loadData();
    depositVlpInput.value = "";
    showNotice({ outcome: "success", text: t("pages.vPool.depositVlp.depositVlpSuccess") });
  } catch (err) {
    console.error("depositVLP failed:", err);
    showNotice({ outcome: "failure", text: t("pages.vPool.depositVlp.depositVlpFailure") });
  } finally {
    store.clearWalletPendingState();
  }
}

// --- Token ID enumeration ---
import { getPublicClient } from "@/composables/useContracts";
import { WVN1Abi, WVN2Abi } from "@/abi";

async function getUserWvn1TokenIds(userAddress, count) {
  const client = getPublicClient();
  const totalMinted = await client.readContract({ address: ADDRESSES.wVN1, abi: WVN1Abi, functionName: "totalMinted" });
  const calls = [];
  for (let i = 1n; i <= totalMinted; i++) {
    calls.push({ address: ADDRESSES.wVN1, abi: WVN1Abi, functionName: "ownerOf", args: [i] });
  }
  if (calls.length === 0) return [];
  const results = await client.multicall({ contracts: calls });
  const ids = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].result?.toLowerCase() === userAddress.toLowerCase()) {
      ids.push(BigInt(i + 1));
      if (ids.length >= count) break;
    }
  }
  return ids;
}

async function getUserWvn2TokenIds(userAddress, count) {
  const client = getPublicClient();
  const totalMinted = await client.readContract({ address: ADDRESSES.wVN2, abi: WVN2Abi, functionName: "totalMinted" });
  const calls = [];
  for (let i = 1n; i <= totalMinted; i++) {
    calls.push({ address: ADDRESSES.wVN2, abi: WVN2Abi, functionName: "ownerOf", args: [i] });
  }
  if (calls.length === 0) return [];
  const results = await client.multicall({ contracts: calls });
  const ids = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].result?.toLowerCase() === userAddress.toLowerCase()) {
      ids.push(BigInt(i + 1));
      if (ids.length >= count) break;
    }
  }
  return ids;
}

// --- Withdraw ---
const WD_PAGE_SIZE = 10;
const wdPage = ref(1);
const wdSelected = ref(new Set());
const wdBackendRecords = ref([]);

async function fetchWithdrawDeposits() {
  if (!account.value) return;
  try {
    const data = await getSubPoolDeposits(account.value);
    console.log("[vPool withdraw] backend deposits:", data);
    wdBackendRecords.value = Array.isArray(data) ? data : [];
  } catch {
    wdBackendRecords.value = [];
  }
}

// Backend already returns only unlocked + non-completed records
const wdFullList = computed(() => {
  return wdBackendRecords.value.map(r => {
    const isVn = r.eventType === "DepositVN" || r.eventType === "DepositWVN1" || r.eventType === "DepositWVN2";
    const vlpAmount = r.vlpAmount ? BigInt(String(r.vlpAmount).split(".")[0]) : 0n;
    const unlocksAt = BigInt(String(r.unlocksAt || 0).split(".")[0]);
    const isConfirming = r.claimStatus === "waiting_onchain";
    return {
      id: r.id,
      key: `${isVn ? "vn" : "vlp"}-${r.bucketIdx}`,
      type: isVn ? "vn" : "vlp",
      idx: r.bucketIdx,
      vnCount: isVn ? (Array.isArray(r.tokenIds) ? r.tokenIds.length : 1) : 0,
      vlpAmount: isVn ? 0n : vlpAmount,
      unlocksAt,
      isUnlocked: true, // backend guarantees unlocked
      isConfirming,
      txHash: r.txHash || "",
    };
  });
});

const wdTotalPages = computed(() => Math.max(1, Math.ceil(wdFullList.value.length / WD_PAGE_SIZE)));
const wdPagedList = computed(() => {
  const start = (wdPage.value - 1) * WD_PAGE_SIZE;
  return wdFullList.value.slice(start, start + WD_PAGE_SIZE);
});

const wdCurrentPageSelectableKeys = computed(() => {
  return wdPagedList.value
    .filter(item => item.isUnlocked && !item.isConfirming)
    .map(item => item.key);
});

const wdSelectAllChecked = computed(() => {
  if (wdCurrentPageSelectableKeys.value.length === 0) return false;
  return wdCurrentPageSelectableKeys.value.every(key => wdSelected.value.has(key));
});

function toggleSelect(key) {
  setWithdrawItemSelected(key, !wdSelected.value.has(key));
}

function isWithdrawItemSelected(key) {
  return wdSelected.value.has(key);
}

function setWithdrawItemSelected(key, checked) {
  const next = new Set(wdSelected.value);
  if (checked) next.add(key);
  else next.delete(key);
  wdSelected.value = next;
}

function setCurrentPageSelected(checked) {
  const next = new Set(wdSelected.value);
  for (const key of wdCurrentPageSelectableKeys.value) {
    if (checked) next.add(key);
    else next.delete(key);
  }
  wdSelected.value = next;
}

const wdSummary = computed(() => {
  let vnCount = 0;
  let vlpAmount = 0n;
  for (const item of wdFullList.value) {
    if (!wdSelected.value.has(item.key)) continue;
    if (item.type === "vn") vnCount += item.vnCount;
    vlpAmount += item.vlpAmount;
  }
  const capDecrease = BigInt(vnCount) * subPoolData.vlpPerVN.value;
  return { vnCount, vlpAmount, capDecrease };
});

function formatUnlockDate(ts) {
  if (!ts || ts === 0n) return "";
  return new Date(Number(ts) * 1000).toISOString().slice(0, 16).replace("T", " ");
}

async function handleWithdraw() {
  if (wdSelected.value.size === 0) return;
  const selected = wdFullList.value.filter(item => wdSelected.value.has(item.key));
  if (selected.length === 0) return;
  try {
    store.setWalletPendingState({ pending: true, text: t("pages.vPool.withdraw.withdrawPending") });
    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();

    const vnIdxs = selected.filter(i => i.type === "vn").map(i => BigInt(i.idx));
    const vlpIdxs = selected.filter(i => i.type === "vlp").map(i => BigInt(i.idx));

    console.log("[vPool withdraw] selected items:", selected.map(i => ({ id: i.id, key: i.key, type: i.type, idx: i.idx, isUnlocked: i.isUnlocked, vlpAmount: i.vlpAmount?.toString() })));
    console.log("[vPool withdraw] backend raw records:", wdBackendRecords.value);
    console.log("[vPool withdraw] batchWithdraw args → vnIdxs:", vnIdxs.map(Number), "vlpIdxs:", vlpIdxs.map(Number));
    console.log("[vPool withdraw] contract:", ADDRESSES.subPool, "account:", userAccount);
    console.log("[vPool withdraw] gasOverrides:", JSON.stringify(gasOverrides, (_, v) => typeof v === "bigint" ? v.toString() : v));

    // Simulate first to catch revert before sending to wallet
    await getPublicClient().simulateContract({
      address: ADDRESSES.subPool, abi: BarkXSubPoolAbi,
      functionName: "batchWithdraw", args: [vnIdxs, vlpIdxs],
      account: userAccount,
    });
    console.log("[vPool withdraw] simulate passed");

    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.subPool, abi: BarkXSubPoolAbi,
      functionName: "batchWithdraw", args: [vnIdxs, vlpIdxs],
      account: userAccount, ...gasOverrides,
    });

    // Notify backend that tx has been submitted (status → waiting_onchain)
    const withdrawDepositIds = selected.map(i => i.id).filter(Boolean);
    if (withdrawDepositIds.length > 0) {
      try {
        await claimConfirm(userAccount, withdrawDepositIds);
      } catch (confirmErr) {
        console.warn("claimConfirm (withdraw) failed after tx submission:", confirmErr);
      }
    }

    await waitForTx(hash);
    await loadData();
    wdSelected.value = new Set();
    showNotice({ outcome: "success", text: t("pages.vPool.withdraw.withdrawSuccess") });
  } catch (err) {
    console.error("batchWithdraw failed:", err);
    const revertName = err?.walk?.(e => e?.data?.errorName)?.data?.errorName || err?.cause?.data?.errorName || "";
    if (revertName === "VLPCapExceeded") {
      showNotice({ outcome: "failure", text: t("pages.vPool.withdraw.withdrawFailureCapExceeded") });
    } else {
      showNotice({ outcome: "failure", text: t("pages.vPool.withdraw.withdrawFailure") });
    }
  } finally {
    store.clearWalletPendingState();
  }
}

// --- Claim ---
async function handleClaim() {
  if (rewardsDisabled.value) return;

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.vPool.rewards.claimPending") });

    const { amount, deadline, signature } = await requestSubPoolClaimSignature(account.value);
    console.log("[vPool claim] sign response:", { amount, deadline, signature: signature?.slice(0, 10) + "..." });

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();

    const claimAmount = formatTokenAmount(pendingRewards.value, 18, 2);
    const claimArgs = [BigInt(amount), BigInt(deadline), signature];
    console.log("[vPool claim] contract:", ADDRESSES.subPool, "account:", userAccount);
    console.log("[vPool claim] args → amount:", claimArgs[0].toString(), "deadline:", claimArgs[1].toString(), "signature:", signature);
    console.log("[vPool claim] gasOverrides:", JSON.stringify(gasOverrides, (_, v) => typeof v === "bigint" ? v.toString() : v));

    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.subPool,
      abi: BarkXSubPoolAbi,
      functionName: "claim",
      args: claimArgs,
      account: userAccount,
      ...gasOverrides,
    });
    console.log("[vPool claim] tx hash:", hash);

    await waitForTx(hash);
    await loadData();
    pendingRewards.value = 0n;
    showNotice({ outcome: "success", text: t("pages.vPool.rewards.claimSuccess", { amount: claimAmount }) });
  } catch (err) {
    console.error("claim failed:", err);
    showNotice({ outcome: "failure", text: t("pages.vPool.rewards.claimFailure") });
  } finally {
    store.clearWalletPendingState();
  }
}

// --- Data loading ---
async function fetchPendingRewards() {
  if (!account.value) return;
  try {
    const data = await getSubPoolUserInfo(account.value);
    console.log("[vPool] userInfo response:", data);
    console.log("[vPool] pendingRewards raw:", data?.pendingRewards, "type:", typeof data?.pendingRewards);
    pendingRewards.value = data?.pendingRewards ? BigInt(data.pendingRewards) : 0n;
    console.log("[vPool] pendingRewards parsed:", pendingRewards.value.toString());
  } catch (err) {
    console.error("[vPool] fetchPendingRewards failed:", err);
    pendingRewards.value = 0n;
  }
}

async function fetchApr() {
  try {
    const data = await getSubPoolInfo();
    currentApr.value = data?.apr ?? data?.apy ?? "";
  } catch {
    currentApr.value = "";
  }
}

async function loadData() {
  if (!walletConnected.value || !walletIsTargetChain.value || !account.value) return;
  await Promise.all([
    subPoolData.fetchAll(account.value),
    fetchPendingRewards(),
    fetchApr(),
    fetchWithdrawDeposits(),
  ]);
}

// --- VIP black-gold theme: override CSS variables on :root ---
const VIP_THEME_VARS = {
  "--cyan": "#fbbf24",
  "--cyan-glow": "rgba(251, 191, 36, 0.4)",
  "--purple": "#f59e0b",
  "--green": "#fde68a",
  "--green-glow": "rgba(253, 230, 138, 0.4)",
  "--amber": "#f59e0b",
  "--bg-dark": "#0a0806",
  "--bg-card": "rgba(18, 14, 10, 0.95)",
  "--bg-card-solid": "#14100c",
  "--border-dark": "rgba(251, 191, 36, 0.15)",
  "--border-glow": "rgba(251, 191, 36, 0.35)",
};
const savedThemeVars = {};

onMounted(() => {
  // Apply VIP theme
  const root = document.documentElement;
  for (const [key, val] of Object.entries(VIP_THEME_VARS)) {
    savedThemeVars[key] = root.style.getPropertyValue(key);
    root.style.setProperty(key, val);
  }

  loadData();
  // Show VIP invite popup on first visit
  const hasBeenInvited = document.cookie.split("; ").find(row => row.startsWith("vpool_invited="));
  if (!hasBeenInvited) {
    openInvite();
  }
});

onUnmounted(() => {
  // Restore original theme
  const root = document.documentElement;
  for (const [key] of Object.entries(VIP_THEME_VARS)) {
    if (savedThemeVars[key]) {
      root.style.setProperty(key, savedThemeVars[key]);
    } else {
      root.style.removeProperty(key);
    }
  }
  // Ensure body scroll is restored
  document.body.style.overflow = "";
});
watch(() => account.value, loadData);

// --- Route sync ---
watch(
  () => [route.query.tab, route.query.sub],
  ([tab, sub]) => {
    const validTabs = ["dep-vn", "dep-vlp", "withdraw", "rewards"];
    activeTab.value = validTabs.includes(tab) ? tab : "dep-vn";
    if (activeTab.value === "dep-vn") {
      const validSubs = ["dep-vn-new", "dep-vn-wvn", "dep-vn-wvn2"];
      activeDepositVnTab.value = validSubs.includes(sub) ? sub : "dep-vn-new";
    }
  },
  { immediate: true },
);

watch(activeTab, (tab) => {
  const query = { ...route.query, tab };
  if (tab === "dep-vn") query.sub = activeDepositVnTab.value;
  else delete query.sub;
  if (route.query.tab !== query.tab || route.query.sub !== query.sub) router.replace({ query });
});

watch(activeDepositVnTab, (sub) => {
  if (activeTab.value !== "dep-vn") return;
  if (route.query.sub !== sub) router.replace({ query: { ...route.query, tab: "dep-vn", sub } });
});
</script>

<style scoped>
/* =========================================
   VIP Pool 黑金/橙金视觉主题覆盖
   ========================================= */
/* CSS variables are set via JS in onMounted/onUnmounted (VIP_THEME_VARS) */

:deep(.header) { background: rgba(10, 8, 6, 0.85) !important; }
:deep(.grid-bg) {
  background-image:
    linear-gradient(rgba(251, 191, 36, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(251, 191, 36, 0.03) 1px, transparent 1px) !important;
}
:deep(.glow-bg) {
  background:
    radial-gradient(ellipse at 20% 0%, rgba(251, 191, 36, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(245, 158, 11, 0.06) 0%, transparent 50%) !important;
}
:deep(.tab.active) { background: rgba(251, 191, 36, 0.15) !important; }

/* --- Stats grid (APR / Lock Period) --- */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}
.stat-card-title {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}
.stat-card-value {
  font-family: "JetBrains Mono", monospace;
  font-size: 20px;
  font-weight: 600;
}
:deep(.info-box) { background: rgba(251, 191, 36, 0.05) !important; }
:deep(.info-box.amber) { background: rgba(245, 158, 11, 0.05) !important; }
:deep(.p-btn) { background: rgba(251, 191, 36, 0.1) !important; border-color: rgba(251, 191, 36, 0.3) !important; }
:deep(.p-btn:hover) { background: rgba(251, 191, 36, 0.2) !important; }
:deep(.nav-link:hover), :deep(.nav-link.active) { background: rgba(251, 191, 36, 0.1) !important; }
:deep(.btn-submit) {
  background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%) !important;
  color: #000 !important;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.3) !important;
}
:deep(.btn-submit.amber), :deep(.btn-submit.purple) {
  background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%) !important;
  color: #fff !important;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.3) !important;
}
:deep(.brand-logo) { box-shadow: 0 0 10px rgba(251, 191, 36, 0.15) !important; }
:deep(.brand-logo:hover) { box-shadow: 0 0 15px rgba(251, 191, 36, 0.4) !important; }
:deep(.btn-submit:disabled), :deep(.btn-submit[disabled]) {
  opacity: 0.6 !important;
}

/* ========================================= */

.data-lbl { flex-shrink: 0; white-space: nowrap; margin-right: 12px; }
.data-val { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }

.rewards-big-value {
  font-size: 36px; font-weight: 700; color: var(--cyan);
  font-family: "JetBrains Mono", monospace;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rewards-big-unit { font-size: 20px; }

.sub-tab-container {
  display: flex; background: rgba(0,0,0,0.4); border: 1px solid var(--border-dark);
  border-radius: 12px; padding: 4px; margin-bottom: 20px;
}
.sub-tab-btn {
  flex: 1; padding: 10px; background: transparent; border: none;
  color: var(--text-secondary); font-size: 14px; font-weight: 600;
  border-radius: 8px; cursor: pointer; transition: all 0.3s ease;
}
.sub-tab-btn.active {
  background: rgba(251, 191, 36, 0.15); color: var(--cyan);
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.2);
}
.sub-panel { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

.withdraw-select-row { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
.withdraw-select-all { display: flex; align-items: center; cursor: pointer; font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.withdraw-select-all input { margin-right: 8px; accent-color: var(--amber); transform: scale(1.2); }

.order-list { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; min-height: 200px; }
.order-empty { text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px; }
.order-item {
  display: flex; align-items: center; padding: 14px; min-height: 80px;
  background: rgba(0,0,0,0.3); border: 1px solid var(--border-dark);
  border-radius: 12px; cursor: pointer; transition: all 0.3s ease;
}
.order-item:hover { border-color: var(--amber); background: rgba(245,158,11,0.05); }
.order-item.is-selected { border-color: rgba(245,158,11,0.55); background: rgba(245,158,11,0.08); }
.order-item.is-locked { opacity: 0.5; cursor: not-allowed; }
.order-checkbox { margin-right: 14px; accent-color: var(--amber); transform: scale(1.3); cursor: pointer; }
.order-details-left { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.order-id { font-family: "JetBrains Mono", monospace; font-size: 13px; color: var(--text-primary); font-weight: 600; }
.order-status { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
.order-status.is-unlocked { color: var(--green); }
.order-status.is-locked { color: var(--text-muted); }
.order-assets-right { text-align: right; display: flex; flex-direction: column; gap: 4px; }
.asset-line { font-size: 14px; color: var(--text-secondary); font-weight: 500; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; margin-bottom: 8px; }
.page-info { font-size: 13px; color: var(--text-primary); font-weight: 600; letter-spacing: 1px; }
.page-btn {
  background: rgba(0,0,0,0.4); border: 1px solid var(--border-dark); border-radius: 8px;
  color: var(--text-primary); padding: 6px 16px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.3s;
}
.page-btn:hover:not(:disabled) { border-color: var(--amber); color: var(--amber); background: rgba(245,158,11,0.1); }
.page-btn:disabled { opacity: 0.6; }

.withdraw-summary-card {
  background: rgba(0,0,0,0.4); border: 1px solid var(--border-dark);
  border-radius: 12px; padding: 16px; margin-top: 16px;
}
.withdraw-summary-title { font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }

/* VIP Invite Popup */
.vip-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 1;
  transition: opacity 0.5s ease;
}
.vip-card {
  width: 88%;
  max-width: 380px;
  min-height: 60vh;
  max-height: 76vh;
  overflow-y: auto;
  background: linear-gradient(180deg, #1a1610 0%, #06080d 100%);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 20px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(245, 158, 11, 0.1);
  position: relative;
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  animation: vipSlideUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  cursor: pointer;
  box-sizing: border-box;
}
.vip-card::-webkit-scrollbar { width: 4px; }
.vip-card::-webkit-scrollbar-track { background: transparent; }
.vip-card::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.3); border-radius: 4px; }
.vip-card::-webkit-scrollbar-thumb:hover { background: rgba(245, 158, 11, 0.5); }
@keyframes vipSlideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
.vip-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 20px;
  cursor: pointer;
  transition: color 0.3s;
  padding: 8px;
}
.vip-close:hover { color: var(--amber); }
.vip-header-title {
  font-family: "Outfit", sans-serif;
  font-weight: 300;
  font-size: 24px;
  letter-spacing: 4px;
  color: #fbbf24;
  text-shadow: 0 2px 15px rgba(245, 158, 11, 0.3);
  text-transform: uppercase;
  margin-top: 10px;
  margin-bottom: 20px;
  flex-shrink: 0;
}
.vip-header-title::after {
  content: "";
  display: block;
  width: 30px;
  height: 1px;
  background: rgba(245, 158, 11, 0.4);
  margin: 20px auto 0;
}
.vip-body-text {
  color: #fde68a;
  font-size: 14px;
  line-height: 1.8;
  font-weight: 300;
  margin-bottom: 20px;
  transition: opacity 0.3s ease;
  opacity: 1;
  width: 100%;
}
.vip-body-text :deep(p) { margin-bottom: 12px; }
.vip-signature {
  margin-top: auto;
  margin-bottom: 30px;
  color: #fbbf24;
  font-size: 16px;
  font-weight: 300;
  letter-spacing: 1px;
  font-style: italic;
  flex-shrink: 0;
}
.vip-signature span {
  transition: opacity 0.3s ease;
}
.vip-signature strong {
  font-style: normal;
  font-weight: 500;
  display: block;
  margin-top: 4px;
  color: var(--amber);
}
.vip-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background-image: url("/my-icon.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.15);
  flex-shrink: 0;
}
</style>
