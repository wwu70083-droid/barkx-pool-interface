<template>
  <MiningShell>
    <!-- Transfer Confirm Modal -->
    <div
      class="custom-modal-overlay"
      :class="{ show: modalVisible }"
      :style="{ display: modalDisplay }"
      @click="closeModal"
    >
      <div
        class="custom-modal amber-theme"
        :class="{ show: modalCardVisible }"
        @click.stop
      >
        <div class="custom-modal-close" @click="closeModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
        <div class="custom-modal-title">{{ $t("pages.vn.modal.title") }}</div>
        <div class="custom-modal-text" v-html="modalContent"></div>
        <button
          class="btn-submit amber"
          style="margin-top: 20px"
          :disabled="transferPending"
          @click="confirmTransfer"
        >
          {{ transferPending ? $t("pages.vn.modal.pending") : $t("pages.vn.modal.confirm") }}
        </button>
      </div>
    </div>

    <div style="text-align: center; margin-bottom: 30px">
      <h1 style="font-size: 28px; color: var(--text-primary)">{{ $t("pages.vn.title") }}</h1>
      <p style="color: var(--text-muted); font-size: 14px">{{ $t("pages.vn.subtitle") }}</p>
    </div>

    <div class="tabs">
      <div class="tab" :class="{ active: activeTab === 'new-vn' }" @click="activeTab = 'new-vn'">
        {{ $t("pages.vn.tabs.newVn") }}
        <span style="font-size: 11px; opacity: 0.7">(ERC1155)</span>
      </div>
      <div class="tab" :class="{ active: activeTab === 'used-vn' }" @click="activeTab = 'used-vn'">
        {{ $t("pages.vn.tabs.usedVn") }}
        <span style="font-size: 11px; opacity: 0.7">(ERC721)</span>
      </div>
    </div>

    <!-- New VN Panel -->
    <div class="panel" :class="{ active: activeTab === 'new-vn' }">
      <div class="info-box">{{ $t("pages.vn.newVn.info") }}</div>

      <div class="card" style="margin-top: 16px">
        <div class="input-group" style="margin-bottom: 24px">
          <div class="input-header">
            <span>{{ $t("pages.vn.recipientAddress") }}</span>
          </div>
          <div class="input-row">
            <input
              v-model="newVnAddress"
              type="text"
              class="input-field address-input"
              :placeholder="$t('pages.vn.addressPlaceholder')"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="input-group">
          <div class="input-header">
            <span>{{ $t("pages.vn.transferAmount") }}</span>
            <span>{{ $t("pages.vn.balance") }}: {{ newVnBalance }}</span>
          </div>
          <div class="input-row">
            <input
              v-model="newVnAmount"
              type="number"
              class="input-field"
              placeholder="0"
              step="1"
              min="1"
            />
            <div class="asset-badge">VN</div>
          </div>
          <div class="percent-btns">
            <button class="p-btn" type="button" @click="newVnAmount = newVnBalance">{{ $t("common.max") }}</button>
          </div>
        </div>

        <ApprovalActionGroup
          :requirements="[]"
          :action-label="$t('pages.vn.newVn.btn')"
          :action-disabled="newVnActionDisabled"
          @action="initiateTransfer('VN')"
        />
      </div>
    </div>

    <!-- Used VN Panel -->
    <div class="panel" :class="{ active: activeTab === 'used-vn' }">
      <div class="info-box amber">{{ $t("pages.vn.usedVn.info") }}</div>

      <div class="card" style="margin-top: 16px">
        <div class="sub-tab-container">
          <button
            class="sub-tab-btn"
            :class="{ active: selectedUsedAsset === 'wVN' }"
            type="button"
            @click="switchUsedAsset('wVN')"
          >wVN</button>
          <button
            class="sub-tab-btn"
            :class="{ active: selectedUsedAsset === 'wVN2' }"
            type="button"
            @click="switchUsedAsset('wVN2')"
          >wVN2</button>
        </div>

        <div class="input-group" style="margin-bottom: 24px">
          <div class="input-header">
            <span>{{ $t("pages.vn.recipientAddress") }}</span>
          </div>
          <div class="input-row">
            <input
              v-model="usedVnAddress"
              type="text"
              class="input-field address-input"
              :placeholder="$t('pages.vn.addressPlaceholder')"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="input-group">
          <div class="input-header">
            <span>{{ $t("pages.vn.transferAmount") }}</span>
            <span>{{ $t("pages.vn.balance") }}: {{ usedVnBalances[selectedUsedAsset] }}</span>
          </div>
          <div class="input-row">
            <input
              v-model="usedVnAmount"
              type="number"
              class="input-field"
              placeholder="0"
              step="1"
              min="1"
            />
            <div class="asset-badge" style="background: var(--bg-card-solid); border-color: var(--amber)">
              <span style="color: var(--amber)">{{ selectedUsedAsset }}</span>
            </div>
          </div>
          <div class="percent-btns">
            <button class="p-btn" type="button" @click="usedVnAmount = usedVnBalances[selectedUsedAsset]">{{ $t("common.max") }}</button>
          </div>
        </div>

        <ApprovalActionGroup
          :requirements="[]"
          :action-label="`${$t('pages.vn.usedVn.btn')} ${selectedUsedAsset}`"
          action-variant="amber"
          :action-disabled="usedVnActionDisabled"
          @action="initiateTransfer(selectedUsedAsset)"
        />
      </div>
    </div>
  </MiningShell>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useMainStore } from "@/store";
