<template>
  <CollapsibleCard :title="title || $t('components.collapsibleCard.options')">
    <template #icon>
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
        <circle cx="12" cy="12" r="3"></circle>
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        ></path>
      </svg>
    </template>

    <div style="margin-bottom: 16px">
      <div
        style="
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 10px;
        "
      >
        {{ $t("components.swapOptions.slippageTolerance") }}
      </div>
      <div class="percent-btns" style="justify-content: flex-start; margin: 0">
        <button
          class="p-btn"
          type="button"
          :style="slippageStyle('0.1%')"
          @click="selectedSlippage = '0.1%'"
        >
          {{ $t("components.swapOptions.slippage.low") }}
        </button>
        <button
          class="p-btn"
          type="button"
          :style="slippageStyle('0.5%')"
          @click="selectedSlippage = '0.5%'"
        >
          {{ $t("components.swapOptions.slippage.medium") }}
        </button>
        <button
          class="p-btn"
          type="button"
          :style="slippageStyle('1.0%')"
          @click="selectedSlippage = '1.0%'"
        >
          {{ $t("components.swapOptions.slippage.high") }}
        </button>
        <div
          style="
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid var(--border-dark);
            border-radius: 6px;
            padding: 0 8px;
          "
        >
          <input
            v-model="customSlippage"
            type="number"
            :placeholder="$t('components.swapOptions.custom')"
            style="
              width: 50px;
              background: transparent;
              border: none;
              color: var(--text-primary);
              padding: 6px 0;
              font-size: 13px;
              outline: none;
              text-align: right;
            "
          />
          <span
            style="
              font-size: 12px;
              color: var(--text-muted);
              margin-left: 4px;
            "
            >%</span
          >
        </div>
      </div>
    </div>

    <div
      style="
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      "
    >
      <div style="font-size: 13px; color: var(--text-muted)">
        {{ $t("components.swapOptions.transactionDeadline") }}
      </div>
      <div style="display: flex; align-items: center; gap: 8px">
        <input
          v-model="deadline"
          type="number"
          style="
            width: 50px;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid var(--border-dark);
            border-radius: 6px;
            color: var(--text-primary);
            padding: 6px 8px;
            font-size: 13px;
            outline: none;
            text-align: right;
          "
        />
        <span style="font-size: 13px; color: var(--text-muted)">{{ $t("components.swapOptions.minutes") }}</span>
      </div>
    </div>

    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
      "
    >
      <div style="font-size: 13px; color: var(--text-muted)">
        {{ $t("components.swapOptions.expertMode") }}
        <span
          style="
            font-size: 11px;
            color: var(--amber);
            display: block;
            margin-top: 4px;
          "
          >{{ $t("components.swapOptions.expertModeHint") }}</span
        >
      </div>
      <label class="switch">
        <input v-model="expertMode" type="checkbox" />
        <span class="slider"></span>
      </label>
    </div>
  </CollapsibleCard>
</template>

<script setup>
import CollapsibleCard from "@/components/mining/CollapsibleCard.vue";

defineProps({
  title: {
    type: String,
    default: "",
  },
});

const selectedSlippage = defineModel("selectedSlippage", {
  type: String,
  default: "0.5%",
});

const customSlippage = defineModel("customSlippage", {
  type: String,
  default: "",
});

const deadline = defineModel("deadline", {
  type: String,
  default: "20",
});

const expertMode = defineModel("expertMode", {
  type: Boolean,
  default: false,
});

function slippageStyle(value) {
  if (selectedSlippage.value !== value) {
    return null;
  }

  return {
    background: "rgba(56, 189, 248, 0.2)",
    color: "var(--text-primary)",
    borderColor: "var(--cyan)",
  };
}
</script>

<style scoped>
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  transition: 0.4s;
  border-radius: 24px;
  border: 1px solid var(--border-dark);
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: var(--text-secondary);
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: rgba(56, 189, 248, 0.2);
  border-color: var(--cyan);
}

input:checked + .slider:before {
  transform: translateX(20px);
  background-color: var(--cyan);
}
</style>
