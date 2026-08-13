<template>
  <div class="notice-test-page">
    <PendingCornerNotice :show="walletActionPending" :text="walletPendingText" />
    <BarkxPoolNotice v-if="activeNoticeMessage" :message="activeNoticeMessage" />

    <div class="notice-test-page__container">
      <header class="notice-test-page__header">
        <p class="notice-test-page__eyebrow">{{ $t("pages.noticeTest.eyebrow") }}</p>
        <h1 class="notice-test-page__title">{{ $t("pages.noticeTest.title") }}</h1>
        <p class="notice-test-page__subtitle">
          {{ $t("pages.noticeTest.subtitle") }}
        </p>
        <p class="notice-test-page__path">{{ $t("pages.noticeTest.path") }}</p>
      </header>

      <section class="notice-test-panel">
        <div class="notice-test-panel__meta">
          <div class="notice-test-panel__row">
            <span>{{ $t("pages.noticeTest.floatingPreview") }}</span>
            <span>{{ activeNoticeLabel }}</span>
          </div>
        </div>
        <div class="notice-test-actions">
          <button class="notice-test-button" type="button" @click="showBarkxExample">
            {{ $t("pages.noticeTest.showBarkxExample") }}
          </button>
          <button
            class="notice-test-button is-secondary"
            type="button"
            @click="showUniswapExample"
          >
            {{ $t("pages.noticeTest.showUniswapExample") }}
          </button>
          <button
            class="notice-test-button is-ghost"
            type="button"
            @click="clearActiveNotice"
          >
            {{ $t("pages.noticeTest.hideNotice") }}
          </button>
        </div>
      </section>

      <section class="notice-test-panel">
        <div class="notice-test-panel__meta">
          <div class="notice-test-panel__row">
            <span>{{ $t("pages.noticeTest.pendingNotice") }}</span>
            <span>{{ $t("pages.noticeTest.pendingHint") }}</span>
          </div>
        </div>

        <div class="notice-test-actions">
          <button class="notice-test-button" type="button" @click="showPending">
            {{ $t("pages.noticeTest.showPending") }}
          </button>
          <button
            class="notice-test-button is-secondary"
            type="button"
            @click="hidePending"
          >
            {{ $t("pages.noticeTest.hidePending") }}
          </button>
        </div>
      </section>

      <section
        v-for="group in BARKX_POOL_MESSAGE_GROUPS"
        :key="group.id"
        class="notice-group"
      >
        <div class="notice-group__header">
          <h2 class="notice-group__title">{{ $t(group.labelKey) }}</h2>
          <span class="notice-group__count">{{ $t("pages.noticeTest.itemsCount", { count: group.messages.length }) }}</span>
        </div>

        <div class="notice-group__list">
          <div
            v-for="message in group.messages"
            :key="message.key"
            class="notice-group__item"
          >
            <div class="notice-group__item-meta">
              <code>{{ message.key }}</code>
              <span :class="['notice-group__badge', `is-${message.outcome}`]">
                {{
                  message.outcome === "success"
                    ? $t("pages.noticeTest.outcomeSuccess")
                    : $t("pages.noticeTest.outcomeFailure")
                }}
              </span>
            </div>

            <p class="notice-group__message">
              {{ resolveBarkxPreviewMessage(message.key)?.text }}
            </p>

            <button
              class="notice-group__preview-button"
              type="button"
              @click="previewBarkxNotice(message.key)"
            >
              {{ $t("pages.noticeTest.preview") }}
            </button>
          </div>
        </div>
      </section>

      <section
        v-for="group in UNISWAP_MESSAGE_GROUPS"
        :key="group.id"
        class="notice-group"
      >
        <div class="notice-group__header">
          <h2 class="notice-group__title">{{ $t(group.labelKey) }}</h2>
          <span class="notice-group__count">{{ $t("pages.noticeTest.itemsCount", { count: group.messages.length }) }}</span>
        </div>

        <div class="notice-group__list">
          <div
            v-for="message in group.messages"
            :key="message.key"
            class="notice-group__item"
          >
            <div class="notice-group__item-meta">
              <code>{{ message.key }}</code>
              <span :class="['notice-group__badge', `is-${message.outcome}`]">
                {{
                  message.outcome === "success"
                    ? $t("pages.noticeTest.outcomeSuccess")
                    : $t("pages.noticeTest.outcomeFailure")
                }}
              </span>
            </div>

            <p class="notice-group__message">
              {{ resolveUniswapPreviewMessage(message.key)?.text }}
            </p>

            <button
              class="notice-group__preview-button"
              type="button"
              @click="previewUniswapNotice(message.key)"
            >
              {{ $t("pages.noticeTest.preview") }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import BarkxPoolNotice from "@/components/mining/BarkxPoolNotice.vue";
import PendingCornerNotice from "@/components/mining/PendingCornerNotice.vue";
import {
  BARKX_POOL_MESSAGE_GROUPS,
  resolveBarkxPoolMessage,
} from "@/components/mining/barkxPoolMessages";
import {
  UNISWAP_MESSAGE_GROUPS,
  resolveUniswapMessage,
} from "@/components/mining/uniswapMessages";
import { useMainStore } from "@/store";

const store = useMainStore();
const { t } = useI18n({ useScope: "global" });
const { walletActionPending, walletPendingText } = storeToRefs(store);
const activeNoticeSource = ref("barkx");
const activeNoticeKey = ref("deposit_lp_only_failure_requires_vn");

const previewParamMap = {
  deposit_vn_lp_success: { lpAmount: "128.450000" },
  deposit_wvn_only_failure_requires_lp: { lpAmount: "25.000000" },
  deposit_lp_only_failure_requires_vn: { vnAmount: "1" },
  withdraw_lp_failure_requires_lp: { lpAmount: "10.000000" },
  direct_claim_success: { barkxAmount: "847.320000" },
  compound_success: {
    barkxAmount: "762.590000",
    lpAmount: "105.420000",
  },
};

function previewParams(messageKey) {
  return previewParamMap[messageKey] || {};
}

function resolveBarkxPreviewMessage(messageKey) {
  return resolveBarkxPoolMessage(messageKey, previewParams(messageKey));
}

function resolveUniswapPreviewMessage(messageKey) {
  const previewMap = {
    uniswap_add_liquidity_success: { lpAmount: "156.230000" },
    uniswap_remove_liquidity_success: { lpAmount: "42.000000" },
  };

  return resolveUniswapMessage(messageKey, previewMap[messageKey] || {});
}

const activeNoticeMessage = computed(() => {
  if (!activeNoticeKey.value) {
    return null;
  }

  return activeNoticeSource.value === "uniswap"
    ? resolveUniswapPreviewMessage(activeNoticeKey.value)
    : resolveBarkxPreviewMessage(activeNoticeKey.value);
});

const activeNoticeLabel = computed(() => {
  if (!activeNoticeMessage.value) {
    return t("pages.noticeTest.noActiveNotice");
  }

  return `${activeNoticeSource.value === "uniswap" ? t("pages.noticeTest.sourceUniswap") : t("pages.noticeTest.sourceBarkx")} · ${activeNoticeKey.value}`;
});

function showPending() {
  activeNoticeKey.value = "";
  store.setWalletPendingState({
    pending: true,
    text: t("wallet.pending"),
  });
}

function hidePending() {
  store.clearWalletPendingState();
}

function clearActiveNotice() {
  activeNoticeKey.value = "";
}

function previewBarkxNotice(messageKey) {
  hidePending();
  activeNoticeSource.value = "barkx";
  activeNoticeKey.value = messageKey;
}

function previewUniswapNotice(messageKey) {
  hidePending();
  activeNoticeSource.value = "uniswap";
  activeNoticeKey.value = messageKey;
}

function showBarkxExample() {
  previewBarkxNotice("deposit_lp_only_failure_requires_vn");
}

function showUniswapExample() {
  previewUniswapNotice("uniswap_add_liquidity_success");
}
</script>

<style scoped>
.notice-test-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(255, 99, 132, 0.06), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #fafafb 100%);
  padding: 40px 20px 140px;
}

