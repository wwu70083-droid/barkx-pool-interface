# vBARKX-BARKX 订单簿式交易市场开发规约

订单簿是用户出售和购买 vBARKX 的设施，生产运行在 Arbitrum One，测试网在 Arbitrum Sepolia，包含：

1. 智能合约，托管 vBARKX 销售订单，接受成交调用，记录成交历史。
2. 用户前端，作为一个新的子功能整合在现有 BarkX Pool dApp 中。

先分析讨论本 SPEC，排除不确定项，再编纂 `dev_guide.md` 以进行开发。

---

## Orderbook User Frontend

1. 仔细分析静态原型 `orderbook_sample.html` 和它的设计说明 `orderbook_sample_gui_design.md`，理解功能，计划拆除静态模拟、接入真实逻辑，同时必须保证原型中定义的所有样式、组件、文案被完好保留和呈现，生成产物 `orderbook.html`。
2. 配套的 `style.css` 位于生产仓库 `barkx-pool-interface` 的 `main` 分支，可直接读取。
3. 仔细分析生产版本的 BarkX Pool dApp 仓库 `barkx-pool-interface`，将产物 `orderbook.html` 转生产版本的框架实现，融合生产版本的所有配套（wallet、approve、toast 等），保持服从和对齐生产版本。相关转框架经验可从仓库 `barkx-pool-interface` 的 `main-pre-prod-archive` 分支 `docs` 目录 `dev_guide.md` 参考（上次开发 Incubator 的经验）。
4. 将产物纳入生产版本侧导航菜单位置：Featured Pools/Orderbook，位于 Incubator 下方。原型的导航菜单若有缺漏，以生产版本的为准。
5. 确保现有生产版本的其他功能和样式完全不发生改变。（Orderbook 业务本身与生产版本其他功能高度解耦）
6. 最终验收之前只做英文版界面。

## Orderbook Smart Contract

**本次开发完全不依赖后端。GUI 设计文档已明确了功能需求。智能合约需要被周全地设计，以满足前端直接走链上查询、分页、排序、执行的需求。**

### 原子封闭保证

- 卖方提交订单时，vBARKX 被暂存到合约内；买方购买时，在前端挑选 orderId 再调合约，所支付的 BARKX 立即转入卖方钱包地址，订单内托管的 vBARKX 立即从合约转入买方钱包地址，手续费发送到黑洞地址。
- 批量购买时，一笔事务内的订单可能来自多个卖方，因此 BARKX 支持分流传递；vBARKX 购得后归一个买方，合并一个转账；vBARKX 手续费归黑洞地址，合并一个转账。
- 批量撤单时，一笔事务内的 vBARKX 归一个卖方，合并一个转账。
- 不存在批量挂单，一笔事务只能创建一个挂单。
- 批量操作订单时，若有任意 orderId 状态不对，整笔交易回滚。
- 合约不限制一笔操作多少订单。若一笔内批量操作过多导致超 gas limit，合约报错自动回滚。
- 在同一个区块内发生多笔挂单、撤单、成交、费率调整时，不能乱。
- 挂单只能成交或被撤单，不能直接修改订单。

### 全局限制

* userOrderCountLimit：一个卖方地址最多只允许同时挂 100 个活跃订单，被撤单和成交的不占空间。参数 100 是硬编码，不可改。
* listingDuration：一个订单被提交后，至少等待 12 个区块（~3s）才能撤单，防止频繁操作。参数 12 是硬编码，不可改。

### 合约结构体内容需求包括但不限于

* config
    * priceTier 价格档位，是区分订单的顶层分类，所有价格档位是硬编码，不可改
        * priceTierA = 0.5
        * priceTierB = 0.6
        * priceTierC = 0.7
        * priceTierD = 0.8
        * priceTierE = 0.9
        * priceTierF = 1.0
    * amountTier 数量档位，让所有订单的价值标准化，所有数量档位是硬编码，不可改
        * amountTier1 = 100
        * amountTier2 = 1000
        * amountTier3 = 10000
        * amountTier4 = 100000
    * feeRate 买方承担的成交费率，成交时销毁 vBARKX，初始化配置为 0.5%，管理员可按 bps 调整，10000 表示 1%，调整立即影响之后的成交，但不影响过去的成交
* order
    * orderId 订单编号，建议以 priceTier + 自增编号组合构造，不可复用，每个 priceTier 内独立自增，为排序做基础
    * status 订单状态，0 = pending / 1 = completed / 2 = revoked
    * sellerAddress 挂单立刻写
    * buyerAddress 成交后才写
    * timestamp 发生操作才写
        * list
        * revoke
        * purchase
    * blockHeight 发生操作才写
        * list
        * revoke
        * purchase
    * price 本单报价，按 BARKX 计价，挂单立刻写，从 priceTier 写入
    * amount 本单数量，按 vBARKX 计量，挂单立刻写，从 amount 写入
    * payment = price * amount 本单要求多少 BARKX 支付，挂单立刻写
    * feeRate 本单成交费率，成交后才写
    * fee = feeRate * amount 成交时被销毁的 vBARKX 数量
