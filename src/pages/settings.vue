<template>
  <Transition name="settings-modal-fade">
    <div
      v-if="langModalOpen"
      id="lang-modal-overlay"
      class="custom-modal-overlay"
      @click="closeLangModal"
    >
      <div
        id="lang-modal-card"
        class="custom-modal cyan-theme show"
        @click.stop
      >
        <button
          class="custom-modal-close"
          type="button"
          :aria-label="$t('common.modals.close')"
          @click="closeLangModal"
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
        <div class="custom-modal-title">{{ $t("pages.settings.display.selectLanguage") }}</div>
        <div class="lang-list">
          <button
            v-for="item in languageOptions"
            :key="item.code"
            class="lang-item"
            :class="{ active: locale === item.code }"
            type="button"
            @click="selectLang(item.code)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <MiningShell>
    <div style="text-align: center; margin-bottom: 30px">
      <h1 style="font-size: 28px; color: var(--text-primary)">{{ $t("pages.settings.title") }}</h1>
      <p style="color: var(--text-muted); font-size: 14px">
        {{ $t("pages.settings.subtitle") }}
      </p>
    </div>

    <div class="card">
      <div class="card-title">{{ $t("pages.settings.wallet.title") }}</div>
      <div class="wallet-display">
        <div class="wallet-details">
          <div class="wallet-address-full">{{ walletAddressLabel }}</div>
          <div
            style="
              font-size: 12px;
              color: var(--text-muted);
              margin-top: 4px;
            "
          >
            {{ walletNetworkLabel }}
          </div>
        </div>
        <button
          class="copy-btn"
          :class="{ copied: isCopied('wallet') }"
          type="button"
          :disabled="!walletConnected"
          @click="copyWalletAddress"
          :title="$t('pages.settings.wallet.copy')"
        >
          <svg v-if="!isCopied('wallet')" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
      <div v-if="walletErrorText" class="wallet-hint">{{ walletErrorText }}</div>
      <div class="action-grid">
        <button
          class="action-btn"
          type="button"
          :disabled="walletInteractionLocked"
          @click="connectWallet"
        >
          {{ walletActionLabel }}
        </button>
        <button
          class="action-btn danger"
          type="button"
          :disabled="!walletConnected || walletInteractionLocked"
          @click="disconnectWallet"
        >
          {{ $t("pages.settings.wallet.disconnect") }}
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">{{ $t("pages.settings.contracts.title") }}</div>
      <div class="contract-list">
        <div
          v-for="item in contractRows"
          :key="item.key"
          class="wallet-display"
        >
          <div class="wallet-details">
            <div class="contract-name">{{ item.label }}</div>
            <div class="wallet-address-full">{{ item.address || "—" }}</div>
            <div class="detail-caption">{{ item.network }}</div>
          </div>
          <button
            class="copy-btn"
            :class="{ copied: isCopied(item.key) }"
            type="button"
            :disabled="!item.address"
            @click="copyText(item.address, item.key)"
            :title="$t('pages.settings.contracts.copy')"
          >
            <svg v-if="!isCopied(item.key)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">{{ $t("pages.settings.display.title") }}</div>
      <div class="setting-row">
        <span style="color: var(--text-secondary); font-size: 14px"
          >{{ $t("pages.settings.display.language") }}</span
        >
        <button
          id="current-lang-btn"
          class="toggle-btn active"
          type="button"
          @click="openLangModal"
        >
          {{ currentLanguageLabel }}
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">{{ $t("pages.settings.about.title") }}</div>
      <div class="setting-row">
        <span style="color: var(--text-secondary); font-size: 14px"
          >{{ $t("pages.settings.about.version") }}</span
        >
        <span
          style="
            font-family: 'JetBrains Mono', monospace;
            color: var(--text-primary);
          "
          >V{{ appVersion }}</span
        >
      </div>
      <div class="link-grid" style="margin-top: 16px">
        <a
          :href="tutorialLink"
          class="ext-link"
          target="_blank"
          rel="noopener noreferrer"
          @click.prevent="openExternalLink(tutorialLink)"
        >
          {{ $t("pages.settings.about.tutorial") }}
        </a>
        <a
          :href="docsLink"
          class="ext-link"
          target="_blank"
          rel="noopener noreferrer"
          @click.prevent="openExternalLink(docsLink)"
        >
          {{ $t("pages.settings.about.docs") }}
        </a>
        <a
          :href="discordLink"
          class="ext-link"
          target="_blank"
          rel="noopener noreferrer"
          @click.prevent="openExternalLink(discordLink)"
        >
          {{ $t("pages.settings.about.discord") }}
        </a>
      </div>
    </div>
  </MiningShell>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import { storeToRefs } from "pinia";
