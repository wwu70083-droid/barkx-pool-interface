# BarkX Incubator Spec

孵化池是将 vBARKX 转换为 BARKX 的设施，运行在 Arbitrum One，包含：

1. 一个 incubator 智能合约，会接收和销毁 vBARKX，以及预存 BARKX 用于转换输出。
2. 一个 incubator-backend 后端，主要负责管理转换配额，并为转换请求签名。
3. 一个 incubator-frontend 用户前端，作为一个新的子功能整合在现有 BarkX Pool dApp 中。
4. 一个 incubator-frontend 管理前端，全新搭建。

开发者先通过 `incubator-user-guide.md` 理解孵化池的所有主要业务功能事实，排除矛盾和问题，然后按照本 SPEC 和讨论后的需求细节编纂 `dev_guide.md` 以进行开发。

---

## Incubator User Frontend

### 首要原则

1. 仔细分析静态原型 `incubator_sample.html` 和 `style.css`，拆除静态模拟、接入真实逻辑，同时必须保证原型中定义的所有样式被完好保留和呈现，生成产物 `incubator.html`。
2. 仔细分析生产版本的 BarkX Pool dApp 仓库 `barkx-pool-interface`，将产物 `incubator.html` 转生产版本的框架实现，融合生产版本的所有配套（wallet、approve、toast 等），保持服从和对齐生产版本。
3. 将产物纳入生产版本侧导航菜单位置：Featured Pools/Incubator，位于 BarkX VIP Pool 下方。代码直接融合到仓库 `barkx-pool-interface` 的 main。
4. 确保现有生产版本的其他功能和样式完全不发生改变。（Incubator 业务本身与生产版本其他功能高度解耦）
5. 所有数值在显示时，按预期目标精度截断。
6. 最终验收之前只做英文版界面。

### 页面元素介绍

#### Normal Incubation

* 统计区
    * **My Injection**：用户在合约中的有效存量，读合约 `userInjection`
    * **30-Day Average Weighted**：用户的日均存量加权，读后端 `NodeWeightedAvgInjection`
    * **OpenDAO Node Weight**：用户的当日权重，读后端 `NodeWeight`
    * **Current Quota Share**：用户的当日配额占比，读后端 `NodeShare`
    * **Global Quota Today**：当日转换总配额，读后端 `GlobalQuota`
    * **My Quota Today**：用户的当日配额，读后端 `NormalQuota`
* 预览区
    * **Amount to Incubate**：严格等于 **My Quota Today**，用户不能修改
    * **Injected**：严格等于 **My Injection**
    * **Converted Amount**：严格等于 **Amount to Incubate**，用户不能修改
* 交互 Modal - **Confirm Incubation**
    * 二次确认转换数量
    * Button - **Confirm**：请求后端签名，调用合约
* 信息 Modal - **OpenDAO Node Weight**
    * **Node Weight**：读后端配置表
* 当日转换完成状态

#### Leader Incubation

* 统计区
    * **Dynamic Reward**：用户的动态收益量，读后端 `DynamicReward`
    * **OpenDAO Mapping Efficiency** (Dynamic)：用户的当前动态收益映射效率，读后端 `DynamicMappingEfficiency`
    * **Feedback Reward**：用户的反馈收益量，读后端 `FeedbackReward`
    * **OpenDAO Mapping Efficiency** (Feedback)：用户的当前动态收益映射效率，读后端 `FeedbackMappingEfficiency`
    * **Leader Quota Growth**：用户的当日转换配额，读后端 `LeaderQuota`
    * **Total Unused Leader Quota**：用户的所有累积起来的未用转换配额，包括当日新增的
* 预览区
    * **Amount to Incubate**：严格等于 **Total Unused Leader Quota**，用户不能修改
    * **Injected**：严格等于 **My Injection**
    * **Converted Amount**：严格等于 **Amount to Incubate**，用户不能修改
* 交互 Modal - **Confirm Incubation**
    * 二次确认转换数量
    * Button - **Confirm**：请求后端签名，调用合约
* 信息 Modal - **Dynamic Reward Mapping**
    * **Mapping Efficiency**：读后端配置表
* 信息 Modal - **Feedback Reward Mapping**
    * **Mapping Efficiency**：读后端配置表
* 当日转换完成状态

#### 通用

