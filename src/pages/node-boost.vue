<template>
  <Transition name="boost-modal-fade">
    <div
      v-if="activeModalKey"
      class="boost-modal-overlay"
      @click="closeModal"
    >
      <div
        class="boost-modal"
        :class="{ show: activeModalKey }"
        @click.stop
      >
        <button
          class="boost-modal-close"
          type="button"
          :aria-label="$t('pages.nodeBoost.modal.close')"
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
        <div class="boost-modal-title">{{ modalTitle }}</div>
        <div class="boost-modal-text" v-html="modalText"></div>
      </div>
    </div>
  </Transition>

  <MiningShell>
    <div class="page-header">
      <h1 class="page-title">{{ $t("pages.nodeBoost.title") }}</h1>
      <p class="page-subtitle">{{ $t("pages.nodeBoost.subtitle") }}</p>
    </div>

    <div
      class="total-boost-card"
      @click="openModal('protocol')"
    >
      <div class="info-icon" aria-hidden="true">
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
      <div class="total-title">{{ $t("pages.nodeBoost.totalCard.title") }}</div>
      <div
        class="total-val"
        :class="{ empty: totalMultiplier <= 1 }"
      >
        x{{ totalMultiplier.toFixed(2) }}
      </div>
    </div>

    <div class="boost-breakdown-card">
      <div class="breakdown-header">
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
          <polygon
            points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
          ></polygon>
        </svg>
        {{ $t("pages.nodeBoost.active.title") }}
      </div>

      <div id="boost-list-container">
        <template v-if="activeBoosts.length">
          <div
            v-for="boost in activeBoosts"
            :key="boost.key"
            class="boost-row"
            @click="openModal(boost.key)"
          >
            <div class="boost-info">
              <div class="boost-name">{{ boost.name }}</div>
              <div class="boost-meta" v-html="boost.metaHtml"></div>
            </div>
            <div
              class="boost-rate"
              :class="{ 'boost-rate--negative': boost.tone === 'negative' }"
            >
              {{ boost.rateLabel }}
            </div>
          </div>
        </template>

        <div v-else class="empty-state">
          {{ $t("pages.nodeBoost.active.empty") }}
        </div>
      </div>
    </div>

    <div class="collapsible-card">
      <div
        class="collapsible-header"
        @click="toggleAvailableBoosts"
      >
        <span class="collapsible-header-label">
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
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            ></path>
          </svg>
          {{ $t("pages.nodeBoost.available.title") }}
        </span>
        <span
          class="chevron"
          :class="{ up: isAvailableExpanded }"
        >
          ▼
        </span>
      </div>

      <div
        id="available-boosts-content"
        class="collapsible-content"
        :class="{ show: isAvailableExpanded }"
      >
        <div id="available-list-container">
          <template v-if="availableBoosts.length">
            <div
              v-for="boost in availableBoosts"
              :key="boost.key"
              class="avail-boost-row"
            >
              <div class="boost-info">
                <div class="avail-name">{{ boost.name }}</div>
                <div class="avail-meta" v-html="boost.metaHtml"></div>
              </div>
              <div class="avail-rate">{{ boost.rateLabel }}</div>
            </div>
          </template>

          <div v-else class="empty-state empty-state--plain">
            {{ $t("pages.nodeBoost.available.allUnlocked") }}
          </div>
        </div>
      </div>
    </div>
  </MiningShell>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import MiningShell from "@/components/mining/MiningShell.vue";
import { useMainStore } from "@/store";
import {
  getCompoundConfig,
  getCompoundRatio,
  getUserInfo,
} from "@/composables/useBackend";

const { t } = useI18n({ useScope: "global" });

const DEFAULT_NODE_BOOST_CONFIG = Object.freeze({
  leaderMaxRate: 0.2,
  compoundMaxRate: 0.1,
  compoundThreshold: 50,
});
const EMPTY_BOOST_STATE = Object.freeze({
  total: 1,
  permanentRate: 0,
  leaderMedalRate: 0,
  leaderDaysLeft: null,
  compoundMedalRate: 0,
  evaluatedCompoundRatio: 0,
  liveCompoundRatio: 0,
  compoundNextEvalDate: "",
  deviceRate: 0,
  penaltyRate: 0,
});

const activeModalKey = ref("");
const isAvailableExpanded = ref(false);
const backendBoostState = ref({ ...EMPTY_BOOST_STATE });
const nodeBoostConfig = ref({ ...DEFAULT_NODE_BOOST_CONFIG });
let latestLoadId = 0;

const { account, walletConnected, walletIsTargetChain } = storeToRefs(useMainStore());

const currentBoostData = computed(() => backendBoostState.value);

