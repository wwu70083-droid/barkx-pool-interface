<template>
  <MiningShell class="orderbook-page-theme">
    <!-- Page heading -->
    <div style="text-align: center; margin-bottom: 30px">
      <h1 style="font-size: 28px; color: var(--text-primary)">{{ $t("pages.orderbook.title") }}</h1>
      <p style="color: var(--text-muted); font-size: 14px">{{ $t("pages.orderbook.subtitle") }}</p>
    </div>

    <!-- Not connected -->
    <div v-if="!account" class="info-box" style="text-align: center">
      {{ $t("pages.orderbook.connectPrompt") }}
    </div>

    <template v-else>
      <div class="tabs">
        <div class="tab" :class="{ active: activeTab === 'buy' }" @click="switchTab('buy')">
          {{ $t("pages.orderbook.tabs.buy") }}
        </div>
        <div class="tab" :class="{ active: activeTab === 'sell' }" @click="switchTab('sell')">
          {{ $t("pages.orderbook.tabs.sell") }}
        </div>
      </div>

      <!-- ───────────── Buy panel ───────────── -->
      <div class="panel" :class="{ active: activeTab === 'buy' }">
        <div class="info-box">{{ $t("pages.orderbook.buy.info", { pct: feePct }) }}</div>

        <div class="ob-section-label">{{ $t("pages.orderbook.priceTierLabel") }}</div>
        <div class="sub-tab-container">
          <button
            v-for="(p, i) in priceTiers"
            :key="'buyp' + i"
            class="sub-tab-btn"
            :class="{ active: buyTier === i }"
            @click="setBuyTier(i)"
          >
            {{ p }}
          </button>
        </div>

        <div class="data-row ob-depth-row">
          <span class="data-lbl">{{ $t("pages.orderbook.buy.depth") }}</span>
          <span class="data-val highlight">{{ buyDepth }}</span>
        </div>

        <div class="ob-selectall-row">
          <label class="ob-selectall">
            <input type="checkbox" class="ob-checkbox-cyan" :checked="buyPageAllChecked" @change="toggleBuyAll($event.target.checked)" />
            {{ $t("pages.orderbook.selectAll") }}
          </label>
        </div>

        <div class="order-list">
          <label v-for="o in buyOrders" :key="o.orderId.toString()" class="order-item">
            <input
              type="checkbox"
              class="order-checkbox"
              :checked="inBuyCart(o.orderId)"
              @change="toggleBuy(o, $event.target.checked)"
            />
            <div class="order-details-left">
              <div class="order-id">#{{ orderSeq(o.orderId) }}</div>
              <div class="order-sub">{{ shorten(o.seller) }}</div>
            </div>
            <div class="order-assets-right">
              <div class="asset-line-primary">{{ fmtInt(o.amount) }} vBARKX</div>
              <div class="asset-line">{{ fmtInt(o.payment) }} BARKX</div>
            </div>
          </label>
          <div v-if="buyOrders.length === 0" class="ob-empty">{{ $t("pages.orderbook.noOrders") }}</div>
        </div>

        <div class="pagination">
          <button class="page-btn" :disabled="buyPage <= 1" @click="buyPrev">&#10094;</button>
          <span class="ob-page-info">{{ buyPage }} / {{ buyTotalPages }}</span>
          <button class="page-btn" :disabled="!buyHasMore" @click="buyNext">&#10095;</button>
        </div>

        <div class="ob-cart-box">
          <div class="ob-cart-title">{{ $t("pages.orderbook.buy.cartTitle") }}</div>
          <div class="data-row ob-cart-row">
            <span class="data-lbl">{{ $t("pages.orderbook.buy.totalDemand") }}</span>
            <span class="data-val highlight" style="font-size: 16px">{{ fmtInt(buyTotalDemand) }} vBARKX</span>
          </div>
          <div class="data-row ob-cart-row">
            <span class="data-lbl">{{ $t("pages.orderbook.buy.totalPayment") }}</span>
            <span class="data-val highlight" style="font-size: 16px">{{ fmtInt(buyTotalPayment) }} BARKX</span>
          </div>
          <div class="data-row ob-cart-row">
            <span class="data-lbl">{{ $t("pages.orderbook.buy.fee", { pct: feePct }) }}</span>
            <span class="data-val" style="color: var(--red); font-size: 16px">{{ fmtInt(buyFee) }} vBARKX</span>
          </div>
        </div>

        <ApprovalActionGroup
          :requirements="buyApprovalReqs"
          :action-label="buyActionLabel"
          :action-disabled="buyActionDisabled"
          :check-handler="checkBarkxApproval"
          :approve-handler="approveBarkx"
          @action="doPurchase"
        />
      </div>

      <!-- ───────────── Sell panel ───────────── -->
      <div class="panel ob-sell-panel" :class="{ active: activeTab === 'sell' }">
        <!-- Place New Order -->
        <div class="card ob-place-card">
          <div class="card-title ob-place-title">{{ $t("pages.orderbook.sell.placeTitle") }}</div>
          <div class="info-box" style="margin-bottom: 16px; font-size: 13px">{{ $t("pages.orderbook.sell.placeInfo") }}</div>

          <div class="ob-section-label">{{ $t("pages.orderbook.sell.selectPrice") }}</div>
          <div class="grid-price-selectors">
            <button
              v-for="(p, i) in priceTiers"
              :key="'placep' + i"
              class="p-btn"
              :class="{ active: placePrice === i }"
              @click="placePrice = i"
            >
              {{ p }}
            </button>
          </div>

          <div class="ob-section-label">{{ $t("pages.orderbook.sell.selectAmount") }}</div>
          <div class="grid-amount-selectors">
            <button
              v-for="(a, i) in amountTiers"
              :key="'placea' + i"
              class="p-btn"
              :class="{ active: placeAmount === i, 'p-btn-disabled': amountTierDisabled(i) }"
              :disabled="amountTierDisabled(i)"
              @click="placeAmount = i"
            >
              {{ a.toLocaleString("en-US") }}
            </button>
          </div>

          <div class="data-row" style="padding-top: 4px; padding-bottom: 8px">
            <span class="data-lbl">{{ $t("pages.orderbook.sell.estimatedValue") }}</span>
            <span class="data-val highlight" style="font-size: 18px; color: var(--cyan)">{{ fmtInt(placeEstimate) }} BARKX</span>
          </div>
          <div class="data-row" style="border-bottom: none; padding-top: 8px; padding-bottom: 0">
            <span class="data-lbl">{{ $t("pages.orderbook.sell.walletBalance") }}</span>
            <span class="data-val ob-mono">{{ walletVbarkx }} vBARKX</span>
          </div>

          <ApprovalActionGroup
            :requirements="placeApprovalReqs"
            :action-label="$t('pages.orderbook.sell.placeAction')"
            :action-disabled="placeActionDisabled"
            :check-handler="checkVbarkxApproval"
            :approve-handler="approveVbarkx"
            @action="doList"
          />
        </div>

        <!-- Your Active Orders -->
        <div class="card" style="margin-bottom: 0">
          <div class="card-title ob-active-title">{{ $t("pages.orderbook.sell.activeTitle") }}</div>
          <div class="info-box amber" style="margin-bottom: 16px">{{ $t("pages.orderbook.sell.revokeInfo") }}</div>

          <div class="ob-section-label">{{ $t("pages.orderbook.priceTierLabel") }}</div>
          <div class="sub-tab-container">
            <button
              v-for="(p, i) in priceTiers"
              :key="'sellp' + i"
              class="sub-tab-btn"
              :class="{ active: sellTier === i }"
              @click="setSellTier(i)"
            >
              {{ p }}
            </button>
          </div>

          <div class="data-row ob-depth-row">
            <span class="data-lbl">{{ $t("pages.orderbook.sell.yourDepth") }}</span>
            <span class="data-val" style="color: var(--amber)">{{ sellDepth }}</span>
          </div>

          <div class="ob-selectall-row">
            <label class="ob-selectall">
              <input type="checkbox" class="ob-checkbox-amber" :checked="sellPageAllChecked" @change="toggleSellAll($event.target.checked)" />
              {{ $t("pages.orderbook.selectAll") }}
            </label>
          </div>

          <div class="order-list">
            <label v-for="o in sellOrders" :key="o.orderId.toString()" class="order-item user-owned">
              <input
                type="checkbox"
                class="order-checkbox amber-check"
                :checked="inSellCart(o.orderId)"
                @change="toggleSell(o, $event.target.checked)"
              />
              <div class="order-details-left">
                <div class="order-id">#{{ orderSeq(o.orderId) }}</div>
                <div class="order-sub" style="color: var(--amber)">{{ fmtTs(o.timestampList) }}</div>
              </div>
              <div class="order-assets-right">
                <div class="asset-line-primary">{{ fmtInt(o.amount) }} vBARKX</div>
                <div class="asset-line">{{ fmtInt(o.payment) }} BARKX</div>
              </div>
            </label>
            <div v-if="sellOrders.length === 0" class="ob-empty">{{ $t("pages.orderbook.sell.noActive") }}</div>
          </div>

          <div class="pagination">
            <button class="page-btn amber-btn" :disabled="sellPage <= 1" @click="sellPrev">&#10094;</button>
            <span class="ob-page-info">{{ sellPage }} / {{ sellTotalPages }}</span>
            <button class="page-btn amber-btn" :disabled="!sellHasMore" @click="sellNext">&#10095;</button>
          </div>

          <div class="ob-cart-box">
            <div class="ob-cart-title">{{ $t("pages.orderbook.sell.revokeCartTitle") }}</div>
            <div class="data-row ob-cart-row">
              <span class="data-lbl">{{ $t("pages.orderbook.sell.totalRevoke") }}</span>
              <span class="data-val" style="color: var(--amber); font-size: 16px">{{ fmtInt(sellTotalRevoke) }} vBARKX</span>
            </div>
          </div>

          <button class="btn-submit amber" style="margin-top: 16px" :disabled="sellCartCount === 0" @click="doRevoke">
            {{ $t("pages.orderbook.sell.revokeAction") }}
          </button>
        </div>
      </div>

      <!-- ───────────── Recent Deals ───────────── -->
      <div class="collapsible-card">
        <div class="collapsible-header" @click="toggleDeals">
          <span style="display: flex; align-items: center; gap: 8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            {{ $t("pages.orderbook.deals.title") }}
          </span>
          <span class="chevron" :class="{ up: dealsOpen }">▼</span>
        </div>
        <div class="collapsible-content" :class="{ show: dealsOpen }">
          <div class="sub-tab-container" style="margin-bottom: 16px">
            <button class="sub-tab-btn" :class="{ active: dealsTab === 'purchase' }" @click="dealsTab = 'purchase'">
              {{ $t("pages.orderbook.deals.purchase") }}
            </button>
            <button class="sub-tab-btn" :class="{ active: dealsTab === 'sale' }" @click="dealsTab = 'sale'">
              {{ $t("pages.orderbook.deals.sale") }}
            </button>
          </div>

          <div class="ob-deals-list">
            <template v-if="dealsTab === 'purchase'">
              <div v-for="d in purchaseDeals" :key="'pd' + d.orderId.toString()" class="data-row" style="padding: 10px 0">
                <div>
                  <div class="ob-deal-tag" style="color: var(--green)">{{ $t("pages.orderbook.deals.bought") }}</div>
                  <div class="ob-deal-time">{{ fmtTs(d.timestampEnd) }}</div>
                </div>
                <div style="text-align: right">
                  <div class="data-val" style="font-size: 14px">{{ fmtInt(d.amount) }} vBARKX</div>
                  <div class="ob-deal-sub">{{ $t("pages.orderbook.deals.paid") }}: {{ fmtInt(d.payment) }} BARKX</div>
                </div>
              </div>
              <div v-if="purchaseDeals.length === 0" class="ob-empty">{{ $t("pages.orderbook.deals.none") }}</div>
            </template>
            <template v-else>
              <div v-for="d in saleDeals" :key="'sd' + d.orderId.toString()" class="data-row" style="padding: 10px 0">
                <div>
                  <div class="ob-deal-tag" style="color: var(--purple)">{{ $t("pages.orderbook.deals.sold") }}</div>
                  <div class="ob-deal-time">{{ fmtTs(d.timestampEnd) }}</div>
                </div>
                <div style="text-align: right">
                  <div class="data-val" style="font-size: 14px">{{ fmtInt(d.amount) }} vBARKX</div>
                  <div class="ob-deal-sub">{{ $t("pages.orderbook.deals.earned") }}: {{ fmtInt(d.payment) }} BARKX</div>
                </div>
              </div>
              <div v-if="saleDeals.length === 0" class="ob-empty">{{ $t("pages.orderbook.deals.none") }}</div>
            </template>
          </div>
        </div>
      </div>
    </template>
  </MiningShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { maxUint256 } from "viem";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import MiningShell from "@/components/mining/MiningShell.vue";
