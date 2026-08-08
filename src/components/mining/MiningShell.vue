<template>
  <div>
    <div class="grid-bg"></div>
    <div class="glow-bg"></div>

    <header class="header" :style="{ paddingTop: (16 + appTop) + 'px' }">
      <div style="display: flex; align-items: center; gap: 12px">
        <button class="menu-btn" type="button" @click="toggleNav">
          <span></span><span></span><span></span>
        </button>
        <div class="brand-logo" :title="$t('app.brand')"></div>
      </div>
      <button
        class="wallet-info wallet-trigger"
        type="button"
        :disabled="walletInteractionLocked"
        :class="{
          'is-disconnected': !walletConnected,
          'is-mismatch': walletConnected && !walletIsTargetChain,
          'is-disabled': walletInteractionLocked,
        }"
        @click="connectWallet"
      >
        <span
          v-if="walletConnected"
          class="wallet-dot"
          :class="{ 'is-warning': !walletIsTargetChain }"
        ></span>
        <span>{{ walletDisplayText }}</span>
      </button>
    </header>

    <div
      class="nav-overlay"
      :class="{ active: isNavOpen }"
      @click="closeNav"
    ></div>

    <nav
      class="side-nav"
      :class="{
        active: isNavOpen,
        'show-level-2': navLevel === 'featured',
        'show-level-partnership': navLevel === 'partnership',
      }"
      :style="{ paddingTop: (40 + appTop) + 'px' }"
    >
      <div class="nav-levels-wrapper">
        <div id="nav-level-1" class="nav-level">
          <template v-for="item in navItems" :key="item.key">
            <button
              v-if="item.type === 'parent'"
              class="nav-link nav-link-parent"
              :class="{
                active: isParentActive(item),
                'nav-link--disabled': isNavItemDisabled(item),
              }"
              type="button"
              :disabled="isNavItemDisabled(item)"
              @click="showNavLevel(item.navLevel)"
            >
              <span>{{ item.label }}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button
              v-else-if="isNavItemDisabled(item)"
              class="nav-link nav-link--disabled"
              type="button"
              disabled
            >
              {{ item.label }}
            </button>
            <RouterLink
              v-else-if="item.type === 'route'"
              :to="item.to"
              class="nav-link"
              :class="{ active: route.path === item.to }"
              @click="closeNav"
            >
              {{ item.label }}
            </RouterLink>
            <a
              v-else
              :href="item.href"
              :target="item.target"
              class="nav-link"
            >
              {{ item.label }}
            </a>
          </template>
        </div>

        <div id="nav-level-2" class="nav-level">
          <button
            class="nav-back-btn"
            type="button"
            @click="showNavLevel1"
          >
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
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span class="nav-back-label">{{ t("nav.featuredPools") }}</span>
          </button>

          <template v-for="item in featuredPoolItems" :key="item.key">
            <button
              v-if="isNavItemDisabled(item)"
              class="nav-link nav-link--disabled"
              type="button"
              disabled
            >
              {{ item.label }}
            </button>
            <RouterLink
              v-else
              :to="item.to"
              class="nav-link"
              :class="{ active: route.path === item.to }"
              @click="closeNav"
            >
              {{ item.label }}
            </RouterLink>
          </template>
        </div>

        <div id="nav-level-partnership" class="nav-level">
          <button
            class="nav-back-btn"
            type="button"
            @click="showNavLevel1"
          >
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
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span class="nav-back-label">{{ t("nav.partnership") }}</span>
          </button>
          <a
            :href="partnershipLink"
            target="_blank"
            class="nav-link"
          >
            {{ t("nav.openDao") }}
          </a>
        </div>
      </div>
    </nav>

    <main class="main" :style="{ paddingTop: (90 + appTop) + 'px', paddingBottom: (40 + appBottom) + 'px' }">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useMainStore } from "@/store";
import { useWallet } from "@/composables/useWallet";
import { useSubPoolData } from "@/composables/useSubPoolData";

const { t } = useI18n({ useScope: "global" });
const route = useRoute();
const { walletConnected, walletIsTargetChain, appTop, appBottom } = storeToRefs(useMainStore());
const isNavOpen = ref(false);
const navLevel = ref("root");
const { connectWallet, walletDisplayText, walletInteractionLocked } = useWallet();
const subPoolData = useSubPoolData();
const partnershipLink = import.meta.env.VITE_OPENDAO_URL || "https://opendao.cc";

const navItems = computed(() => {
  return [
    {
      key: "bark-ai",
      type: "external",
      href: "https://chat.barkx.xyz",
      target: "_blank",
      label: "BarkAI",
    },
    { key: "dashboard", type: "route", to: "/dashboard", label: t("nav.dashboard") },
    { key: "swap", type: "route", to: "/swap", label: t("nav.swap") },
    { key: "liquidity", type: "route", to: "/liquidity", label: t("nav.liquidity") },
    { key: "pool", type: "route", to: "/pool", label: t("nav.pool") },
    { key: "featured", type: "parent", navLevel: "featured", label: t("nav.featuredPools") },
    { key: "node-boost", type: "route", to: "/node-boost", label: t("nav.nodeBoost") },
    { key: "vn", type: "route", to: "/vn", label: t("nav.vn") },
    { key: "partnership", type: "parent", navLevel: "partnership", label: t("nav.partnership"), alwaysEnabled: true },
    { key: "settings", type: "route", to: "/settings", label: t("nav.settings") },
  ];
});