const activeBoosts = computed(() => {
  const data = currentBoostData.value;
  const items = [];

  if (data.leaderMedalRate > 0) {
    items.push({
      key: "leadership",
      rate: data.leaderMedalRate,
      rateLabel: formatSignedPercent(data.leaderMedalRate),
      name: t("pages.nodeBoost.boosts.leadership.name"),
      metaHtml: buildLeaderMetaHtml(data.leaderDaysLeft),
    });
  }

  if (data.compoundMedalRate > 0) {
    items.push({
      key: "compound",
      rate: data.compoundMedalRate,
      rateLabel: formatSignedPercent(data.compoundMedalRate),
      name: t("pages.nodeBoost.boosts.compound.name"),
      metaHtml: buildCompoundMetaHtml(data.compoundNextEvalDate),
    });
  }

  if (data.permanentRate > 0) {
    items.push({
      key: "permanent",
      rate: data.permanentRate,
      rateLabel: formatSignedPercent(data.permanentRate),
      name: t("pages.nodeBoost.boosts.permanent.name"),
      metaHtml: t("pages.nodeBoost.boosts.permanent.meta"),
    });
  }

  return items;
});

const availableBoosts = computed(() => {
  const data = currentBoostData.value;
  const items = [];

  if (data.leaderMedalRate <= 0) {
    items.push({
      key: "leadership",
      name: t("pages.nodeBoost.boosts.leadership.name"),
      metaHtml: t("pages.nodeBoost.boosts.leadership.unlockHint"),
      rateLabel: t("pages.nodeBoost.boosts.leadership.upTo", {
        rate: formatPercent(nodeBoostConfig.value.leaderMaxRate),
      }),
    });
  }

  if (data.compoundMedalRate <= 0) {
    items.push({
      key: "compound",
      name: t("pages.nodeBoost.boosts.compound.name"),
      metaHtml: buildAvailableCompoundMetaHtml(data.compoundNextEvalDate),
      rateLabel: t("pages.nodeBoost.boosts.compound.upTo", {
        rate: "10%",
      }),
    });
  }

  return items;
});

const totalMultiplier = computed(() => {
  const data = currentBoostData.value;
  if (Number.isFinite(data.total)) {
    return data.total;
  }

  return calculateTotalMultiplier(data);
});

const modalTitle = computed(() => {
  if (!activeModalKey.value) {
    return "";
  }

  return t(`pages.nodeBoost.modals.${activeModalKey.value}.title`);
});

const modalText = computed(() => {
  if (!activeModalKey.value) {
    return "";
  }

  if (activeModalKey.value === "compound") {
    return t("pages.nodeBoost.modals.compound.text", {
      ratio: currentBoostData.value.evaluatedCompoundRatio || 0,
      threshold: nodeBoostConfig.value.compoundThreshold,
    });
  }

  return t(`pages.nodeBoost.modals.${activeModalKey.value}.text`);
});

function formatPercent(rate) {
  return `${(rate * 100).toFixed(0)}%`;
}

function formatSignedPercent(rate) {
  const formatted = formatPercent(Math.abs(rate));
  return `${rate >= 0 ? "+" : "-"}${formatted}`;
}

function getDaysUntilUtcDate(dateString) {
  if (!dateString) {
    return null;
  }

  const parts = String(dateString).split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  const [year, month, day] = parts;
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const targetUtc = Date.UTC(year, month - 1, day);

  return Math.max(0, Math.round((targetUtc - todayUtc) / 86400000));
}

