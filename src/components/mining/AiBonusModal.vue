<template>
  <Transition name="ai-bonus-fade">
    <!--
      No ✕ and no outside-click dismissal by design: the only way out is the
      "give up" button, which stays frozen for 3s after the modal opens.
    -->
    <div v-if="open" class="ai-bonus-overlay">
      <div class="ai-bonus-modal" @click.stop>
        <div class="ai-bonus-title">{{ $t("components.aiBonus.title") }}</div>

        <ul class="ai-bonus-list">
          <li v-for="key in LINE_KEYS" :key="key">{{ $t(`components.aiBonus.${key}`) }}</li>
        </ul>

        <div class="ai-bonus-actions">
          <button class="ai-bonus-btn is-chat" type="button" @click="openLink(CHAT_URL)">
            {{ $t("components.aiBonus.chat") }}
          </button>

          <button class="ai-bonus-btn is-discord" type="button" @click="openLink(discordUrl)">
            {{ $t("components.aiBonus.discord") }}
          </button>

          <button
            class="ai-bonus-btn is-abandon"
            type="button"
            :disabled="countdown > 0"
            @click="emit('close')"
          >
            {{
              countdown > 0
                ? $t("components.aiBonus.abandonWait", { seconds: countdown })
                : $t("components.aiBonus.abandon")
            }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(["close"]);

const { locale } = useI18n();

const LINE_KEYS = ["line1", "line2", "line3", "line4", "line5"];
const CHAT_URL = "https://chat.barkx.xyz/";
// Same split as the Settings page: the zh pack is Traditional Chinese.
const DISCORD_URLS = { zh: "https://discord.gg/barkcn", en: "https://discord.gg/barkai" };

const discordUrl = computed(() =>
  locale.value === "zh" ? DISCORD_URLS.zh : DISCORD_URLS.en,
);

const ABANDON_DELAY_SECONDS = 3;
const countdown = ref(ABANDON_DELAY_SECONDS);
let timer = null;

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

watch(
  () => props.open,
  (isOpen) => {
    stopTimer();
    if (!isOpen) return;
    countdown.value = ABANDON_DELAY_SECONDS;
    timer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) stopTimer();
    }, 1000);
  },
  { immediate: true },
);

onBeforeUnmount(stopTimer);

function openLink(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}
</script>

<style scoped>
/*
  Deliberately NOT reusing the shared .custom-modal* class names: e-pool.vue's
  style block is unscoped, and its `.elite-pool-theme .custom-modal` rule ties
  this component's scoped selectors on specificity and wins on source order,
  which pinned the Elite copy to max-width 360px while the other two pools got
  460px. Own class names keep all three the same width on the same device.
*/
.ai-bonus-overlay {
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

.ai-bonus-modal {
  width: 100%;
  max-width: 460px;
  max-height: 88vh;
  overflow-y: auto;
  background: rgba(18, 21, 30, 0.97);
  /* --cyan is the per-pool accent: sky blue on Main, teal on Elite, gold on VIP. */
  border: 1px solid var(--cyan);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}

.ai-bonus-modal::-webkit-scrollbar {
  width: 4px;
}

.ai-bonus-modal::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.ai-bonus-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.ai-bonus-list {
  margin: 16px 0 20px;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.ai-bonus-list li::marker {
  color: var(--cyan);
}

.ai-bonus-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-bonus-btn {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s, filter 0.3s;
}

.ai-bonus-btn:hover:not(:disabled) {
  filter: brightness(1.12);
}

.ai-bonus-btn.is-chat {
  background: var(--cyan);
  color: #06080d;
}

/*
  Hard-coded purple: --purple is re-pointed per pool (sky blue on Elite, amber
  on VIP), so the token would not render as purple where it matters.
*/
.ai-bonus-btn.is-discord {
  background: #a855f7;
  color: #ffffff;
}

.ai-bonus-btn.is-abandon {
  background: var(--red, #ef4444);
  color: #ffffff;
}

.ai-bonus-btn.is-abandon:disabled {
  background: rgba(148, 163, 184, 0.18);
  color: var(--text-muted);
  cursor: not-allowed;
}

.ai-bonus-fade-enter-active,
.ai-bonus-fade-leave-active {
  transition: opacity 0.3s ease;
}

.ai-bonus-fade-enter-from,
.ai-bonus-fade-leave-to {
  opacity: 0;
}
</style>