const featuredPoolItems = computed(() => [
  { key: "e-pool", type: "route", to: "/e-pool", label: t("nav.ePool") },
  { key: "v-pool", type: "route", to: "/v-pool", label: t("nav.vPool"), gated: "whitelist" },
  { key: "incubator", type: "route", to: "/incubator", label: t("nav.incubator") },
  { key: "orderbook", type: "route", to: "/orderbook", label: t("nav.orderbook") },
]);

// Fetch SubPool whitelist status when wallet connects
watch(
  () => [walletConnected.value, walletIsTargetChain.value],
  ([connected, isTargetChain]) => {
    if (connected && isTargetChain) {
      const store = useMainStore();
      if (store.account) {
        subPoolData.fetchAll(store.account).catch(() => {});
      }
    }
  },
  { immediate: true },
);

watch(
  () => route.path,
  () => {
    isNavOpen.value = false;
    navLevel.value = "root";
  },
);

function toggleNav() {
  isNavOpen.value = !isNavOpen.value;
  if (!isNavOpen.value) {
    navLevel.value = "root";
  }
}

function closeNav() {
  isNavOpen.value = false;
  navLevel.value = "root";
}

function showNavLevel(level) {
  navLevel.value = level;
}

function showNavLevel1() {
  navLevel.value = "root";
}

function isNavItemDisabled(item) {
  if (item.alwaysEnabled) {
    return false;
  }

  const walletReady = walletConnected.value && walletIsTargetChain.value;

  if (item.type === "parent") {
    return item.navLevel === "featured" ? !walletReady : false;
  }

  if (!walletReady) {
    return item.to !== "/dashboard" && item.to !== "/settings";
  }

  if (item.gated === "whitelist") {
    return !subPoolData.isWhitelisted.value;
  }

  return false;
}

function isParentActive(item) {
  if (item.key !== "featured") {
    return false;
  }

  return featuredPoolItems.value.some(featuredItem => featuredItem.to === route.path);
}
</script>

<style scoped>
.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-image: url("/my-icon.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.15);
  transition: box-shadow 0.3s ease;
}
.brand-logo:hover {
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
}

.wallet-trigger {
  cursor: pointer;
  color: var(--text-primary);
  transition:
    border-color 0.3s,
    box-shadow 0.3s,
    background-color 0.3s;
}

.wallet-trigger.is-disconnected {
  color: var(--cyan);
}

.wallet-trigger.is-disconnected:hover:not(:disabled),
.wallet-trigger.is-mismatch:hover:not(:disabled) {
  border-color: var(--cyan);
  box-shadow: 0 0 20px var(--cyan-glow);
}

.wallet-trigger.is-mismatch {
  color: var(--text-primary);
  border-color: rgba(168, 85, 247, 0.28);
  background: rgba(168, 85, 247, 0.08);
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.12);
}

.wallet-trigger.is-mismatch:hover:not(:disabled) {
  border-color: rgba(168, 85, 247, 0.45);
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.22);
}

.wallet-trigger.is-disabled {
  opacity: 0.6;
}

.wallet-dot.is-warning {
  background: #c084fc;
  box-shadow: 0 0 10px rgba(192, 132, 252, 0.45);
}

.nav-link {
  display: block;
  width: 100%;
  padding: 16px;
  background: transparent;
  color: var(--text-secondary);
  text-decoration: none;
  text-align: left;
  font-size: 18px;
  border-radius: 12px;
  margin-bottom: 8px;
  border: 1px solid transparent;
  font: inherit;
  appearance: none;
  -webkit-appearance: none;
  transition:
    background-color 0.3s,
    color 0.3s,
    border-color 0.3s;
}

.nav-link:hover,
.nav-link.active {
  background: rgba(56, 189, 248, 0.1);
  color: var(--cyan);
  border-color: var(--border-dark);
}

.nav-link.nav-link--disabled,
.nav-link.nav-link--disabled:disabled {
  background: transparent;
  border-color: transparent;
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-link.nav-link--disabled:hover {
  background: transparent;
  color: var(--text-muted);
  border-color: transparent;
}

.nav-levels-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.nav-level {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

#nav-level-1 {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

#nav-level-2 {
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
}

#nav-level-partnership {
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
}

.side-nav.show-level-2 #nav-level-1 {
  transform: translateX(-20%);
  opacity: 0;
  pointer-events: none;
}

.side-nav.show-level-2 #nav-level-2 {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

.side-nav.show-level-partnership #nav-level-1 {
  transform: translateX(-20%);
  opacity: 0;
  pointer-events: none;
}

.side-nav.show-level-partnership #nav-level-partnership {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

.nav-link-parent {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.nav-link-parent svg {
  flex-shrink: 0;
}

.nav-back-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  padding: 12px 16px;
  margin-bottom: 8px;
  border: none;
  background: transparent;
  border-radius: 12px;
  font-size: 16px;
  transition:
    background-color 0.3s,
    color 0.3s;
  cursor: pointer;
}

.nav-back-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.nav-back-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}
</style>
