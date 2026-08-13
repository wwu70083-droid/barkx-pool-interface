import { createRouter, createWebHashHistory } from "vue-router";
import DashboardPage from "@/pages/dashboard.vue";
import SwapPage from "@/pages/swap.vue";
import LiquidityPage from "@/pages/liquidity.vue";
import PoolPage from "@/pages/pool.vue";
import EPoolPage from "@/pages/e-pool.vue";
import VPoolPage from "@/pages/v-pool.vue";
import IncubatorPage from "@/pages/incubator.vue";
import OrderbookPage from "@/pages/orderbook.vue";
import NodeBoostPage from "@/pages/node-boost.vue";
import SettingsPage from "@/pages/settings.vue";
import BarkxPoolNoticeTestPage from "@/pages/barkx-pool-notice-test.vue";
import VnPage from "@/pages/vn.vue";

const routes = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardPage,
  },
  {
    path: "/swap",
    name: "swap",
    component: SwapPage,
  },
  {
    path: "/liquidity",
    name: "liquidity",
    component: LiquidityPage,
  },
  {
    path: "/pool",
    name: "pool",
    component: PoolPage,
  },
  {
    path: "/e-pool",
    name: "e-pool",
    component: EPoolPage,
  },
  {
    path: "/v-pool",
    name: "v-pool",
    component: VPoolPage,
  },
  {
    path: "/incubator",
    name: "incubator",
    component: IncubatorPage,
  },
  {
    path: "/orderbook",
    name: "orderbook",
    component: OrderbookPage,
  },
  {
    path: "/node-boost",
    name: "node-boost",
    component: NodeBoostPage,
  },
  {
    path: "/vn",
    name: "vn",
    component: VnPage,
  },
  {
    path: "/settings",
    name: "settings",
    component: SettingsPage,
  },
  {
    path: "/test/barkx-pool-notice",
    name: "barkx-pool-notice-test",
    component: BarkxPoolNoticeTestPage,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return {
      left: 0,
      top: 0,
    };
  },
});

export default router;