import { useBalances } from "@/composables/useBalances";
import { isAddress } from "viem";
import { getPublicClient, getWalletClient, getGasOverrides, writeContractWithGasBuffer, waitForTx, ADDRESSES } from "@/composables/useContracts";
import { VNAbi, WVN1Abi, WVN2Abi, ERC721BatchTransferAbi } from "@/abi";
import { useNotice } from "@/composables/useNotice";
import ApprovalActionGroup from "@/components/mining/ApprovalActionGroup.vue";

const { t } = useI18n({ useScope: "global" });
const { showNotice } = useNotice();

const VN_TOKEN_ID = 1n;

const store = useMainStore();
const { account } = storeToRefs(store);
const balances = useBalances();
const { vnBalance: vnBalanceRaw, wvn1Balance: wvn1BalanceRaw } = balances;

const activeTab = ref("new-vn");

// New VN
const newVnAddress = ref("");
const newVnAmount = ref("");
const newVnBalance = computed(() => Number(vnBalanceRaw.value));
const vnTransferLocked = ref(false);

// Used VN
const usedVnAddress = ref("");
const usedVnAmount = ref("");
const selectedUsedAsset = ref("wVN");
const wvn2BalanceRaw = ref(0n);
const usedVnBalances = computed(() => ({
  wVN: Number(wvn1BalanceRaw.value),
  wVN2: Number(wvn2BalanceRaw.value),
}));

function switchUsedAsset(asset) {
  selectedUsedAsset.value = asset;
  usedVnAmount.value = "";
}

// Action disabled states
const newVnActionDisabled = computed(() => {
  const addr = newVnAddress.value.trim();
  const amt = parseInt(newVnAmount.value);
  return vnTransferLocked.value || !isAddress(addr) || !(amt > 0) || amt > newVnBalance.value;
});

const usedVnActionDisabled = computed(() => {
  const addr = usedVnAddress.value.trim();
  const amt = parseInt(usedVnAmount.value);
  return !isAddress(addr) || !(amt > 0) || amt > usedVnBalances.value[selectedUsedAsset.value];
});

// Modal
const modalVisible = ref(false);
const modalCardVisible = ref(false);
const modalDisplay = ref("none");
const modalContent = ref("");
const transferPending = ref(false);
let pendingAssetType = "";

function initiateTransfer(assetType) {
  const address = assetType === "VN" ? newVnAddress.value : usedVnAddress.value;
  const amount = assetType === "VN" ? newVnAmount.value : usedVnAmount.value;

  pendingAssetType = assetType;

  modalContent.value = `
    <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
      ${t("pages.vn.modal.aboutToTransfer")}
      <strong style="color: var(--amber); font-size: 16px;">${amount} ${assetType}</strong>
      ${t("pages.vn.modal.toAddress")}
    </div>
    <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-primary); word-break: break-all; margin-bottom: 12px; padding: 10px; background: rgba(0,0,0,0.4); border-radius: 8px;">
      ${address}
    </div>
    <div style="font-size: 12px; color: var(--red);">
      ${t("pages.vn.modal.warning")}
    </div>
  `;

  document.body.style.overflow = "hidden";
  modalDisplay.value = "flex";
  requestAnimationFrame(() => {
    modalVisible.value = true;
    modalCardVisible.value = true;
  });
}

function closeModal() {
  if (transferPending.value) return;
  document.body.style.overflow = "";
  modalVisible.value = false;
  modalCardVisible.value = false;
  setTimeout(() => {
    modalDisplay.value = "none";
  }, 300);
}

onBeforeUnmount(() => {
  document.body.style.overflow = "";
});

