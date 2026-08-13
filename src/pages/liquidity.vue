<template>
  <MiningShell>
    <div style="text-align: center; margin-bottom: 30px">
      <h1 style="font-size: 28px; color: var(--text-primary)">{{ $t("pages.liquidity.title") }}</h1>
      <p style="color: var(--text-muted); font-size: 14px">
        {{ $t("pages.liquidity.subtitle") }}
      </p>
    </div>

    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'add' }"
        type="button"
        @click="activeTab = 'add'"
      >
        {{ $t("pages.liquidity.tabs.add") }}
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'remove' }"
        type="button"
        @click="activeTab = 'remove'"
      >
        {{ $t("pages.liquidity.tabs.remove") }}
      </button>
    </div>

    <!-- ==================== Add Liquidity ==================== -->
    <div class="panel" :class="{ active: activeTab === 'add' }">
      <div class="input-group">
        <div class="input-header">
          <span>{{ $t("pages.liquidity.add.tokenA") }}</span>
          <span>{{ $t("common.balance", { amount: formatTokenAmount(barkxBalance, 18, 2) }) }}</span>
        </div>
        <div class="input-row">
          <input
            v-model="addBarkxInput"
            type="text"
            inputmode="decimal"
            class="input-field"
            placeholder="0.00"
            @input="onBarkxInput"
          />
          <div class="asset-badge">BARKX</div>
        </div>
      </div>

      <div class="icon-divider">+</div>

      <div class="input-group">
        <div class="input-header">
          <span>{{ $t("pages.liquidity.add.tokenB") }}</span>
          <span>{{ $t("common.balance", { amount: formatTokenAmount(usdtBalance, 6, 2) }) }}</span>
        </div>
        <div class="input-row">
          <input
            v-model="addUsdtInput"
            type="text"
            inputmode="decimal"
            class="input-field"
            placeholder="0.00"
            @input="onUsdtInput"
          />
          <div class="asset-badge">USDT</div>
        </div>
      </div>

      <div
        style="
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-dark);
          border-radius: 12px;
          padding: 16px;
          margin-top: 16px;
        "
      >
        <div style="text-align: center; margin-bottom: 12px">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase">
            {{ $t("pages.liquidity.add.receive") }}
          </div>
          <div style="font-size: 24px; font-weight: 700; color: var(--cyan); font-family: 'JetBrains Mono', monospace">
            {{ estimatedLpReceive }}
            <span style="font-size: 14px; color: var(--text-secondary)">LP</span>
          </div>
        </div>
        <div class="data-row" style="padding: 4px 0">
          <span class="data-lbl">{{ $t("pages.liquidity.add.shareOfPool") }}</span>
          <span class="data-val">{{ shareOfPool }}</span>
        </div>
      </div>

      <ApprovalActionGroup
        :requirements="addLiquidityRequirements"
        :check-handler="checkAddLiquidityApproval"
        :approve-handler="handleAddLiquidityApprove"
        :stack-approvals="true"
        :action-label="$t('pages.liquidity.add.action')"
        :action-disabled="addDisabled"
        :action-pending-text="$t('pages.liquidity.add.pending')"
        @action="handleAddLiquidity"
      />
    </div>

    <!-- ==================== Remove Liquidity ==================== -->
    <div class="panel" :class="{ active: activeTab === 'remove' }">
      <div class="input-group">
        <div class="input-header">
          <span>{{ $t("pages.liquidity.remove.lpAmount") }}</span>
          <span>{{ $t("common.balance", { amount: formatTokenAmount(lpBalance, 18, 6) }) }}</span>
        </div>
        <div class="input-row">
          <input
            v-model="removeLpInput"
            type="text"
            inputmode="decimal"
            class="input-field"
            placeholder="0.00"
          />
          <div class="asset-badge">LP</div>
        </div>
        <div class="percent-row">
          <button
            v-for="pct in [25, 50, 75, 100]"
            :key="pct"
            class="percent-btn"
            type="button"
            @click="setRemovePercent(pct)"
          >
            {{ pct }}%
          </button>
        </div>
      </div>

      <div class="icon-divider">&darr;</div>

      <div
        style="
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-dark);
          border-radius: 12px;
          padding: 16px;
          margin-top: 16px;
        "
      >
        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px">
          {{ $t("pages.liquidity.remove.receive") }}
        </div>
        <div class="data-row" style="padding: 6px 0">
          <span class="data-lbl">BARKX</span>
          <span class="data-val" style="font-family: 'JetBrains Mono', monospace">{{ removeEstimate.barkx }}</span>
        </div>
        <div class="data-row" style="padding: 6px 0">
          <span class="data-lbl">USDT</span>
          <span class="data-val" style="font-family: 'JetBrains Mono', monospace">{{ removeEstimate.usdt }}</span>
        </div>
      </div>

      <ApprovalActionGroup
        :requirements="removeLiquidityRequirements"
        :check-handler="checkRemoveLiquidityApproval"
        :approve-handler="handleRemoveLiquidityApprove"
        :action-label="$t('pages.liquidity.remove.action')"
        :action-disabled="removeDisabled"
        action-variant="danger"
        :action-pending-text="$t('pages.liquidity.remove.pending')"
        @action="handleRemoveLiquidity"
      />
    </div>

    <PoolStatusCard style="margin-top: 20px" />
  </MiningShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { formatUnits, maxUint256 } from "viem";
