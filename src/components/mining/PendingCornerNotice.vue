<template>
  <Transition name="pending-corner">
    <div
      v-if="show"
      class="pending-corner-notice"
      :style="{ bottom: (24 + appBottom) + 'px' }"
      role="status"
      aria-live="polite"
    >
      <div class="pending-corner-notice__icon" aria-hidden="true">
        <span class="pending-corner-notice__spinner"></span>
      </div>
      <span class="pending-corner-notice__text">{{ displayText }}</span>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useMainStore } from "@/store";

const { t } = useI18n({ useScope: "global" });
const { appBottom } = storeToRefs(useMainStore());

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  text: {
    type: String,
    default: "",
  },
});

const displayText = computed(() => props.text || t("components.pendingNotice.default"));
</script>

<style scoped>
.pending-corner-notice {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 1200;
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #0f1218;
  border: 1px solid #25435a;
  border-radius: 16px;
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.02);
  pointer-events: none;
}

.pending-corner-notice__icon {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pending-corner-notice__spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(56, 189, 248, 0.22);
  border-top-color: var(--cyan);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.18);
  animation: pending-spin 0.9s linear infinite;
}

.pending-corner-notice__text {
  color: #e8edf3;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.pending-corner-enter-active,
.pending-corner-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.pending-corner-enter-from,
.pending-corner-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

@keyframes pending-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .pending-corner-notice {
    bottom: 18px;
    min-height: 48px;
    padding: 10px 14px;
    border-radius: 14px;
  }
}
</style>