async function confirmTransfer() {
  if (transferPending.value) return;

  const assetType = pendingAssetType;
  const toAddress = (assetType === "VN" ? newVnAddress.value : usedVnAddress.value).trim();
  const amount = parseInt(assetType === "VN" ? newVnAmount.value : usedVnAmount.value);

  transferPending.value = true;
  store.setWalletPendingState({ pending: true, text: t("pages.vn.transfer.pending", { asset: assetType }) });

  let succeeded = false;
  try {
    const walletClient = getWalletClient();
    const [from] = await walletClient.getAddresses();
    const gasOverrides = await getGasOverrides();

    if (assetType === "VN") {
      const hash = await writeContractWithGasBuffer(walletClient, {
        address: ADDRESSES.vn,
        abi: VNAbi,
        functionName: "safeTransferFrom",
        args: [from, toAddress, VN_TOKEN_ID, BigInt(amount), "0x"],
        account: from,
        ...gasOverrides,
      });
      await waitForTx(hash);
      newVnAmount.value = "";
      newVnAddress.value = "";
    } else {
      const tokenIds = await fetchUserErc721TokenIds(assetType);
      const toTransfer = tokenIds.slice(0, amount);
      if (toTransfer.length === 0) throw new Error("No token IDs found");

      const abi = assetType === "wVN" ? WVN1Abi : WVN2Abi;
      const contractAddress = assetType === "wVN" ? ADDRESSES.wVN1 : ADDRESSES.wVN2;
      const batchAddress = ADDRESSES.erc721BatchTransfer;

      // One-tx batch transfer via ERC721BatchTransfer: approve the util once
      // (setApprovalForAll), then batchTransferToOne for all selected token IDs.
      const publicClient = getPublicClient();
      const approved = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: "isApprovedForAll",
        args: [from, batchAddress],
      });
      if (!approved) {
        const approveHash = await writeContractWithGasBuffer(walletClient, {
          address: contractAddress,
          abi,
          functionName: "setApprovalForAll",
          args: [batchAddress, true],
          account: from,
          ...gasOverrides,
        });
        await waitForTx(approveHash);
      }

      const hash = await writeContractWithGasBuffer(walletClient, {
        address: batchAddress,
        abi: ERC721BatchTransferAbi,
        functionName: "batchTransferToOne",
        args: [contractAddress, toTransfer, toAddress],
        account: from,
        ...gasOverrides,
      });
      await waitForTx(hash);
      usedVnAmount.value = "";
      usedVnAddress.value = "";
    }

    succeeded = true;
    showNotice({ outcome: "success", text: t("pages.vn.transfer.success") });
    await loadBalances();
  } catch (err) {
    console.error("Transfer failed:", err);
    showNotice({ outcome: "failure", text: t("pages.vn.transfer.failed") });
  } finally {
    transferPending.value = false;
    store.clearWalletPendingState();
    if (succeeded) closeModal();
  }
}

async function fetchUserErc721TokenIds(assetType) {
  if (!account.value) return [];
  const client = getPublicClient();
  const abi = assetType === "wVN" ? WVN1Abi : WVN2Abi;
  const contractAddress = assetType === "wVN" ? ADDRESSES.wVN1 : ADDRESSES.wVN2;

  const totalMinted = await client.readContract({
    address: contractAddress,
    abi,
    functionName: "totalMinted",
  });
  if (!totalMinted || totalMinted === 0n) return [];

  const calls = [];
  for (let i = 1n; i <= totalMinted; i++) {
    calls.push({ address: contractAddress, abi, functionName: "ownerOf", args: [i] });
  }
  const results = await client.multicall({ contracts: calls });
  const userAddr = account.value.toLowerCase();
  const ids = [];
  results.forEach((r, idx) => {
    if (r.result && r.result.toLowerCase() === userAddr) {
      ids.push(BigInt(idx + 1));
    }
  });
  return ids;
}

async function loadBalances() {
  if (!account.value) return;
  const client = getPublicClient();

  const [, wvn2Result, lockedResult] = await Promise.all([
    balances.fetchBalances(account.value),
    client.readContract({
      address: ADDRESSES.wVN2,
      abi: WVN2Abi,
      functionName: "balanceOf",
      args: [account.value],
    }),
    client.readContract({
      address: ADDRESSES.vn,
      abi: VNAbi,
      functionName: "transferLocked",
    }),
  ]);

  wvn2BalanceRaw.value = wvn2Result ?? 0n;
  vnTransferLocked.value = (lockedResult ?? 0n) !== 0n;
}

onMounted(loadBalances);
watch(() => account.value, loadBalances);
</script>

<style scoped lang="less">
/* 隐藏数字输入框箭头 */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}

.input-header {
  color: #ffffff !important;
}

.sub-tab-container {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}
.sub-tab-btn {
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
  &.active {
    background: rgba(56, 189, 248, 0.15);
    color: var(--cyan);
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
  }
}
.panel {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.tab--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.address-input {
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  letter-spacing: 0.5px;
}

.custom-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1000;
  display: none;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  &.show {
    opacity: 1;
  }
}
.custom-modal {
  width: 88%;
  max-width: 360px;
  background: rgba(18, 14, 10, 0.95);
  border: 1px solid var(--cyan);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transform: translateY(20px);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
  &.amber-theme {
    border-color: var(--amber);
  }
  &.show {
    transform: translateY(0);
  }
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
  &:hover {
    color: var(--amber);
  }
}
.custom-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-right: 24px;
}
.custom-modal-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

:deep(.btn-submit:disabled),
:deep(.btn-submit[disabled]) {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