import ApprovalActionGroup from "@/components/mining/ApprovalActionGroup.vue";
import MiningShell from "@/components/mining/MiningShell.vue";
import PoolStatusCard from "@/components/mining/PoolStatusCard.vue";
import { useMainStore } from "@/store";
import { useBalances } from "@/composables/useBalances";
import { useApproval } from "@/composables/useApproval";
import { useUniswapV2 } from "@/composables/useUniswapV2";
import { getWalletClient, getPublicClient, getGasOverrides, writeContractWithGasBuffer, waitForTx, ADDRESSES } from "@/composables/useContracts";
import { useNotice } from "@/composables/useNotice";
import { resolveUniswapMessage } from "@/components/mining/uniswapMessages";
import { UniswapV2Router02Abi } from "@/abi";
import { formatTokenAmount, safeParseUnits, truncateFixed } from "@/utils/format";

const { t } = useI18n({ useScope: "global" });
const store = useMainStore();
const { account } = storeToRefs(store);
const balances = useBalances();
const { barkxBalance, usdtBalance, lpBalance } = balances;
const approval = useApproval();
const uniswap = useUniswapV2();
const { showNotice } = useNotice();

const activeTab = ref("add");

const addLiquidityRequirements = computed(() => [
  { id: "router:barkx", label: "BARKX" },
  { id: "router:usdt", label: "USDT" },
]);

const removeLiquidityRequirements = computed(() => [
  { id: "router:lp", label: "LP" },
]);

// --- Data loading ---
async function loadData() {
  const tasks = [uniswap.fetchPair()];
  if (account.value) {
    tasks.push(balances.fetchBalances(account.value));
  }
  await Promise.all(tasks);
}
onMounted(loadData);
watch(() => account.value, loadData);

// --- Add Liquidity ---
const addBarkxInput = ref("");
const addUsdtInput = ref("");

function onBarkxInput() {
  const rawValue = String(addBarkxInput.value ?? "").trim();
  const val = Number(rawValue) || 0;
  if (val <= 0) {
    addUsdtInput.value = "";
    return;
  }

  if (uniswap.pair.value) {
    const raw = safeParseUnits(rawValue, 18);
    if (!raw) {
      addUsdtInput.value = "";
      return;
    }
    const quoted = uniswap.quoteAddAmount(raw.toString(), true);
    if (Number(quoted) > 0) {
      addUsdtInput.value = truncateFixed(Number(quoted), 2);
    }
  }
}

function onUsdtInput() {
  const rawValue = String(addUsdtInput.value ?? "").trim();
  const val = Number(rawValue) || 0;
  if (val <= 0) {
    addBarkxInput.value = "";
    return;
  }

  if (uniswap.pair.value) {
    const raw = safeParseUnits(rawValue, 6);
    if (!raw) {
      addBarkxInput.value = "";
      return;
    }
    const quoted = uniswap.quoteAddAmount(raw.toString(), false);
    if (Number(quoted) > 0) {
      addBarkxInput.value = truncateFixed(Number(quoted), 2);
    }
  }
}

