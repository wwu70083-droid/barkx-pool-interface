<template>
  <MiningShell class="incubator-page-theme">
    <div
      v-if="showIncubateModal"
      class="custom-modal-overlay"
      @click="closeIncubateModal"
    >
      <div class="custom-modal cyan-theme" @click.stop>
        <button class="custom-modal-close" type="button" :aria-label="$t('common.modals.close')" @click="closeIncubateModal">
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
        <div class="custom-modal-title">{{ $t("pages.incubator.modal.title") }}</div>
        <div class="custom-modal-text">
          {{ $t("pages.incubator.modal.messageBefore") }}
          <strong style="color: var(--cyan-bright)">{{ incubateOutputAmount }}</strong>
          {{ $t("pages.incubator.modal.messageAfter") }}
        </div>
        <button class="btn-submit" type="button" style="margin-top: 20px" @click="closeIncubateModal">
          {{ $t("pages.incubator.modal.confirm") }}
        </button>
      </div>
    </div>

    <div style="text-align: center; margin-bottom: 20px; position: relative">
      <h1 style="font-size: 28px; color: var(--text-primary)">
        {{ $t("pages.incubator.title") }}
      </h1>
      <p style="color: var(--text-muted); font-size: 14px">
        {{ $t("pages.incubator.subtitle") }}
      </p>

      <div
        style="
          position: absolute;
          right: 0;
          top: -10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-end;
        "
      >
        <button
          class="sim-toggle-mini"
          :class="{ 'danger-state': !hasDaoMembership }"
          type="button"
          @click="hasDaoMembership = !hasDaoMembership"
        >
          {{ $t("pages.incubator.dao.status", { status: hasDaoMembership ? $t("pages.incubator.dao.yes") : $t("pages.incubator.dao.no") }) }}
        </button>
      </div>
    </div>

    <div
      v-if="!hasDaoMembership"
      class="card"
      style="
        text-align: center;
        border-style: dashed;
        border-color: var(--red);
        padding: 40px 20px;
        margin-top: 20px;
      "
    >
      <span
        style="
          font-size: 48px;
          display: block;
          margin-bottom: 20px;
          filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.5));
        "
      >
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="display: inline-block"
        >
          <rect x="3" y="11" width="18" height="11" rx="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </span>
      <h2 style="color: var(--text-primary); font-size: 22px; margin-bottom: 12px">
        {{ $t("pages.incubator.accessDenied.title") }}
      </h2>
      <p style="color: var(--text-muted); font-size: 14px; line-height: 1.6">
        {{ $t("pages.incubator.accessDenied.messageBefore") }}<br />
        {{ $t("pages.incubator.accessDenied.messageAction") }}
        <a
          href="https://opendao.cc/"
          target="_blank"
          rel="noopener noreferrer"
          class="ext-link-inline"
        >
          OpenDAO
        </a>
        {{ $t("pages.incubator.accessDenied.messageAfter") }}
      </p>
    </div>

    <template v-else>
      <div class="tabs">
        <div class="tab" :class="{ active: activeTab === 'deposit' }" @click="activeTab = 'deposit'">
          {{ $t("pages.incubator.tabs.deposit") }}
        </div>
        <div class="tab" :class="{ active: activeTab === 'withdraw' }" @click="activeTab = 'withdraw'">
          {{ $t("pages.incubator.tabs.withdraw") }}
        </div>
        <div class="tab" :class="{ active: activeTab === 'incubate' }" @click="activeTab = 'incubate'">
          {{ $t("pages.incubator.tabs.incubate") }}
        </div>
      </div>

      <div class="panel" :class="{ active: activeTab === 'deposit' }">
        <div class="info-box">
          {{ $t("pages.incubator.deposit.infoBefore") }}
          <strong style="color: var(--cyan-bright)">{{ $t("pages.incubator.snapshotTime") }}</strong>
          {{ $t("pages.incubator.deposit.infoAfter") }}
        </div>

        <div class="input-group">
          <div class="input-header">
            <span>{{ $t("pages.incubator.deposit.amount") }}</span>
            <span>{{ $t("common.balance", { amount: '12,000.00 vBARKX' }) }}</span>
          </div>
          <div class="input-row">
            <input v-model="depositInput" type="text" inputmode="decimal" class="input-field" placeholder="0.00" />
            <div class="asset-badge">vBARKX</div>
          </div>
          <div class="percent-btns">
            <button class="p-btn" type="button" @click="depositInput = '12000.00'">
              {{ $t("common.max") }}
            </button>
          </div>
        </div>

        <button class="btn-submit" type="button">
          {{ $t("pages.incubator.deposit.approve") }}
        </button>
      </div>

      <div class="panel" :class="{ active: activeTab === 'withdraw' }">
        <div class="info-box amber">
          {{ $t("pages.incubator.withdraw.info") }}
        </div>

        <div class="input-group">
          <div class="input-header">
            <span>{{ $t("pages.incubator.withdraw.amount") }}</span>
            <span>{{ $t("pages.incubator.poolBalance", { amount: '25,000.00 vBARKX' }) }}</span>
          </div>
          <div class="input-row">
            <input v-model="withdrawInput" type="text" inputmode="decimal" class="input-field" placeholder="0.00" />
            <div class="asset-badge">vBARKX</div>
          </div>
          <div class="percent-btns">
            <button class="p-btn" type="button" @click="withdrawInput = '25000.00'">
              {{ $t("common.max") }}
            </button>
          </div>
        </div>

        <button class="btn-submit amber" type="button" style="margin-top: 16px">
          {{ $t("pages.incubator.withdraw.action") }}
        </button>
      </div>

      <div class="panel" :class="{ active: activeTab === 'incubate' }">
        <div class="info-box">
          {{ $t("pages.incubator.incubate.infoBefore") }}
          <strong style="color: var(--cyan-bright); text-shadow: 0 0 10px var(--cyan-glow)">1:1</strong>
          {{ $t("pages.incubator.incubate.infoAfter") }}
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-title">{{ $t("pages.incubator.incubate.globalQuotaToday") }}</div>
            <div class="stat-card-value" style="color: var(--text-primary)">
              500,000
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-title">{{ $t("pages.incubator.incubate.yourQuotaToday") }}</div>
            <div class="stat-card-value green">1,250.00</div>
          </div>
        </div>

        <div class="input-group" style="border-color: var(--cyan)">
          <div class="input-header">
            <span style="color: var(--cyan-bright); font-weight: 600">{{ $t("pages.incubator.incubate.amount") }}</span>
            <span>{{ $t("pages.incubator.poolBalance", { amount: '25,000.00 vBARKX' }) }}</span>
          </div>
          <div class="input-row">
            <input
              v-model="incubateInput"
              type="text"
              inputmode="decimal"
              class="input-field"
              placeholder="0.00"
              style="color: var(--cyan-bright)"
              @input="normalizeIncubateInput"
            />
            <div class="asset-badge">vBARKX</div>
          </div>
          <div class="percent-btns">
            <button class="p-btn" type="button" @click="incubateInput = '1250.00'">
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

        <div class="input-group" style="margin-top: 8px">
          <div class="input-header">
            <span>{{ $t("pages.incubator.incubate.convertedAmount") }}</span>
          </div>
          <div class="input-row">
            <input :value="incubateOutputAmount" type="text" class="input-field" placeholder="0.00" readonly />
            <div class="asset-badge">BARKX</div>
          </div>
        </div>

        <button class="btn-submit" type="button" style="margin-top: 16px" @click="openIncubateModal">
          {{ $t("pages.incubator.incubate.action") }}
        </button>
      </div>

      <div class="card" style="margin-top: 24px; border-color: var(--border-glow)">
        <div class="card-title" style="color: var(--cyan-bright); border-bottom-color: var(--border-glow)">
          {{ $t("pages.incubator.status.title") }}
        </div>

        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.incubator.status.myDeposit") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--cyan-bright)">
              25,000.00 vBARKX
            </div>
          </div>
        </div>

        <div class="data-row">
          <span class="data-lbl">{{ $t("pages.incubator.status.average30Day") }}</span>
          <div style="text-align: right">
            <div class="data-val" style="color: var(--text-primary)">
              18,450.00 vBARKX
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px">
              {{ $t("pages.incubator.status.yesterdaySnapshot") }}
            </div>
          </div>
        </div>

        <div class="data-row" style="border-bottom: none">
          <span class="data-lbl">{{ $t("pages.incubator.status.currentQuotaShare") }}</span>
          <div style="text-align: right">
            <div class="data-val green">0.25%</div>
          </div>
        </div>
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
            {{ $t("pages.incubator.leaderboard.title") }}
          </span>
          <span class="chevron" :class="{ up: leaderboardOpen }">&#9660;</span>
        </div>
        <div class="collapsible-content" :class="{ show: leaderboardOpen }">
          <div class="sub-tab-container">
            <button
              class="sub-tab-btn"
              :class="{ active: leaderboardTab === 'quota' }"
              type="button"
              @click="leaderboardTab = 'quota'"
            >
              {{ $t("pages.incubator.leaderboard.topQuota") }}
            </button>
            <button
              class="sub-tab-btn"
              :class="{ active: leaderboardTab === 'incubation' }"
              type="button"
              @click="leaderboardTab = 'incubation'"
            >
              {{ $t("pages.incubator.leaderboard.topIncubation") }}
            </button>
          </div>

          <div class="sub-panel" :style="{ display: leaderboardTab === 'quota' ? 'block' : 'none' }">
            <div class="lb-list">
              <div v-for="item in quotaLeaderboard" :key="`quota-${item.rank}`" class="lb-item" :class="`top-${item.rank}`">
                <span class="lb-rank">{{ item.rank }}</span>
                <span class="lb-address">{{ item.address }}</span>
                <span class="lb-value">{{ item.value }}</span>
              </div>
            </div>
          </div>

          <div class="sub-panel" :style="{ display: leaderboardTab === 'incubation' ? 'block' : 'none' }">
            <div class="lb-list">
              <div v-for="item in incubationLeaderboard" :key="`incubation-${item.rank}`" class="lb-item" :class="`top-${item.rank}`">
                <span class="lb-rank">{{ item.rank }}</span>
                <span class="lb-address">{{ item.address }}</span>
                <span class="lb-value">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </MiningShell>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import MiningShell from "@/components/mining/MiningShell.vue";

