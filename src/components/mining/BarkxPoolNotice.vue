<template>
  <div
    v-if="resolvedMessage"
    class="barkx-pool-notice"
    :class="[`is-${resolvedMessage.outcome}`, { 'is-floating': floating }]"
    :style="floating ? { bottom: (24 + appBottom) + 'px' } : {}"
    role="status"
    aria-live="polite"
  >
    <div class="barkx-pool-notice__icon" aria-hidden="true">
      <svg
        v-if="resolvedMessage.outcome === 'success'"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.5 10.8 14.8 15.8 9.8" />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 3.5c.44 0 .85.23 1.07.62l8.13 14.06c.22.38.22.85 0 1.24-.22.38-.63.62-1.07.62H3.87c-.44 0-.85-.24-1.07-.62a1.24 1.24 0 0 1 0-1.24L10.93 4.12c.22-.39.63-.62 1.07-.62Zm0 5.1a1 1 0 0 0-.99 1l.12 4.67a.87.87 0 0 0 1.74 0L13 9.6a1 1 0 0 0-1-1Zm0 8.9a1.19 1.19 0 1 0 0-2.38 1.19 1.19 0 0 0 0 2.38Z"
        />
      </svg>
    </div>

    <div class="barkx-pool-notice__content">
      <p class="barkx-pool-notice__text">{{ resolvedMessage.text }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useMainStore } from "@/store";
import {
  BARKX_POOL_MESSAGES,
  resolveBarkxPoolMessage,
} from "@/components/mining/barkxPoolMessages";

const { appBottom } = storeToRefs(useMainStore());

const props = defineProps({
  messageKey: {
    type: String,
    default: "",
    validator: (value) => !value || value in BARKX_POOL_MESSAGES,
  },
  params: {
    type: Object,
    default: () => ({}),
  },
  floating: {
    type: Boolean,
    default: true,
  },
  message: {
    type: Object,
    default: null,
  },
});

const resolvedMessage = computed(() => {
  if (props.message) {
    return props.message;
  }

  if (!props.messageKey) {
    return null;
  }

  return resolveBarkxPoolMessage(props.messageKey, props.params);
});
</script>

<style scoped>
.barkx-pool-notice {
  width: 100%;
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: #0f1218;
  border: 1px solid #25435a;
  border-radius: 18px;
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

.barkx-pool-notice.is-floating {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 1150;
  width: min(760px, calc(100vw - 28px));
  transform: translateX(-50%);
  pointer-events: auto;
}

.barkx-pool-notice__icon {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7e96a8;
}

.barkx-pool-notice__icon svg {
  width: 100%;
  height: 100%;
}

.barkx-pool-notice__icon svg circle,
.barkx-pool-notice__icon svg path {
  vector-effect: non-scaling-stroke;
}

.barkx-pool-notice.is-success {
  background: #0f1218;
  border-color: #25435a;
}

.barkx-pool-notice.is-success .barkx-pool-notice__icon {
  color: #61c48a;
}

.barkx-pool-notice.is-success .barkx-pool-notice__icon svg {
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.barkx-pool-notice__content {
  min-width: 0;
  flex: 1;
}

.barkx-pool-notice__text {
  margin: 0;
  color: #e8edf3;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 600;
  letter-spacing: -0.01em;
}

@media (max-width: 640px) {
  .barkx-pool-notice {
    min-height: 68px;
    padding: 16px 18px;
    border-radius: 16px;
  }

  .barkx-pool-notice.is-floating {
    bottom: 18px;
    width: calc(100vw - 20px);
  }
}
</style>