const estimatedLpReceive = computed(() => {
  const barkxVal = Number(addBarkxInput.value) || 0;
  const usdtVal = Number(addUsdtInput.value) || 0;
  if (barkxVal <= 0 || usdtVal <= 0) return "0.000000";

  if (uniswap.pair.value && uniswap.totalSupply.value > 0n) {
    const barkxRaw = safeParseUnits(addBarkxInput.value, 18);
    const usdtRaw = safeParseUnits(addUsdtInput.value, 6);
    if (!barkxRaw || !usdtRaw) return "0.000000";
    const est = uniswap.estimateAddLiquidityLP(barkxRaw.toString(), usdtRaw.toString());
    const num = Number(est);
    return num > 0 ? truncateFixed(num, 6) : "0.000000";
  }

  const approx = Math.sqrt(barkxVal * usdtVal);
  return approx > 0 ? truncateFixed(approx, 6) : "0.000000";
});

const addBarkxInputInvalid = computed(() => {
  const rawValue = String(addBarkxInput.value ?? "").trim();
  const value = Number(rawValue) || 0;
  if (value <= 0) return true;

  const amount = safeParseUnits(rawValue, 18);
  if (!amount) return true;
  if (amount > barkxBalance.value) return true;

  return false;
});

const addUsdtInputInvalid = computed(() => {
  const rawValue = String(addUsdtInput.value ?? "").trim();
  const value = Number(rawValue) || 0;
  if (value <= 0) return true;

  const amount = safeParseUnits(rawValue, 6);
  if (!amount) return true;
  if (amount > usdtBalance.value) return true;

  return false;
});

const addInputsInvalid = computed(() =>
  addBarkxInputInvalid.value || addUsdtInputInvalid.value,
);

const addDisabled = computed(() => {
  return addInputsInvalid.value;
});

const removeLpInputInvalid = computed(() => {
  const rawValue = String(removeLpInput.value ?? "").trim();
  const lp = Number(rawValue) || 0;
  if (lp <= 0) return true;

  const amount = safeParseUnits(rawValue, 18);
  if (!amount) return true;
  if (amount > lpBalance.value) return true;

  return false;
});

const removeDisabled = computed(() => {
  return removeLpInputInvalid.value;
});

const shareOfPool = computed(() => {
  const barkxVal = Number(addBarkxInput.value) || 0;
  if (barkxVal <= 0) return "0.00%";

  if (uniswap.pair.value && uniswap.totalSupply.value > 0n) {
    const barkxRaw = safeParseUnits(addBarkxInput.value, 18);
    if (!barkxRaw) return "—";
    return uniswap.calcShareOfPool(barkxRaw.toString());
  }

  return "—";
});

// --- Remove Liquidity ---
const removeLpInput = ref("");

function setRemovePercent(pct) {
  if (lpBalance.value <= 0n) return;
  const amount = (lpBalance.value * BigInt(pct)) / 100n;
  removeLpInput.value = formatUnits(amount, 18);
}

const removeEstimate = computed(() => {
  const val = Number(removeLpInput.value) || 0;
  if (val <= 0) return { barkx: "0.00", usdt: "0.00" };
  const raw = safeParseUnits(removeLpInput.value, 18);
  if (!raw) return { barkx: "—", usdt: "—" };
  return uniswap.estimateRemoveLiquidity(raw.toString());
});

// --- Approval checks ---
async function checkAddLiquidityApproval(requirement) {
  if (requirement.id === "router:barkx") return approval.isBarkXApprovedForRouter();
  if (requirement.id === "router:usdt") return approval.isUsdtApprovedForRouter();
  return false;
}

async function handleAddLiquidityApprove(requirement) {
  if (requirement.id === "router:barkx") return approval.approveBarkXForRouter(maxUint256);
  if (requirement.id === "router:usdt") return approval.approveUsdtForRouter(maxUint256);
  return false;
}

async function checkRemoveLiquidityApproval(requirement) {
  if (requirement.id === "router:lp") return approval.isLpApprovedForRouter();
  return false;
}

async function handleRemoveLiquidityApprove(requirement) {
  if (requirement.id === "router:lp") return approval.approveLpForRouter(maxUint256);
  return false;
}