const activeTab = ref("deposit");
const hasDaoMembership = ref(true);
const depositInput = ref("");
const withdrawInput = ref("");
const incubateInput = ref("");
const showIncubateModal = ref(false);
const leaderboardOpen = ref(false);
const leaderboardTab = ref("quota");

const quotaLeaderboard = [
  { rank: 1, address: "0x8a...4f2", value: "12.45%" },
  { rank: 2, address: "0x1b...e8c", value: "10.20%" },
  { rank: 3, address: "0x5c...11a", value: "8.95%" },
  { rank: 4, address: "0x3d...99b", value: "7.30%" },
  { rank: 5, address: "0x9f...22c", value: "6.15%" },
  { rank: 6, address: "0x2a...bb1", value: "5.40%" },
  { rank: 7, address: "0x4e...78d", value: "4.85%" },
  { rank: 8, address: "0x6b...44e", value: "4.20%" },
  { rank: 9, address: "0x1c...a3f", value: "3.90%" },
  { rank: 10, address: "0x7d...f2a", value: "3.50%" },
];

const incubationLeaderboard = [
  { rank: 1, address: "0x8a...4f2", value: "452,100.00 BARKX" },
  { rank: 2, address: "0x3d...99b", value: "385,450.00 BARKX" },
  { rank: 3, address: "0x1b...e8c", value: "340,200.00 BARKX" },
  { rank: 4, address: "0x9f...22c", value: "295,800.00 BARKX" },
  { rank: 5, address: "0x5c...11a", value: "275,000.00 BARKX" },
  { rank: 6, address: "0x2a...bb1", value: "240,500.00 BARKX" },
  { rank: 7, address: "0x4e...78d", value: "210,300.00 BARKX" },
  { rank: 8, address: "0x7d...f2a", value: "185,600.00 BARKX" },
  { rank: 9, address: "0x6b...44e", value: "165,900.00 BARKX" },
  { rank: 10, address: "0x1c...a3f", value: "150,200.00 BARKX" },
];

