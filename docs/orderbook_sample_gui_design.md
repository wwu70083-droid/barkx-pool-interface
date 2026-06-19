# vBARKX-BARKX 交易市场界面

> 原型已实现在 orderbook_sample.html，此文档已归档，仅供理解功能设计。

一句话概括本页面的业务目标：提供一个极简的链上订单簿式交易市场，卖方创建包含特定数量 vBARKX 的挂单，买方按固定报价支付 BARKX，从而实现 vBARKX 和 BARKX 的单向交易。在经济模型中，基准价格是 1 vBARKX = 1 BARKX，但 vBARKX 没有 AMM 交易池。本订单簿允许 vBARKX 持有者折价出售 vBARKX，换取有 AMM 流动性的 BARKX，而买方可以获得套利空间。

* 大标题：Orderbook
* 小标题：vBARKX-BARKX Market
* 导航位置：Featured Pools → Orderbook（Incubator 下方）
* 主选项卡：Buy vBARKX、Sell vBARKX
* 底部折叠面板：Recent Deals

## Buy vBARKX

这个 tab 负责展现当前市场中的 vBARKX 销售订单。

* 提示文案：先选择您的理想价格，然后从列表中勾选订单，支付 BARKX 以购买 vBARKX。买方承担 0.5% 的成交手续费。
* 列表
    * Price Tier：|0.5|0.6|0.7|0.8|0.9|1.0|    // 用 sub tabs 选择报价档位
    * Depth：X,XXX vBARKX    // 当前报价档位上的全网 vBARKX 委托总量
    * Select All on Current Page    // 勾选当前页面上的所有订单
    * 订单条目：单选框、卖方地址缩略、X,XXX vBARKX（委托量）、X,XXX BARKX（订单价值）
    * 翻页器：< 1 / 5 >    // 单页最多 20 条订单
* 购物车：汇总从各价位和各列表页勾选的订单
    * Selected to Purchase (Aggregated)
    * Total Demand：X,XXX vBARKX
    * Total Payment：X,XXX BARKX
    * Fee：X,XXX vBARKX    // 成交时合约销毁 Total Demand 的 0.5%，买方实际到账 99.5%
    * Purchase Selected 按钮    // 先显示 Approve BARKX，点击后变为 Purchase Selected，以向开发人员展示必要的代币授权流程

## Sell vBARKX

这个 tab 负责展现本用户挂出的 vBARKX 销售订单，以及发起新订单。

### 本用户的挂单列表

* 提示文案：先选择价格，然后从列表中勾选订单，以撤销订单。撤单不收取手续费。
* 列表
    * Price Tier：|0.5|0.6|0.7|0.8|0.9|1.0|    // 用 sub tabs 选择报价档位
    * Depth：X,XXX vBARKX    // 当前报价档位上的自有 vBARKX 委托总量
    * Select All on Current Page    // 勾选当前页面上的所有订单
    * 订单条目：单选框、YYYY/MM/DD HH:MM（挂单上链时间）、X,XXX vBARKX（委托量）、X,XXX BARKX（订单价值）
    * 翻页器：< 1 / 2 >    // 单页最多 20 条订单
* 撤单车：汇总从各价位和各列表页勾选的订单
    * Selected to Revoke (Aggregated)
    * Total Revoke：X,XXX vBARKX
    * Revoke Selected 按钮

### 发起新订单面板

* 提示文案：先指定一个价格，然后决定拟出售的 vBARKX 数量。提交订单后，您的 vBARKX 会被托管在智能合约内等待成交。挂单不收取手续费。
* 报价选择：|0.5|0.6|0.7|0.8|0.9|1.0| BARKX per vBARKX     // 卖方只能从智能合约规定的六个报价档位中选择一个挂单，六个报价选择框在一行排列
* 数量选择：|100|1,000|10,000|100,000| vBARKX     // 卖方只能从智能合约规定的四种挂单规模中选择一个挂单，四个数量选择框按照 2x2 分两行排列
* 价值预估：X,XXX BARKX
* 钱包余额：X,XXX vBARKX     // 无法选中比钱包余额大的数量选择框
* Submit Order 按钮     // 先显示 Approve vBARKX，点击后变为 Submit Order，以向开发人员展示必要的代币授权流程

## Recent Deals

内置两个 sub tabs，展示本用户的近期成交记录。

### Purchase

展示最近 20 条买入成交记录，按成交上链时间，最新的在上。字段：

* 成交上链时间：YYYY/MM/DD HH:MM
* 买入：X,XXX vBARKX    // 成交手续费扣费前的值
* 支付：X,XXX BARKX

### Sale

展示最近 20 条卖出成交记录，按成交上链时间，最新的在上。字段：

* 成交上链时间：YYYY/MM/DD HH:MM
* 卖出：X,XXX vBARKX
* 收入：X,XXX BARKX

> 基于智能合约限定的报价档位和数量档位，整个市场的交易量和交易额均不存在小数，因此 vBARKX 和 BARKX 的数量显示统一按照整数截断处理。