// --- Transactions ---
async function handleAddLiquidity() {
  if (addInputsInvalid.value) return;

  const barkxVal = Number(addBarkxInput.value) || 0;
  const usdtVal = Number(addUsdtInput.value) || 0;
  if (barkxVal <= 0 || usdtVal <= 0) return;

  const barkxWei = safeParseUnits(addBarkxInput.value, 18);
  const usdtWei = safeParseUnits(addUsdtInput.value, 6);
  if (!barkxWei || !usdtWei) return;
  const barkxMin = (barkxWei * 995n) / 1000n;
  const usdtMin = (usdtWei * 995n) / 1000n;
  const deadlineSec = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.liquidity.add.pending") });

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();

    const gasOverrides = await getGasOverrides();
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.router,
      abi: UniswapV2Router02Abi,
      functionName: "addLiquidity",
      args: [ADDRESSES.barkX, ADDRESSES.usdt, barkxWei, usdtWei, barkxMin, usdtMin, userAccount, deadlineSec],
      account: userAccount,
      ...gasOverrides,
    });

    const receipt = await waitForTx(hash);
    // 从交易回执中读取实际铸造的 LP 数量（addLiquidity 返回第三个值 liquidity）
    let actualLp = estimatedLpReceive.value;
    try {
      const logs = receipt.logs;
      // addLiquidity 返回 (amountA, amountB, liquidity)，liquidity 在 Transfer 事件里
      // 找 LP token 的 Transfer 事件（to = userAccount）
      const lpTransfer = logs.find(
        (log) => log.address.toLowerCase() === ADDRESSES.lpToken.toLowerCase() && log.topics.length >= 3,
      );
      if (lpTransfer && lpTransfer.data) {
        actualLp = formatUnits(BigInt(lpTransfer.data), 18);
      }
    } catch {
      // fallback to estimate
    }
    await loadData();
    addBarkxInput.value = "";
    addUsdtInput.value = "";
    showNotice(resolveUniswapMessage("uniswap_add_liquidity_success", { lpAmount: actualLp }));
  } catch (err) {
    console.error("addLiquidity failed:", err);
    showNotice(resolveUniswapMessage("uniswap_add_liquidity_failure_retry"));
  } finally {
    store.clearWalletPendingState();
  }
}

async function handleRemoveLiquidity() {
  if (removeLpInputInvalid.value) return;

  const val = Number(removeLpInput.value) || 0;
  if (val <= 0) return;

  const liquidity = safeParseUnits(removeLpInput.value, 18);
  if (!liquidity) return;
  const est = removeEstimate.value;
  const estBarkx = safeParseUnits(est.barkx, 18);
  const estUsdt = safeParseUnits(est.usdt, 6);
  const barkxMin = estBarkx ? (estBarkx * 995n) / 1000n : 0n;
  const usdtMin = estUsdt ? (estUsdt * 995n) / 1000n : 0n;
  const deadlineSec = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);

  try {
    store.setWalletPendingState({ pending: true, text: t("pages.liquidity.remove.pending") });

    const walletClient = getWalletClient();
    const [userAccount] = await walletClient.getAddresses();

    const gasOverrides = await getGasOverrides();
    const hash = await writeContractWithGasBuffer(walletClient, {
      address: ADDRESSES.router,
      abi: UniswapV2Router02Abi,
      functionName: "removeLiquidity",
      args: [ADDRESSES.barkX, ADDRESSES.usdt, liquidity, barkxMin, usdtMin, userAccount, deadlineSec],
      account: userAccount,
      ...gasOverrides,
    });

    await waitForTx(hash);
    await loadData();
    const removedLp = formatUnits(liquidity, 18);
    removeLpInput.value = "";
    showNotice(resolveUniswapMessage("uniswap_remove_liquidity_success", { lpAmount: removedLp }));
  } catch (err) {
    console.error("removeLiquidity failed:", err);
    showNotice(resolveUniswapMessage("uniswap_remove_liquidity_failure_retry"));
  } finally {
    store.clearWalletPendingState();
  }
}
</script>

<style scoped>
.data-lbl {
  flex-shrink: 0;
  white-space: nowrap;
  margin-right: 12px;
}
.data-val {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.percent-row {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.percent-btn {
  flex: 1;
  padding: 6px 0;
  border-radius: 8px;
  border: 1px solid var(--border-dark);
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.percent-btn:hover {
  border-color: var(--cyan);
  color: var(--cyan);
}
.asset-icon.lp {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}
</style>
