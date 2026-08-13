<template>
  <div class="approval-action-group">
    <div
      v-if="!walletConnected"
      class="approval-action-group__buttons approval-action-group__buttons--single"
    >
      <button
        class="btn-submit"
        type="button"
        :class="actionVariant"
        disabled
      >
        {{ actionLabel }}
      </button>
    </div>

    <div
      v-else-if="checking"
      class="approval-action-group__buttons approval-action-group__buttons--single"
    >
      <button class="btn-submit" type="button" disabled>
        {{ $t("components.approvalActionGroup.checking") }}
      </button>
    </div>

    <div
      v-else-if="missingRequirements.length"
      class="approval-action-group__buttons"
      :class="{
        'approval-action-group__buttons--single': missingRequirements.length === 1,
        'approval-action-group__buttons--multi':
          missingRequirements.length > 1 && !stackApprovals,
        'approval-action-group__buttons--stacked':
          missingRequirements.length > 1 && stackApprovals,
      }"
    >
      <button
        v-for="requirement in missingRequirements"
        :key="requirement.id"
        class="btn-submit"
        type="button"
        :disabled="walletInteractionLocked || approvalDisabled"
        @click="approveRequirement(requirement)"
      >
        {{ $t("components.approvalActionGroup.approve", { token: requirement.label }) }}
      </button>
    </div>

    <div
      v-else
      class="approval-action-group__buttons approval-action-group__buttons--single"
    >
      <button
        class="btn-submit"
        :class="actionVariant"
        type="button"
        :disabled="walletInteractionLocked || actionDisabled"
        @click="runAction"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useWallet } from "@/composables/useWallet";

const props = defineProps({
  requirements: {
    type: Array,
    default: () => [],
  },
  actionLabel: {
    type: String,
    required: true,
  },
  actionVariant: {
    type: String,
    default: "",
  },
  actionDisabled: {
    type: Boolean,
    default: false,
  },
  approvalDisabled: {
    type: Boolean,
    default: false,
  },
  actionPendingText: {
    type: String,
    default: "",
  },
  stackApprovals: {
    type: Boolean,
    default: false,
  },
  approveHandler: {
    type: Function,
    default: null,
  },
  checkHandler: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(["action", "approved"]);

const { t } = useI18n({ useScope: "global" });
const { account, walletConnected, walletInteractionLocked, walletIsTargetChain } = useWallet();
const approvalStates = reactive({});
const checking = ref(false);
let checkRunning = false;
let checkedOnce = false;

function syncApprovalStateShape() {
  const activeIds = new Set(props.requirements.map((item) => item.id));

  props.requirements.forEach((item) => {
    if (!(item.id in approvalStates)) {
      approvalStates[item.id] = false;
    }
  });

  Object.keys(approvalStates).forEach((id) => {
    if (!activeIds.has(id)) {
      delete approvalStates[id];
    }
  });
}

function resetApprovalStates() {
  syncApprovalStateShape();
  Object.keys(approvalStates).forEach((id) => {
    approvalStates[id] = false;
  });
}

async function checkAllowances() {
  if (!props.checkHandler || !walletConnected.value || !walletIsTargetChain.value || !account.value) {
    checking.value = false;
    return;
  }
  if (checkRunning) return;

  checkRunning = true;
  checking.value = true;
  try {
    syncApprovalStateShape();

    for (const req of props.requirements) {
      try {
        approvalStates[req.id] = await props.checkHandler(req);
      } catch {
        approvalStates[req.id] = false;
      }
    }
    checkedOnce = true;
  } finally {
    checking.value = false;
    checkRunning = false;
  }
}

watch(
  () => props.requirements.map((item) => item.id).join(","),
  (idsStr, oldIdsStr) => {
    syncApprovalStateShape();
    const changed = oldIdsStr !== undefined && idsStr !== oldIdsStr;
    if (changed) {
      checkedOnce = false;
      resetApprovalStates();
    }

    if (props.checkHandler && walletConnected.value && walletIsTargetChain.value && account.value && (!checkedOnce || changed)) {
      checkAllowances();
    }
  },
  { immediate: true },
);

watch(
  () => [walletConnected.value, walletIsTargetChain.value, account.value],
  ([connected, isTargetChain, currentAccount], [prevConnected, prevIsTargetChain, prevAccount]) => {
    const changed =
      connected !== prevConnected
      || isTargetChain !== prevIsTargetChain
      || currentAccount !== prevAccount;

    if (!changed) {
      return;
    }

    checkedOnce = false;
    resetApprovalStates();

    if (connected && isTargetChain && currentAccount && props.checkHandler) {
      checkAllowances();
      return;
    }

    checking.value = false;
  }
);

const missingRequirements = computed(() =>
  props.requirements.filter((item) => !approvalStates[item.id]),
);

async function approveRequirement(requirement) {
  if (walletInteractionLocked.value) {
    return;
  }

  if (props.approveHandler) {
    try {
      const ok = await props.approveHandler(requirement);
      if (ok) {
        approvalStates[requirement.id] = true;
        emit("approved", requirement);
      }
    } catch (err) {
      console.error("Approval failed:", err);
    }
  } else {
    approvalStates[requirement.id] = true;
    emit("approved", requirement);
  }
}

async function runAction() {
  if (walletInteractionLocked.value || props.actionDisabled) {
    return;
  }

  emit("action");
}

defineExpose({ checkAllowances });
</script>

<style scoped>
.approval-action-group {
  margin-top: 16px;
}

.approval-action-group__buttons {
  display: grid;
  gap: 12px;
}

.approval-action-group__buttons--single {
  grid-template-columns: 1fr;
}

.approval-action-group__buttons--multi {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.approval-action-group__buttons--stacked {
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (max-width: 640px) {
  .approval-action-group__buttons--multi {
    grid-template-columns: 1fr;
  }
}
</style>