function parseRate(value) {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseInteger(value) {
  const parsed = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateTotalMultiplier(data) {
  const rawBonusRate =
    data.permanentRate +
    data.leaderMedalRate +
    data.compoundMedalRate +
    data.deviceRate;
  const bonusRate = Math.min(rawBonusRate, 1);
  const penaltyMultiplier = 1 + data.penaltyRate;
  const rawBoost = (1 + bonusRate) * penaltyMultiplier;

  return Math.min(rawBoost, 2);
}

function formatUtcDate(date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function resolveNextGlobalEvaluationDate(nextEvalDate) {
  if (nextEvalDate) {
    return String(nextEvalDate);
  }

  const now = new Date();
  const currentUtcDay = now.getUTCDay();
  const isSundayBeforeCutoff = currentUtcDay === 0 && now.getUTCHours() < 22;
  const daysUntilSunday =
    currentUtcDay === 0
      ? (isSundayBeforeCutoff ? 0 : 7)
      : 7 - currentUtcDay;

  return formatUtcDate(new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilSunday,
  )));
}

function buildLeaderMetaHtml(daysLeft) {
  const days = Number.isFinite(daysLeft) ? daysLeft : 0;
  const countdownClass = days <= 7
    ? "countdown-days countdown-days--urgent"
    : "countdown-days";
  return `${t("pages.nodeBoost.boosts.leadership.expiresIn")} <strong class="${countdownClass}">${days} ${t("pages.nodeBoost.days")}</strong>`;
}

function buildCompoundMetaHtml(nextEvalDate) {
  const resolvedDate = resolveNextGlobalEvaluationDate(nextEvalDate);
  const days = getDaysUntilUtcDate(resolvedDate) ?? 0;
  return `${t("pages.nodeBoost.boosts.compound.nextEvaluation")} <strong class="countdown-days countdown-days--urgent">${days} ${t("pages.nodeBoost.days")}</strong>`;
}

function buildAvailableCompoundMetaHtml(nextEvalDate) {
  const resolvedDate = resolveNextGlobalEvaluationDate(nextEvalDate);
  const days = getDaysUntilUtcDate(resolvedDate) ?? 0;
  return `${t("pages.nodeBoost.boosts.compound.globalEvaluation")} <strong>${days} ${t("pages.nodeBoost.days")}</strong>`;
}

function resetBoostState() {
  backendBoostState.value = { ...EMPTY_BOOST_STATE };
}

function applyCompoundConfig(config) {
  const hasCompoundMaxRate = Object.prototype.hasOwnProperty.call(config || {}, "compoundMedalA");
  const hasCompoundThreshold = Object.prototype.hasOwnProperty.call(config || {}, "compoundMedalK");
  const compoundMaxRate = Number.parseFloat(String(config?.compoundMedalA ?? ""));
  const compoundThreshold = Number.parseInt(String(config?.compoundMedalK ?? ""), 10);

  nodeBoostConfig.value = {
    ...DEFAULT_NODE_BOOST_CONFIG,
    compoundMaxRate:
      hasCompoundMaxRate && Number.isFinite(compoundMaxRate)
        ? compoundMaxRate
        : DEFAULT_NODE_BOOST_CONFIG.compoundMaxRate,
    compoundThreshold:
      hasCompoundThreshold && Number.isFinite(compoundThreshold)
        ? compoundThreshold
        : DEFAULT_NODE_BOOST_CONFIG.compoundThreshold,
  };
}

function applyUserInfo(userInfo, compoundRatioData) {
  const nodeBoost = userInfo?.nodeBoost || {};
  const parsedState = {
    total: parseRate(nodeBoost.total),
    permanentRate: parseRate(nodeBoost.permanentRate),
    leaderMedalRate: parseRate(nodeBoost.leaderMedal?.rate),
    leaderDaysLeft:
      nodeBoost.leaderMedal?.daysLeft ?? null,
    compoundMedalRate: parseRate(nodeBoost.compoundMedal?.rate),
    evaluatedCompoundRatio:
      parseInteger(nodeBoost.compoundMedal?.compoundRatio ?? userInfo?.compoundRatio),
    liveCompoundRatio:
      parseInteger(compoundRatioData?.compoundRatio ?? userInfo?.compoundRatio),
    compoundNextEvalDate: String(nodeBoost.compoundMedal?.nextEvalDate || ""),
    deviceRate: parseRate(nodeBoost.deviceRate),
    penaltyRate: parseRate(userInfo?.penaltyRate),
  };

  if (!Number.isFinite(parsedState.total) || parsedState.total <= 0) {
    parsedState.total = calculateTotalMultiplier(parsedState);
  }

  backendBoostState.value = parsedState;
}

function openModal(key) {
  document.body.style.overflow = "hidden";
  activeModalKey.value = key;
}

function closeModal() {
  document.body.style.overflow = "";
  activeModalKey.value = "";
}

onBeforeUnmount(() => {
  document.body.style.overflow = "";
});

function toggleAvailableBoosts() {
  isAvailableExpanded.value = !isAvailableExpanded.value;
}

async function loadNodeBoost() {
  if (!account.value || !walletConnected.value || !walletIsTargetChain.value) {
    resetBoostState();
    nodeBoostConfig.value = { ...DEFAULT_NODE_BOOST_CONFIG };
    return;
  }

  const currentLoadId = ++latestLoadId;

  const [userInfoResult, compoundRatioResult, compoundConfigResult] = await Promise.allSettled([
    getUserInfo(account.value),
    getCompoundRatio(account.value),
    getCompoundConfig(),
  ]);

  if (currentLoadId !== latestLoadId) {
    return;
  }

  if (compoundConfigResult.status === "fulfilled") {
    applyCompoundConfig(compoundConfigResult.value);
  } else {
    nodeBoostConfig.value = { ...DEFAULT_NODE_BOOST_CONFIG };
  }

  const userInfo =
    userInfoResult.status === "fulfilled" ? userInfoResult.value : null;
  const compoundRatioData =
    compoundRatioResult.status === "fulfilled" ? compoundRatioResult.value : null;

  if (userInfo) {
    applyUserInfo(userInfo, compoundRatioData);
    return;
  }

  backendBoostState.value = {
    ...EMPTY_BOOST_STATE,
    liveCompoundRatio: parseInteger(compoundRatioData?.compoundRatio),
  };

  const userInfoError =
    userInfoResult.status === "rejected" ? userInfoResult.reason : null;
  const compoundRatioError =
    compoundRatioResult.status === "rejected" ? compoundRatioResult.reason : null;

  if (userInfoError?.responseCode === 404) {
    return;
  }

  if (userInfoError || (compoundRatioError && compoundRatioError?.responseCode !== 404)) {
    return;
  }
}

watch(
  () => [account.value, walletConnected.value, walletIsTargetChain.value],
  () => {
    loadNodeBoost();
  },
  { immediate: true },
);
</script>

<style scoped>
.page-header {
  position: relative;
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  color: var(--text-muted);
  font-size: 14px;
  margin: 10px 0 0;
}

.total-boost-card {
  text-align: center;
  padding: 48px 20px;
  background: radial-gradient(
    circle at center top,
    rgba(245, 158, 11, 0.15) 0%,
    rgba(0, 0, 0, 0.4) 80%
  );
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: 0 10px 40px rgba(245, 158, 11, 0.1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.total-boost-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(245, 158, 11, 0.15);
}

.total-boost-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--amber), transparent);
  opacity: 0.5;
}