import ApprovalActionGroup from "@/components/mining/ApprovalActionGroup.vue";
import { useMainStore } from "@/store";
import { useApproval } from "@/composables/useApproval";
import { useNotice } from "@/composables/useNotice";
import { useOrderbook } from "@/composables/useOrderbook";
import { getPublicClient } from "@/composables/useContracts";
import { BarkXAbi, VBARKXAbi } from "@/abi";
import { ORDERBOOK_CONFIG, PRICE_TIERS, AMOUNT_TIERS, PAGE_SIZE, FEE_DENOM } from "@/contracts/orderbookConfig";
import { formatTokenAmount, shortenAddress } from "@/utils/format";

const { t } = useI18n({ useScope: "global" });
const store = useMainStore();
const { account } = storeToRefs(store);
const { ensureErc20Approval } = useApproval();
const { showNotice } = useNotice();
const ob = useOrderbook();

const priceTiers = PRICE_TIERS;
const amountTiers = AMOUNT_TIERS;

const activeTab = ref("buy");
const feeRateRaw = ref(0n);

// ── Buy state ──
const buyTier = ref(0);
const buyOrders = ref([]);
const buyDepthRaw = ref(0n);
const buyPage = ref(1);
const buyTotalPages = ref(1);
const buyHasMore = ref(false);
const buyNextCursor = ref(0n);
const buyCursors = ref([0n]); // cursors[page-1] -> start cursor for that page
const buyCart = ref({});