import MiningShell from "@/components/mining/MiningShell.vue";
import { useLocale } from "@/composables/useLocale";
import { IS_COCO } from "@/composables/useRelayService";
import { BARKX_CHAIN, BARKX_CONTRACTS } from "@/contracts/barkxPoolConfig";
import { useMainStore } from "@/store";
import { copyToClipboard } from "@/utils/format";
import { useWallet } from "@/composables/useWallet";

const {
  account,
  walletConnected,
  walletConnecting,
  walletChainName,
  walletIsTargetChain,
  walletActionPending,
  walletPendingText,
} = storeToRefs(useMainStore());
const { connectWallet, disconnectWallet, targetChain, walletInteractionLocked, walletErrorText } =
  useWallet();
const { locale, setLocale, t } = useLocale();
const langModalOpen = ref(false);

const languageOptions = [
  { code: "en", label: "English" },
  { code: "zh", label: "繁體中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
];

const currentLanguageLabel = computed(() =>
  languageOptions.find((item) => item.code === locale.value)?.label || "English",
);

const walletAddressLabel = computed(() =>
  walletConnected.value ? account.value : t("wallet.notConnected"),
);

const walletNetworkLabel = computed(() => {
  if (!walletConnected.value) {
    return t("wallet.target", { chain: targetChain.name });
  }

  if (!walletIsTargetChain.value) {
    return t("wallet.networkSwitchHint", {
      network: walletChainName.value || t("wallet.unknownNetwork"),
      chain: targetChain.name,
    });
  }

  return walletChainName.value || targetChain.name;
});

const walletActionLabel = computed(() => {
  if (walletConnecting.value) {
    return t("wallet.connecting");
  }

  if (walletActionPending.value) {
    return walletPendingText.value || t("wallet.pending");
  }

  if (!walletConnected.value) {
    return t("wallet.connect");
  }

  if (!walletIsTargetChain.value) {
    return t("wallet.switchTo", { chain: targetChain.name });
  }

  return t("wallet.reconnect");
});

const contractRows = computed(() => [
  {
    key: "barkx",
    label: "BARKX",
    address: BARKX_CONTRACTS.barkX,
    network: BARKX_CHAIN.name,
  },
  {
    key: "usdt",
    label: "USDT",
    address: BARKX_CONTRACTS.usdt,
    network: BARKX_CHAIN.name,
  },
  {
    key: "vbarkx",
    label: "vBARKX",
    address: BARKX_CONTRACTS.vBARKX,
    network: BARKX_CHAIN.name,
  },
]);

const copiedTarget = ref("");
let copyTimer = null;
const TUTORIAL_LINKS = {
  en: "https://guide.barkx.xyz/",
  zh: "https://guide.barkx.xyz/guidebook-zh-hk.html",
  ja: "https://guide.barkx.xyz/guidebook-ja.html",
  ko: "https://guide.barkx.xyz/guidebook-ko.html",
  vi: "https://guide.barkx.xyz/guidebook-vi.html",
  es: "https://guide.barkx.xyz/guidebook-es.html",
  pt: "https://guide.barkx.xyz/guidebook-pt.html",
  fr: "https://guide.barkx.xyz/guidebook-fr.html",
  de: "https://guide.barkx.xyz/guidebook-de.html",
  ru: "https://guide.barkx.xyz/guidebook-ru.html",
  ar: "https://guide.barkx.xyz/guidebook-ar.html",
};
const DOCS_LINKS = {
  en: "https://relayx-club.gitbook.io/barkx-node-mining-pool",
  zh: "https://relayx-club.gitbook.io/barkx-node-mining-pool/main-chn",
};
const DISCORD_LINKS = {
  en: "https://discord.gg/barkai",
  zh: "https://discord.gg/barkcn",
};

const tutorialLink = computed(() => TUTORIAL_LINKS[locale.value] || TUTORIAL_LINKS.en);
const docsLink = computed(() => (locale.value === "zh" ? DOCS_LINKS.zh : DOCS_LINKS.en));
const discordLink = computed(() => (locale.value === "zh" ? DISCORD_LINKS.zh : DISCORD_LINKS.en));
const appVersion = import.meta.env.VITE_APP_VERSION || "1.1";

function openLangModal() {
  document.body.style.overflow = "hidden";
  langModalOpen.value = true;
}

function closeLangModal() {
  document.body.style.overflow = "";
  langModalOpen.value = false;
}

function selectLang(nextLocale) {
  setLocale(nextLocale);
  closeLangModal();
}

function isCopied(target) {
  return copiedTarget.value === target;
}

function setCopiedState(target) {
  copiedTarget.value = target;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    if (copiedTarget.value === target) {
      copiedTarget.value = "";
    }
  }, 2000);
}