const incubateOutputAmount = computed(() => {
  const value = Number.parseFloat(incubateInput.value || "");
  if (!Number.isFinite(value) || value <= 0) {
    return "0.00";
  }

  return value.toFixed(2);
});

function normalizeIncubateInput() {
  if (!incubateInput.value.includes(".")) {
    return;
  }

  const [integer, decimal] = incubateInput.value.split(".");
  incubateInput.value = `${integer}.${(decimal || "").slice(0, 2)}`;
}

function openIncubateModal() {
  if (incubateOutputAmount.value === "0.00") {
    return;
  }

  document.body.style.overflow = "hidden";
  showIncubateModal.value = true;
}

function closeIncubateModal() {
  document.body.style.overflow = "";
  showIncubateModal.value = false;
}

onBeforeUnmount(() => {
  document.body.style.overflow = "";
});
</script>

<style lang="less">
.incubator-page-theme {
  --cyan: #0284c7;
  --cyan-glow: rgba(2, 132, 199, 0.4);
  --cyan-bright: #38bdf8;
  --bg-dark: #020617;
  --bg-card: rgba(15, 23, 42, 0.95);
  --bg-card-solid: #0f172a;
  --border-dark: rgba(2, 132, 199, 0.2);
  --border-glow: rgba(2, 132, 199, 0.4);
  background: var(--bg-dark);
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
}