// ── Sell state ──
const sellTier = ref(0);
const sellOrders = ref([]);
const sellDepthRaw = ref(0n);
const sellPage = ref(1);
const sellTotalPages = ref(1);
const sellHasMore = ref(false);
const sellNextCursor = ref(0n);
const sellCursors = ref([0n]);
const sellCart = ref({});

// ── Place order ──
const placePrice = ref(0);
const placeAmount = ref(0);
const walletVbarkxRaw = ref(0n);
const walletBarkxRaw = ref(0n);

// ── Recent deals ──
const dealsOpen = ref(false);
const dealsTab = ref("purchase");
const purchaseDeals = ref([]);
const saleDeals = ref([]);

// ── helpers ──
const WEI = 10n ** 18n;
function big(v) { try { return BigInt(v ?? 0); } catch { return 0n; } }
function fmtInt(wei) { return formatTokenAmount(wei ?? 0n, 18, 0); }
function shorten(a) { return a ? shortenAddress(a, 4) : "—"; }
// per-tier sequence decoded from orderId = (tier+1)<<128 | seq
function orderSeq(id) { return (BigInt(id) & ((1n << 128n) - 1n)).toString(); }
function fmtTs(sec) {
  const d = new Date(Number(sec) * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── display computeds ──
const buyDepth = computed(() => `${fmtInt(buyDepthRaw.value)} vBARKX`);
const sellDepth = computed(() => `${fmtInt(sellDepthRaw.value)} vBARKX`);
const walletVbarkx = computed(() => fmtInt(walletVbarkxRaw.value));

const buyCartList = computed(() => Object.values(buyCart.value));
const buyCartCount = computed(() => buyCartList.value.length);
const buyTotalDemand = computed(() => buyCartList.value.reduce((a, c) => a + big(c.amount), 0n));
const buyTotalPayment = computed(() => buyCartList.value.reduce((a, c) => a + big(c.payment), 0n));
const buyFee = computed(() => (buyTotalDemand.value * feeRateRaw.value) / FEE_DENOM);
// feeRate scale: 10000 == 1% (so percent = feeRate / 10000). Trim trailing zeros.
const feePct = computed(() => String(parseFloat((Number(feeRateRaw.value) / 10000).toFixed(4))));
const buyInsufficientBalance = computed(() => buyCartCount.value > 0 && walletBarkxRaw.value < buyTotalPayment.value);
const buyActionDisabled = computed(() => buyCartCount.value === 0 || buyInsufficientBalance.value);
const buyActionLabel = computed(() =>
  buyInsufficientBalance.value ? t("pages.orderbook.buy.insufficientBalance") : t("pages.orderbook.buy.action"),
);

const sellCartList = computed(() => Object.values(sellCart.value));
const sellCartCount = computed(() => sellCartList.value.length);
const sellTotalRevoke = computed(() => sellCartList.value.reduce((a, c) => a + big(c.amount), 0n));

const placeAmountWei = computed(() => big(AMOUNT_TIERS[placeAmount.value]) * WEI);
const placeEstimate = computed(() => (placeAmountWei.value * (BigInt(placePrice.value) + 5n)) / 10n);
function amountTierDisabled(i) { return big(AMOUNT_TIERS[i]) * WEI > walletVbarkxRaw.value; }
const placeActionDisabled = computed(() => placeAmountWei.value <= 0n || placeAmountWei.value > walletVbarkxRaw.value);

// ── cart toggles ──
function inBuyCart(id) { return Object.prototype.hasOwnProperty.call(buyCart.value, id.toString()); }
function toggleBuy(o, checked) {
  const m = { ...buyCart.value };
  const k = o.orderId.toString();
  if (checked) m[k] = { orderId: o.orderId, amount: o.amount, payment: o.payment };
  else delete m[k];
  buyCart.value = m;
}
const buyPageAllChecked = computed(() => buyOrders.value.length > 0 && buyOrders.value.every((o) => inBuyCart(o.orderId)));
function toggleBuyAll(checked) {
  const m = { ...buyCart.value };
  for (const o of buyOrders.value) {
    const k = o.orderId.toString();
    if (checked) m[k] = { orderId: o.orderId, amount: o.amount, payment: o.payment };
    else delete m[k];
  }
  buyCart.value = m;
}
function inSellCart(id) { return Object.prototype.hasOwnProperty.call(sellCart.value, id.toString()); }
function toggleSell(o, checked) {
  const m = { ...sellCart.value };
  const k = o.orderId.toString();
  if (checked) m[k] = { orderId: o.orderId, amount: o.amount };
  else delete m[k];
  sellCart.value = m;
}
const sellPageAllChecked = computed(() => sellOrders.value.length > 0 && sellOrders.value.every((o) => inSellCart(o.orderId)));
function toggleSellAll(checked) {
  const m = { ...sellCart.value };
  for (const o of sellOrders.value) {
    const k = o.orderId.toString();
    if (checked) m[k] = { orderId: o.orderId, amount: o.amount };
    else delete m[k];
  }
  sellCart.value = m;
}

// ── data loading ──
async function loadFee() { try { feeRateRaw.value = await ob.feeRate(); } catch (e) { /* keep last */ } }
async function loadWallet() {
  if (!account.value) return;
  try {
    const [v, b] = await Promise.all([
      getPublicClient().readContract({ address: ORDERBOOK_CONFIG.vbarkx, abi: VBARKXAbi, functionName: "balanceOf", args: [account.value] }),
      getPublicClient().readContract({ address: ORDERBOOK_CONFIG.barkx, abi: BarkXAbi, functionName: "balanceOf", args: [account.value] }),
    ]);
    walletVbarkxRaw.value = v;
    walletBarkxRaw.value = b;
  } catch (e) { walletVbarkxRaw.value = 0n; walletBarkxRaw.value = 0n; }
}
async function loadBuy() {
  if (!account.value) return;
  try {
    const cursor = buyCursors.value[buyPage.value - 1] ?? 0n;
    const [resp, depth, count] = await Promise.all([
      ob.getGlobalPending(buyTier.value, cursor, PAGE_SIZE),
      ob.marketDepth(buyTier.value),
      ob.globalPendingCount(buyTier.value),
    ]);
    buyOrders.value = resp.rows;
    buyHasMore.value = resp.hasMore;
    buyNextCursor.value = resp.nextCursor;
    buyDepthRaw.value = depth;
    buyTotalPages.value = Math.max(1, Math.ceil(Number(count) / PAGE_SIZE));
  } catch (e) { console.error("[orderbook] loadBuy", e); buyOrders.value = []; }
}
async function loadSell() {
  if (!account.value) return;
  try {
    const cursor = sellCursors.value[sellPage.value - 1] ?? 0n;
    const [resp, depth, count] = await Promise.all([
      ob.getUserPending(account.value, sellTier.value, cursor, PAGE_SIZE),
      ob.userDepth(account.value, sellTier.value),
      ob.userPendingCount(account.value, sellTier.value),
    ]);
    sellOrders.value = resp.rows;
    sellHasMore.value = resp.hasMore;
    sellNextCursor.value = resp.nextCursor;
    sellDepthRaw.value = depth;
    sellTotalPages.value = Math.max(1, Math.ceil(Number(count) / PAGE_SIZE));
  } catch (e) { console.error("[orderbook] loadSell", e); sellOrders.value = []; }
}
async function loadDeals() {
  if (!account.value) return;
  try {
    const [buys, sales] = await Promise.all([
      ob.getUserPurchases(account.value, 0, PAGE_SIZE),
      ob.getUserSales(account.value, 0, PAGE_SIZE),
    ]);
    purchaseDeals.value = buys;
    saleDeals.value = sales;
  } catch (e) { console.error("[orderbook] loadDeals", e); }
}

// ── tier / page navigation ──
function setBuyTier(i) { buyTier.value = i; buyPage.value = 1; buyCursors.value = [0n]; loadBuy(); }
function buyNext() { if (buyHasMore.value) { buyCursors.value[buyPage.value] = buyNextCursor.value; buyPage.value += 1; loadBuy(); } }
function buyPrev() { if (buyPage.value > 1) { buyPage.value -= 1; loadBuy(); } }
function setSellTier(i) { sellTier.value = i; sellPage.value = 1; sellCursors.value = [0n]; loadSell(); }
function sellNext() { if (sellHasMore.value) { sellCursors.value[sellPage.value] = sellNextCursor.value; sellPage.value += 1; loadSell(); } }
function sellPrev() { if (sellPage.value > 1) { sellPage.value -= 1; loadSell(); } }

function switchTab(tab) {
  activeTab.value = tab;
  if (tab === "sell") { loadSell(); loadWallet(); } else { loadBuy(); loadWallet(); }
}
function toggleDeals() { dealsOpen.value = !dealsOpen.value; if (dealsOpen.value) loadDeals(); }

// ── approval handlers ──
const buyApprovalReqs = [{ id: "orderbook:barkx", label: "BARKX" }];
const placeApprovalReqs = [{ id: "orderbook:vbarkx", label: "vBARKX" }];
async function checkBarkxApproval() {
  if (!account.value) return false;
  try {
    const a = await getPublicClient().readContract({
      address: ORDERBOOK_CONFIG.barkx, abi: BarkXAbi, functionName: "allowance", args: [account.value, ORDERBOOK_CONFIG.orderbook],
    });
    return a > 0n;
  } catch { return false; }
}
async function approveBarkx() {
  return ensureErc20Approval(ORDERBOOK_CONFIG.barkx, BarkXAbi, ORDERBOOK_CONFIG.orderbook, maxUint256, "BARKX");
}
async function checkVbarkxApproval() {
  if (!account.value) return false;
  try {
    const a = await getPublicClient().readContract({
      address: ORDERBOOK_CONFIG.vbarkx, abi: VBARKXAbi, functionName: "allowance", args: [account.value, ORDERBOOK_CONFIG.orderbook],
    });
    return a > 0n;
  } catch { return false; }
}
async function approveVbarkx() {
  return ensureErc20Approval(ORDERBOOK_CONFIG.vbarkx, VBARKXAbi, ORDERBOOK_CONFIG.orderbook, maxUint256, "vBARKX");
}

// ── error mapping ──
function obErr(e, fallbackKey) {
  const blob = `${e?.shortMessage || ""} ${e?.message || ""} ${e?.details || ""}`;
  if (/RevokeTooEarly/i.test(blob)) return t("pages.orderbook.errors.revokeTooEarly");
  if (/BadOrderStatus|OrderNotFound/i.test(blob)) return t("pages.orderbook.errors.orderUnavailable");
  if (/UserOrderLimit/i.test(blob)) return t("pages.orderbook.errors.orderLimit");
  if (/Paused|UserIsPaused/i.test(blob)) return t("pages.orderbook.errors.paused");
  if (/UserRejected|user rejected|rejected|denied/i.test(blob)) return t("wallet.errors.rejected");
  return t(fallbackKey);
}

// A filled / cancelled / not-found order anywhere in a batch reverts the whole
// tx (the contract is atomic). Used to drop the stale cart selection so the user
// can't keep resubmitting the same dead batch.
function isStaleOrderError(e) {
  const blob = `${e?.shortMessage || ""} ${e?.message || ""} ${e?.details || ""}`;
  return /BadOrderStatus|OrderNotFound/i.test(blob);
}

// ── actions ──
async function doPurchase() {
  const ids = buyCartList.value.map((c) => c.orderId);
  if (!ids.length) return;
  try {
    store.setWalletPendingState({ pending: true, text: t("pages.orderbook.buy.action") });
    await ob.purchase(ids);
    buyCart.value = {};
    await Promise.all([loadBuy(), loadWallet()]);
    showNotice({ outcome: "success", text: t("pages.orderbook.buy.success") });
  } catch (e) {
    showNotice({ outcome: "failure", text: obErr(e, "pages.orderbook.buy.failure") });
    if (isStaleOrderError(e)) buyCart.value = {}; // OB-F-03: don't let users resubmit a dead batch
    await loadBuy();
  } finally { store.clearWalletPendingState(); }
}
async function doList() {
  if (placeActionDisabled.value) return;
  try {
    store.setWalletPendingState({ pending: true, text: t("pages.orderbook.sell.placeAction") });
    await ob.list(placePrice.value, placeAmount.value);
    await Promise.all([loadSell(), loadWallet()]);
    showNotice({ outcome: "success", text: t("pages.orderbook.sell.placeSuccess") });
  } catch (e) {
    showNotice({ outcome: "failure", text: obErr(e, "pages.orderbook.sell.placeFailure") });
  } finally { store.clearWalletPendingState(); }
}
async function doRevoke() {
  const ids = sellCartList.value.map((c) => c.orderId);
  if (!ids.length) return;
  try {
    store.setWalletPendingState({ pending: true, text: t("pages.orderbook.sell.revokeAction") });
    await ob.revoke(ids);
    sellCart.value = {};
    await Promise.all([loadSell(), loadWallet()]);
    showNotice({ outcome: "success", text: t("pages.orderbook.sell.revokeSuccess") });
  } catch (e) {
    showNotice({ outcome: "failure", text: obErr(e, "pages.orderbook.sell.revokeFailure") });
    if (isStaleOrderError(e)) sellCart.value = {}; // OB-F-03: drop stale selection
    await loadSell();
  } finally { store.clearWalletPendingState(); }
}

// ── lifecycle ──
function resetAndLoad() {
  buyPage.value = 1; buyCursors.value = [0n]; buyCart.value = {};
  sellPage.value = 1; sellCursors.value = [0n]; sellCart.value = {};
  loadFee();
  loadBuy();
  loadWallet();
  if (dealsOpen.value) loadDeals();
}
onMounted(() => { if (account.value) resetAndLoad(); });
watch(account, () => { if (account.value) resetAndLoad(); });
</script>

<style lang="less">
/* Scoped to the orderbook page-theme so none of these leak to other pages.
   The prototype uses the global sky-blue tokens (style.css :root), so no token
   overrides are needed — only the orderbook-specific component styles. */
.orderbook-page-theme .ob-section-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
}
.orderbook-page-theme .sub-tab-container {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}
.orderbook-page-theme .sub-tab-btn {
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
  text-align: center;
}
.orderbook-page-theme .sub-tab-btn.active {
  background: rgba(56, 189, 248, 0.15);
  color: var(--cyan);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}
.orderbook-page-theme .ob-depth-row {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px 16px;
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  margin-bottom: 12px;
}
.orderbook-page-theme .ob-selectall-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  margin-bottom: 4px;
}
.orderbook-page-theme .ob-selectall {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}
.orderbook-page-theme .ob-checkbox-cyan {
  margin-right: 8px;
  accent-color: var(--cyan);
  transform: scale(1.2);
}
.orderbook-page-theme .ob-checkbox-amber {
  margin-right: 8px;
  accent-color: var(--amber);
  transform: scale(1.2);
}