* pauseState 管理员决定三种动作的操作许可，在一个方法内传三种，按 true / false 调整立即生效
    * global 全局方法
        * list
        * revoke
        * purchase
    * user 针对单用户方法，以地址传参
        * list
        * revoke
        * purchase

### 基础查询

* 用 orderId 精确查一个订单，吐全部内容
* 基于 priceTier 分类
    * 不指定用户直接查询待成交订单
    * 查一个用户地址下的待成交订单
* 无需 priceTier 分类
    * 查一个用户地址下的已成交买单
    * 查一个用户地址下的已成交卖单

#### 订单分页和排序

若 GUI 原型与本节排序规则有冲突的，以本文档为准。具体排序标准和方案由 Coding Agent 决策，做到在没有后端支持的条件下最优化查询性能，并且尽量避免触发公共 RPC 限制。

- 查全局待成交订单：按 priceTier 区分类别，类别内分页，每页最多 20 条，按挂单时间或 orderId 从旧到新排序。
    - orderId, status, timestampList, sellerAddress, price, amount, payment
- 查单用户待成交订单：按 priceTier 区分类别，类别内分页，每页最多 20 条，按挂单时间或 orderId 从旧到新排序。
    - orderId, status, timestampList, sellerAddress, price, amount, payment
- 查单用户买入成交历史：只读自身作为 buyer 的，分页不区分 priceTier 类别，每页最多 20 条，前端默认只查第一页，按成交时间从新到旧排序。
    - orderId, status, sellerAddress, buyerAddress, timestampPurchase, amount, payment
- 查单用户卖出成交历史：只读自身作为 seller 的，分页不区分 priceTier 类别，每页最多 20 条，前端默认只查第一页，按成交时间从新到旧排序。
    - orderId, status, sellerAddress, buyerAddress, timestampPurchase, amount, payment

### 合约能直接帮算结果用于查询

* marketDepth 查指定 priceTier 内全局待成交挂单总规模，用 vBARKX 计量，发生挂单或撤单时写
    * priceTierA
    * priceTierB
    * priceTierC
    * priceTierD
    * priceTierE
    * priceTierF
* userDepth 查指定 priceTier 内单用户待成交挂单总规模，用 vBARKX 计量，发生挂单或撤单时写
    * priceTierA
    * priceTierB
    * priceTierC
    * priceTierD
    * priceTierE
    * priceTierF
* totalDeal 查指定 priceTier 内全局已成交订单总规模，用 vBARKX 计量，发生成交时写
    * priceTierA
    * priceTierB
    * priceTierC
    * priceTierD
    * priceTierE
    * priceTierF

## Orderbook Admin

没有管理员面板。开发期间暂时由 Coding Agent 协助管理合约。若部署生产，将 verify 合约，由 owner 在 arbiscan.io 直接 write contract 管理。

---

## 测试网私钥

继续使用 0x5bC95902F404310020F6673049a89F00d5de0C2a 作为测试网 owner 处理所有工作。

此地址的私钥在 agent 机器中，是之前开发 opendao 时由 agent 自行生成的。

此地址有充足的测试代币：ETH、BARKX、vBARKX。

* BARKX：0x871c85Fe9dB01886588CAAC6efD62F0Ae205b8b3
* vBARKX：0x81cbf135fA72BC3455EbAfF45C58EBe82E6bABe5

若要测试多用户时，agent 可自行分流测试代币到新地址。原先的测试网私钥矩阵均可用。

## RPC

开发时继续使用 https://rpc.ankr.com/arbitrum_sepolia/90575d2096156f6b6fdc6f2952dd17ab1f9f17f2dbf2c6c00ef7b1d2228ec6c7

但在测试查询性能时，要切换到公共 RPC 验证效果。

## 测试配置

在测试时，Orderbook 功能被装配到完整的 `barkx-pool-interface` 中，本机试验场的其他模块都照常运行。

- barkx-mainpool-backend 8022 https://barkx-mpool.westworld.org
- barkx-elitepool-backend 8023 https://barkx-epool.westworld.org
- barkx-vippool-backend 8024 https://barkx-vpool.westworld.org
- barkx-incubator-backend 8021 https://barkx-incubator.westworld.org
- barkx-pool-interface 静态 https://barkx-pool.westworld.org

## 仓库结构

* 为仓库 `barkx-pool-interface` 新开 `orderbook` 分支。
* 合约代码推送到仓库 `barkx-orderbook-contract`。
* 可按需使用测试仓库 `barkx-testnet-deploy`。