* Button - **Incubate to BARKX**：打开 **Confirm Incubation** Modal；如果 **My Injection** 小于 **Amount to Incubate**，按钮内容为 **Insufficient Injection**，无法点击
* 交互 Modal - **Inject vBARKX**
    * **Amount to Inject**：用户填写
    * **Balance**：钱包中的 vBARKX 余额
    * Button - **Inject vBARKX**：总是检测地址的代币授权，如果没有授权，按钮内容是 **Approve vBARKX**；如果钱包中的 vBARKX 余额小于 **Amount to Inject**，按钮内容为 **Insufficient Balance**，无法点击
* **Leaderboard**：生涯转换得到 BARKX 数量最多的前十名用户，读后端

## Incubator Smart Contract

合约的 1 vBARKX = 1 BARKX 转换比例是写死的。

已知合约不允许提取 vBARKX，因此合约无需真正接收 vBARKX 存入，在调用时直接销毁 vBARKX，只记录虚拟存量 `userTotalInjection` 的增长。

### 前置资源

两种代币都是 18 位精度的标准 ERC-20，无需特别分析合约代码，直接引用标准 ABI。

* BARKX
    * Arbitrum One 主网地址：`0x55279F3c138521B0395BC8b76d123E94f1d935B2`
    * Arbitrum Sepolia 测试网地址：`0x457fA4A1fCd0600c1Cf8485dD198f580f3339B0f`
* vBARKX
    * Arbitrum One 主网地址：`0x081Ac2F123972a4F36D23cd9e7Be7E3d2Fae2EF8`
    * Arbitrum Sepolia 测试网地址：`0xb29D3368e40DA289694Db5debd37B3dfdb0Aa83F`

### 普通方法

* **convert**：销毁调用者的孵化池 vBARKX 虚拟存量，输出 BARKX，需 approver 签名
* **inject**：消耗调用者的 vBARKX，增加孵化池 vBARKX 虚拟存量

> 注意原子封闭。

### 管理方法

* **setApprover**：信任的后端签名方
* **setPause**：全局 `convert` 和 `inject` 功能暂停
* **withdraw**：管理员取出代币，如 BARKX
* **transferOwnership** 等通用方法

### 查询

* **userInjection** = `userTotalInjection` - `userTotalConversion`
* **userTotalInjection**：用户调用 `inject` 消耗的 vBARKX 生涯总量，完成时写合约
* **userTotalConversion**：用户调用 `convert` 使合约输出的 BARKX 生涯总量，完成时写合约

## Incubator Smart Backend

开发后端前，先分析生产版本的 BarkX Pool dApp 仓库 `BarkX-Pool-Interface` 中实现的接口，推测 BarkX Pool 后端开发规范，让 Incubator 的接口开发尽量贴近生产风格。

> 开发过程中暂不采用 systmed，避免重启服务时频繁 sudo 影响效率。

### 配额计算

转换机制的配额由后端计算。每天 00:35 UTC 从 OpenDAO Partner API 拉取必要数据，然后生成两份配额表，其中：

* Normal Quota Table 只能在当日使用
* Leader Quota Table 是累加型，用户使用后，其个人可用配额清零重置

> 用户文档和界面说每天 00:45 UTC 更新配额，后端实际提前 10 分钟执行，给足余量。

#### 拉取必要数据

已知 OpenDAO 每天在 00:30 UTC 准备好最新快照，故在 00:35 UTC 全量拉取。每天覆盖。

* timeSnapshot
* userAddress
* tier: 1 / 2 / 3 / 4 / 5

> 拉取失败可重试 5 次。如果在 00:40 UTC 之前未成功，可以用旧数据计算，但必须在管理员界面报告。

> 在开发测试时，无需建立真实 OpenDAO 后端，用 mock fixture 即可，上生产版本再切换到真实 API，见 `opendao_partner_api_integration_guide.md`。

### 转换

转换机制的 BARKX 输出方案完全借鉴 `opendao-backend` 的 BARKX 申领方案：合约设置 approver，信任后端 EIP-712 签名。每次重启后端后，需要管理员输入 keystore 密码以解锁后端，才能启用签名。

### 用户业务流程

请求转换时，用户的虚拟存量必须不小于可用配额，每次转换一定清空配额，否则后端校验不通过。