/* order list */
.orderbook-page-theme .order-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  min-height: 180px;
  padding-right: 4px;
}
.orderbook-page-theme .order-item {
  display: flex;
  align-items: center;
  padding: 14px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.orderbook-page-theme .order-item:hover {
  border-color: var(--cyan);
  background: rgba(56, 189, 248, 0.02);
}
.orderbook-page-theme .order-item.user-owned:hover {
  border-color: var(--amber);
  background: rgba(245, 158, 11, 0.02);
}
.orderbook-page-theme .order-checkbox {
  margin-right: 14px;
  accent-color: var(--cyan);
  transform: scale(1.3);
  cursor: pointer;
}
.orderbook-page-theme .order-checkbox.amber-check {
  accent-color: var(--amber);
}
.orderbook-page-theme .order-details-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.orderbook-page-theme .order-id {
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}
.orderbook-page-theme .order-status {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}
.orderbook-page-theme .order-sub {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  font-family: "JetBrains Mono", monospace;
}
.orderbook-page-theme .order-assets-right {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.orderbook-page-theme .asset-line {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  font-family: "JetBrains Mono", monospace;
}
.orderbook-page-theme .asset-line-primary {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
  font-family: "JetBrains Mono", monospace;
}
.orderbook-page-theme .ob-empty {
  text-align: center;
  padding: 30px 0;
  color: var(--text-muted);
  font-size: 13px;
}

/* pagination */
.orderbook-page-theme .pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  margin-bottom: 8px;
}
.orderbook-page-theme .page-btn {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 8px;
  color: var(--text-primary);
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}
.orderbook-page-theme .page-btn:hover:not(:disabled) {
  border-color: var(--cyan);
  color: var(--cyan);
  background: rgba(56, 189, 248, 0.1);
}
.orderbook-page-theme .page-btn.amber-btn:hover:not(:disabled) {
  border-color: var(--amber);
  color: var(--amber);
  background: rgba(245, 158, 11, 0.1);
}
.orderbook-page-theme .page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.orderbook-page-theme .ob-page-info {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
  letter-spacing: 1px;
}

/* cart box */
.orderbook-page-theme .ob-cart-box {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 16px;
  margin-top: 20px;
}
.orderbook-page-theme .ob-cart-title {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}
.orderbook-page-theme .ob-cart-row {
  padding: 4px 0;
  border: none;
}

/* place-order selectors */
.orderbook-page-theme .ob-sell-panel {
  background: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
}
.orderbook-page-theme .ob-place-card {
  margin-bottom: 20px;
  border-color: rgba(56, 189, 248, 0.2);
}
.orderbook-page-theme .ob-place-title {
  color: var(--cyan);
  border-bottom-color: rgba(255, 255, 255, 0.05);
  padding-bottom: 8px;
  margin-bottom: 16px;
}
.orderbook-page-theme .ob-active-title {
  color: var(--amber);
  border-bottom-color: rgba(255, 255, 255, 0.05);
  padding-bottom: 8px;
  margin-bottom: 16px;
}
.orderbook-page-theme .grid-price-selectors {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  width: 100%;
}
.orderbook-page-theme .grid-price-selectors .p-btn {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-weight: 600;
  background: rgba(56, 189, 248, 0.05);
  border: 1px solid rgba(56, 189, 248, 0.15);
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.orderbook-page-theme .grid-amount-selectors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.orderbook-page-theme .grid-amount-selectors .p-btn {
  text-align: center;
  padding: 12px 0;
  font-weight: 600;
  font-size: 14px;
  background: rgba(56, 189, 248, 0.05);
  border: 1px solid rgba(56, 189, 248, 0.15);
  color: var(--text-secondary);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.orderbook-page-theme .p-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.3);
}
.orderbook-page-theme .p-btn.active {
  background: rgba(56, 189, 248, 0.2) !important;
  color: var(--cyan) !important;
  border-color: var(--cyan) !important;
  box-shadow: 0 0 12px var(--cyan-glow);
}
.orderbook-page-theme .p-btn-disabled,
.orderbook-page-theme .p-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.orderbook-page-theme .ob-mono {
  font-family: "JetBrains Mono", monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

/* collapsible deals */
.orderbook-page-theme .collapsible-card {
  background: var(--bg-card);
  border: 1px solid var(--border-dark);
  border-radius: 20px;
  margin-top: 16px;
  margin-bottom: 16px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}
.orderbook-page-theme .collapsible-card:hover {
  border-color: var(--border-glow);
}
.orderbook-page-theme .collapsible-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  color: var(--cyan);
  font-size: 16px;
}
.orderbook-page-theme .collapsible-content {
  padding: 0 20px 20px 20px;
  display: none;
}
.orderbook-page-theme .collapsible-content.show {
  display: block;
}
.orderbook-page-theme .chevron {
  transition: transform 0.3s ease;
  display: inline-block;
}
.orderbook-page-theme .chevron.up {
  transform: rotate(180deg);
}
.orderbook-page-theme .ob-deals-list {
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}
.orderbook-page-theme .ob-deal-tag {
  font-size: 13px;
  font-weight: 600;
}
.orderbook-page-theme .ob-deal-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}
.orderbook-page-theme .ob-deal-sub {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
  font-family: "JetBrains Mono", monospace;
}

/* amber action button variant (parity with prototype) */
.orderbook-page-theme .btn-submit.amber {
  background: linear-gradient(135deg, var(--amber) 0%, #d97706 100%);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
}
.orderbook-page-theme .info-box.amber {
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--amber);
}

/* Frozen/disabled action buttons — matches the incubator "Less than 1 BARKX"
   look (grey gradient). Placed last so it overrides .btn-submit.amber when
   disabled. Covers Purchase Selected / Submit Order / Revoke Selected. */
.orderbook-page-theme .btn-submit:disabled,
.orderbook-page-theme .btn-submit[disabled] {
  opacity: 0.5;
  pointer-events: none;
  color: #e2e8f0;
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  box-shadow: none;
}
</style>