.notice-test-page__container {
  width: min(960px, 100%);
  margin: 0 auto;
}

.notice-test-page__header {
  margin-bottom: 32px;
}

.notice-test-page__eyebrow {
  margin: 0 0 10px;
  color: #7c7d83;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.notice-test-page__title {
  margin: 0;
  color: #15161a;
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.notice-test-page__subtitle {
  margin: 12px 0 0;
  color: #686a71;
  font-size: 16px;
  line-height: 1.6;
}

.notice-test-page__path {
  margin: 14px 0 0;
  color: #888b93;
  font-size: 14px;
}

.notice-test-panel {
  padding: 20px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #f0f0f2;
  border-radius: 28px;
  box-shadow: 0 18px 40px rgba(17, 24, 39, 0.05);
  margin-bottom: 28px;
}

.notice-test-panel__meta {
  margin-bottom: 18px;
}

.notice-test-panel__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  color: #7a7c83;
  font-size: 14px;
  line-height: 1.5;
}

.notice-test-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.notice-test-button {
  padding: 12px 18px;
  border: 1px solid #25435a;
  border-radius: 14px;
  background: #0f1218;
  color: #e8edf3;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s,
    transform 0.2s,
    box-shadow 0.2s;
}

.notice-test-button:hover {
  border-color: var(--cyan);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.16);
}

.notice-test-button.is-secondary {
  background: #171b23;
}

.notice-test-button.is-ghost {
  background: rgba(255, 255, 255, 0.72);
  color: #1b1f27;
  border-color: #d8dbe1;
}

.notice-group {
  padding: 24px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid #f0f0f2;
  border-radius: 24px;
  box-shadow: 0 18px 36px rgba(17, 24, 39, 0.04);
}

.notice-group + .notice-group {
  margin-top: 20px;
}

.notice-group__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.notice-group__title {
  margin: 0;
  color: #1f2024;
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.notice-group__count {
  color: #8b8d94;
  font-size: 13px;
}

.notice-group__list {
  display: grid;
  gap: 16px;
}

.notice-group__item {
  padding: 16px;
  background: #fcfcfd;
  border: 1px solid #f1f1f3;
  border-radius: 20px;
}

.notice-group__item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.notice-group__item-meta code {
  color: #5f626a;
  font-size: 13px;
  word-break: break-all;
}

.notice-group__message {
  margin: 0 0 14px;
  color: #5f626a;
  font-size: 14px;
  line-height: 1.6;
}

.notice-group__badge {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.notice-group__badge.is-success {
  background: #edf7ef;
  color: #43815a;
}

.notice-group__badge.is-failure {
  background: #f5f0f0;
  color: #7a5d5d;
}

.notice-group__preview-button {
  padding: 10px 14px;
  border: 1px solid #dce0e7;
  border-radius: 12px;
  background: #ffffff;
  color: #1d2128;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s,
    transform 0.2s,
    box-shadow 0.2s;
}

.notice-group__preview-button:hover {
  border-color: var(--cyan);
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.1);
}

@media (max-width: 640px) {
  .notice-test-page {
    padding: 28px 14px 132px;
  }

  .notice-test-panel,
  .notice-group {
    padding: 16px;
    border-radius: 20px;
  }

  .notice-test-panel__row,
  .notice-group__header,
  .notice-group__item-meta {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