async function copyText(text, target) {
  if (!text) return;
  const ok = await copyToClipboard(text);
  if (ok) {
    setCopiedState(target);
  }
}

async function copyWalletAddress() {
  if (!walletConnected.value || !account.value) return;
  await copyText(account.value, "wallet");
}

async function openExternalLink(url) {
  if (IS_COCO) {
    const client = window.relayx;

    try {
      const res = await client?.openURL?.({ url });
      if (res?.code === 200) {
        return;
      }
      console.warn("[Settings] relayx openURL did not succeed, fallback to window.open:", { url, res });
    } catch (error) {
      console.warn("[Settings] relayx openURL failed, fallback to window.open:", { url, error });
    }
  }

  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (openedWindow) {
    openedWindow.opener = null;
  }
}

onBeforeUnmount(() => {
  document.body.style.overflow = "";
  clearTimeout(copyTimer);
});
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
}

.custom-modal {
  width: 88%;
  max-width: 360px;
  background: rgba(18, 21, 30, 0.95);
  border: 1px solid var(--cyan);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transform: translateY(20px);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}

.custom-modal.cyan-theme {
  border-color: var(--cyan);
}

.custom-modal.show {
  transform: translateY(0);
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
}

.custom-modal-close:hover {
  color: var(--cyan);
}

.custom-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-right: 24px;
}

.lang-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.lang-list::-webkit-scrollbar {
  width: 4px;
}

.lang-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.lang-item {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 14px;
  transition: 0.3s;
  text-align: center;
}

.lang-item:hover,
.lang-item.active {
  border-color: var(--cyan);
  background: rgba(56, 189, 248, 0.1);
  color: var(--cyan);
}

.settings-modal-fade-enter-active,
.settings-modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.settings-modal-fade-enter-from,
.settings-modal-fade-leave-to {
  opacity: 0;
}

.settings-modal-fade-enter-from .custom-modal,
.settings-modal-fade-leave-to .custom-modal {
  transform: translateY(20px);
}

.wallet-display {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 14px;
  margin-bottom: 16px;
}

.wallet-details {
  flex: 1;
  min-width: 0;
}

.wallet-address-full {
  font-family: "JetBrains Mono", monospace;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.5;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.contract-list .wallet-display:last-child {
  margin-bottom: 0;
}

.contract-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.detail-caption {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.copy-btn {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--cyan);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.copy-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.25);
}
.copy-btn.copied {
  background: rgba(34, 197, 94, 0.2);
  border-color: var(--green);
  color: var(--green);
}

.copy-btn:disabled {
  opacity: 0.6;
}

.wallet-hint {
  margin-bottom: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.08);
  color: #f7d08a;
  font-size: 13px;
  line-height: 1.5;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  padding: 14px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 14px;
  transition: 0.3s;
}

.action-btn:hover:not(:disabled) {
  border-color: var(--cyan);
  background: rgba(56, 189, 248, 0.1);
}

.action-btn.danger {
  color: var(--red);
}

.action-btn.danger:hover:not(:disabled) {
  border-color: var(--red);
  background: rgba(239, 68, 68, 0.1);
}

.action-btn:disabled {
  opacity: 0.6;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.setting-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: 0.3s;
}

.toggle-btn.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: var(--cyan);
  color: var(--cyan);
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.ext-link {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  min-width: 0;
  transition: 0.3s;
}

.ext-link:hover {
  color: var(--cyan);
  border-color: var(--border-glow);
  background: rgba(56, 189, 248, 0.1);
}

@media (max-width: 640px) {
  .wallet-display {
    align-items: flex-start;
    flex-direction: column;
  }

  .copy-btn {
    align-self: flex-start;
  }
}
</style>