.incubator-page-theme .info-box {
  background: rgba(2, 132, 199, 0.05) !important;
  border-left-color: var(--cyan) !important;
}

.incubator-page-theme .info-box.amber {
  border-left-color: var(--amber) !important;
  background: rgba(245, 158, 11, 0.05) !important;
}

.incubator-page-theme .p-btn {
  background: rgba(2, 132, 199, 0.1) !important;
  border-color: rgba(2, 132, 199, 0.3) !important;
  color: var(--cyan-bright) !important;
}

.incubator-page-theme .p-btn:hover {
  background: rgba(2, 132, 199, 0.2) !important;
}

.incubator-page-theme .nav-link:hover,
.incubator-page-theme .nav-link.active {
  background: rgba(2, 132, 199, 0.1) !important;
  color: var(--cyan-bright) !important;
}

.incubator-page-theme .btn-submit {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
  color: #fff !important;
  box-shadow: 0 0 20px rgba(2, 132, 199, 0.3) !important;
}

.incubator-page-theme .btn-submit.amber {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.3) !important;
}

.incubator-page-theme .brand-logo {
  box-shadow: 0 0 10px rgba(2, 132, 199, 0.15) !important;
}

.incubator-page-theme .brand-logo:hover {
  box-shadow: 0 0 15px rgba(2, 132, 199, 0.4) !important;
}

.incubator-page-theme .sim-toggle-mini {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid var(--green);
  color: var(--green);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.incubator-page-theme .sim-toggle-mini.danger-state {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--red);
  color: var(--red);
}

.incubator-page-theme .ext-link-inline {
  color: var(--cyan-bright);
  text-decoration: none;
  transition: color 0.3s;
}

.incubator-page-theme .ext-link-inline:hover {
  text-decoration: underline;
  color: #fff;
}

.incubator-page-theme .stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.incubator-page-theme .stat-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.incubator-page-theme .stat-card-title {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.incubator-page-theme .stat-card-value {
  font-family: "JetBrains Mono", monospace;
  font-size: 20px;
  font-weight: 600;
}

.incubator-page-theme .sub-tab-container {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}

.incubator-page-theme .sub-tab-btn {
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

.incubator-page-theme .sub-tab-btn.active {
  background: rgba(2, 132, 199, 0.15);
  color: var(--cyan-bright);
  box-shadow: 0 0 10px rgba(2, 132, 199, 0.2);
}

.incubator-page-theme .sub-panel {
  animation: incubator-fade-in 0.3s ease;
}

.incubator-page-theme .collapsible-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 16px;
  margin-top: 24px;
  margin-bottom: 24px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.incubator-page-theme .collapsible-card:hover {
  border-color: var(--border-glow);
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
  padding: 0 20px 20px;
  display: none;
}

.incubator-page-theme .collapsible-content.show {
  display: block;
  animation: incubator-fade-in 0.3s ease;
}

.incubator-page-theme .chevron {
  transition: transform 0.3s ease;
  display: inline-block;
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

.incubator-page-theme .lb-item.top-1 .lb-rank {
  color: #fbbf24;
}

.incubator-page-theme .lb-item.top-2 .lb-rank {
  color: #94a3b8;
}

.incubator-page-theme .lb-item.top-3 .lb-rank {
  color: #b45309;
}

.incubator-page-theme .custom-modal-overlay {
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

.incubator-page-theme .custom-modal {
  width: 88%;
  max-width: 360px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid var(--cyan);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}

.incubator-page-theme .custom-modal-close {
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
  background: transparent;
  border: none;
  padding: 0;
}

.incubator-page-theme .custom-modal-close:hover {
  color: var(--cyan-bright);
}

.incubator-page-theme .custom-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-right: 24px;
}

.incubator-page-theme .custom-modal-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

@keyframes incubator-fade-in {
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
