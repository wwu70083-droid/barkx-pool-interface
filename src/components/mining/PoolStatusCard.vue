<template>
  <CollapsibleCard :title="$t('components.collapsibleCard.poolStatus')">
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
        <path d="M3 3v18h18"></path>
        <path d="M18 17V9"></path>
        <path d="M13 17V5"></path>
        <path d="M8 17v-3"></path>
      </svg>
    </template>

    <div class="stats-grid" style="margin-bottom: 0">
      <div class="stat-card">
        <div class="stat-card-title">{{ $t("components.poolStatus.totalLiquidity") }}</div>
        <div class="stat-card-value" style="color: var(--text-primary)">
          {{ totalLiquidityDisplay }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">{{ $t("components.poolStatus.lpMinted") }}</div>
        <div class="stat-card-value" style="color: var(--text-primary)">
          {{ lpMintedDisplay }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">{{ $t("components.poolStatus.barkxReserve") }}</div>
        <div class="stat-card-value" style="color: var(--cyan)">{{ barkxReserveDisplay }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">{{ $t("components.poolStatus.usdtReserve") }}</div>
        <div class="stat-card-value" style="color: var(--green)">{{ usdtReserveDisplay }}</div>
      </div>
    </div>
  </CollapsibleCard>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { formatUnits } from "viem";
import CollapsibleCard from "@/components/mining/CollapsibleCard.vue";
import { useUniswapV2 } from "@/composables/useUniswapV2";
import { truncateFixed } from "@/utils/format";

const uniswap = useUniswapV2();

onMounted(() => {
  if (!uniswap.pair.value) {
    uniswap.fetchPair();
  }
});

function formatCompact(value, decimals = 18) {
  const num = Number(formatUnits(value, decimals));
  if (num >= 1_000_000) return truncateFixed(num / 1_000_000, 2) + "M";
  if (num >= 1_000) return truncateFixed(num / 1_000, 2) + "K";
  return truncateFixed(num, 2);
}

const barkxReserveDisplay = computed(() => {
  if (uniswap.barkxReserve.value === 0n) return "—";
  return formatCompact(uniswap.barkxReserve.value);
});

const usdtReserveDisplay = computed(() => {
  if (uniswap.usdtReserve.value === 0n) return "—";
  return formatCompact(uniswap.usdtReserve.value, 6);
});

const lpMintedDisplay = computed(() => {
  if (uniswap.totalSupply.value === 0n) return "—";
  const num = Number(formatUnits(uniswap.totalSupply.value, 18));
  if (num >= 1_000_000) return truncateFixed(num / 1_000_000, 2) + "M";
  if (num >= 1_000) return truncateFixed(num / 1_000, 2) + "K";
  if (num >= 1) return truncateFixed(num, 2);
  if (num >= 0.0001) return truncateFixed(num, 6);
  return num.toExponential(2);
});

const totalLiquidityDisplay = computed(() => {
  if (uniswap.usdtReserve.value === 0n) return "—";
  // Total liquidity ≈ 2 * USDT reserve (since pool is 50/50 by value)
  const usdtVal = Number(formatUnits(uniswap.usdtReserve.value, 6));
  const total = usdtVal * 2;
  if (total >= 1_000_000) return "$" + truncateFixed(total / 1_000_000, 2) + "M";
  if (total >= 1_000) return "$" + truncateFixed(total / 1_000, 2) + "K";
  return "$" + truncateFixed(total, 2);
});
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-dark);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.stat-card-title {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.stat-card-value {
  font-family: "JetBrains Mono", monospace;
  font-size: 18px;
  font-weight: 600;
}
</style>