.total-title {
  font-size: 13px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 12px;
  font-weight: 600;
}

.total-val {
  font-family: "JetBrains Mono", monospace;
  font-size: 56px;
  font-weight: 700;
  color: var(--amber);
  text-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
  line-height: 1;
  transition:
    color 0.3s ease,
    text-shadow 0.3s ease;
}

.total-val.empty {
  color: var(--text-secondary);
  text-shadow: none;
}

.info-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  color: var(--text-muted);
  transition: color 0.3s ease;
}

.total-boost-card:hover .info-icon {
  color: var(--amber);
}

.boost-breakdown-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 16px;
  padding: 24px;
}

.breakdown-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--cyan);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.boost-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.boost-row:hover {
  border-color: rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.05);
  transform: translateY(-2px);
}

.boost-row:last-child {
  margin-bottom: 0;
}

.boost-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.boost-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.boost-meta {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
  display: flex;
  align-items: center;
  gap: 12px;
}

.boost-meta :deep(strong),
.avail-meta :deep(strong) {
  color: inherit;
  font-weight: 600;
}

.boost-meta :deep(.countdown-days--urgent),
.avail-meta :deep(.countdown-days--urgent) {
  color: #ec4899;
}

.boost-rate {
  font-family: "JetBrains Mono", monospace;
  font-size: 20px;
  font-weight: 700;
  color: var(--green);
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
  flex-shrink: 0;
  margin-left: 16px;
}

.boost-rate--negative {
  color: #f87171;
  text-shadow: 0 0 10px rgba(248, 113, 113, 0.22);
}

.collapsible-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 16px;
  margin-top: 24px;
  margin-bottom: 24px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.collapsible-card:hover {
  border-color: var(--border-glow);
}

.collapsible-header {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  color: var(--cyan);
  font-size: 15px;
}

.collapsible-header-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapsible-content {
  padding: 0 24px 24px;
  display: none;
}

.collapsible-content.show {
  display: block;
  animation: fadeIn 0.3s ease;
}

.chevron {
  transition: transform 0.3s ease;
  display: inline-block;
}

.chevron.up {
  transform: rotate(180deg);
}

.avail-boost-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
  gap: 16px;
}

.avail-boost-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.avail-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.avail-meta {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
}

.avail-rate {
  font-family: "JetBrains Mono", monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
  font-size: 14px;
  font-style: italic;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px dashed var(--border-dark);
}

.empty-state--plain {
  padding: 20px;
  border: none;
  background: transparent;
}

.boost-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1200;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.boost-modal {
  width: 88%;
  max-width: 360px;
  background: rgba(18, 14, 10, 0.95);
  border: 1px solid var(--cyan);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}

.boost-modal.show {
  transform: translateY(0);
}

.boost-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  padding: 0;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.3s ease;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.boost-modal-close:hover {
  color: var(--amber);
}

.boost-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  padding-right: 28px;
}

.boost-modal-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.boost-modal-text :deep(strong) {
  color: var(--cyan);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.boost-modal-fade-enter-active,
.boost-modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.boost-modal-fade-enter-active .boost-modal,
.boost-modal-fade-leave-active .boost-modal {
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.boost-modal-fade-enter-from,
.boost-modal-fade-leave-to {
  opacity: 0;
}

.boost-modal-fade-enter-from .boost-modal,
.boost-modal-fade-leave-to .boost-modal {
  transform: translateY(20px);
}
</style>