* **Normal Incubation**：前端判断存量不小于配额 -> 用户请求 `convert` 调用 -> 后端校验数量 -> 后端签名 -> 输出 BARKX 并写 `userTotalConversion` -> 后端监听确认当日转换已用并清零 normal 配额
* **Leader Incubation**：前端判断存量不低于配额 -> 用户请求 `convert` 调用 -> 后端校验数量 -> 后端签名 -> 输出 BARKX 并写 `userTotalConversion` -> 后端监听确认当日转换已用并清零 leader 配额
* **Inject**：用户请求 `inject` 调用 -> 用户发送 vBARKX -> 合约销毁 vBARKX 并写 `userTotalInjection`

### Incubator Partner API

借鉴 `opendao-backend` 的 Partner API 方案，由预置 token 鉴权，提供快照和实时数据接口。

每日 00:45 UTC 快照一次，数据保留 7 天。（Data Fusion 在 01:00 UTC 拉取快照）

#### 顶层

* timeSnapshot / timeQuery: 取决于请求方式，二选一
* sumVbarkxInjected: 自启动以来后端记载的 vBARKX 销毁总量
* sumBarkxConverted: 自启动以来后端记载的 BARKX 输出总量
* Today's Global Data
    * GlobalWeightedAvgInjection
    * GlobalQuota

#### 按用户

* userAddressIncubator
* blockJoinIncubator: 若对表排序，首次 inject 的高度就是默认排序字段，最老记录在上
* userTotalInjection
* userTotalNormalConversion：用户消耗 normal 配额换取的 BARKX 生涯总量
* userTotalLeaderConversion：用户消耗 leader 配额换取的 BARKX 生涯总量
* Today's User Normal Incubation Data
    * NodeWeight
    * NodeAvgInjection
    * NodeWeightedAvgInjection
    * NormalQuota
* Today's User Leader Incubation Data
    * DynamicReward
    * DynamicMappingEfficiency
    * FeedbackReward
    * FeedbackMappingEfficiency
    * LeaderQuota

## Incubator Admin Frontend

照搬 `opendao-admin` 前端，改造后使用。

* Dashboard：解锁后端
* Users
* Config：后端参数
    * 设置每日 Normal Global Quota，单位为 BARKX，整数
    * 设置 OpenDAO Node Weight 配置表 T0-T5
    * 设置 Dynamic Reward Mapping 配置表 T0-T5
    * 设置 Feedback Reward Mapping 配置表 T0-T5
* Actions：合约操作
    * 全局暂停
    * 提币
    * 设置 Approver
* Quota：配额管理
    * 计算补跑
    * 暂停某用户转换权限

> 用户在 OpenDAO 中不存在时，记节点等级为 T0。

### 补跑

* 补跑 normal 配额：重新拉 OpenDAO 数据，刷新所有用户的当日 normal 配额，覆盖任何旧的配额，并重置当日补跑机会。
* 补跑 leader 配额：重新拉 OpenDAO 数据，刷新所有用户的当日 leader 配额，增加到其未转换配额中，并重置当日补跑机会。

> 除非管理员补跑导致重置，否则用户绝不可在同一日在同一个转换机制中重复转换。

---

## 测试网私钥

继续使用 0x5bC95902F404310020F6673049a89F00d5de0C2a 作为测试网 owner 处理所有工作。

此地址的私钥在 agent 机器中，是之前开发 opendao 时由 agent 自行生成的。

此地址有充足的测试代币：ETH、BARKX、vBARKX。

若要测试多用户时，agent 可自行分流测试代币到新地址。

## RPC

继续使用 https://rpc.ankr.com/arbitrum_sepolia/90575d2096156f6b6fdc6f2952dd17ab1f9f17f2dbf2c6c00ef7b1d2228ec6c7

## 测试域名

本机所有端口封闭，只有本机内部可相互调用。

禁止使用 8000-8010 端口，建议使用 8020-8030 端口。

* 用户前端 - https://barkx-pool.westworld.org
    * 在生产环境中是 https://pool.barkx.xyz
* 用户后端 - https://barkx-backend.westworld.org
    * 在生产环境中预计是 https://incubator.barkai.finance
* 管理员前端 - https://incubator-admin.westworld.org
    * 在生产环境中预计是 https://incubator-admin.barkai.finance

## 测试配置

在测试时，`incubator.html` 被装配到完整的 `barkx-pool-interface` 中，但只有 `incubator.html` 的功能能正常运行，其他功能访问不到数据，这是正常现象。

只为 `incubator.html` 配置其必须的环境配置即可。