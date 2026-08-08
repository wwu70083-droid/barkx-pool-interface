# Dev Task

本 prod-v2 分支是 barkx-pool-interface 的最新生产代码，仓库的其他分支皆已过时。务必从 prod-v2 作为基线展开迭代。

---

本任务需要解决的问题：新用户进入 BarkX Pool 主矿池的学习成本过高，步骤散落在多个界面，亟需一个集成界面，以待办事项的形式一站式引导所有必要操作的执行。

本任务不涉及 Elite Pool、VIP Pool 等其他业务。

## 业务流程分析

新用户进场典型流程：

- 1. Deposit Fresh VN
    - Approve VN
    - Approve USDT [Main Pool]
    - Deposit VN + USDT
- 2. Buy BARKX
    - Approve USDT [Uniswap]
    - Swap USDT for BARKX
- 3. Mint LP
    - Approve BARKX
    - Add BARKX + USDT Liquidity
- 4. Deposit More LP
    - Approve LP
    - Deposit LP

我们的目标是在 UI 上提供一个大型用户入场 modal，在这个 modal 上，以串行引导用户完成所有操作。

该 modal 打开时，会逐步检测用户有哪些事需要做。

## 构造入场面板

### Approve

首要环节是授权代币，一站式串行解决。

授权 VN 为 ERC-1155 TokenID = 1，授权 ERC-20 数量全部为 Unlimited，与散落各处的授权按钮一致。

- Approve VN
- Approve USDT [Main Pool]
- Approve USDT [Uniswap]
- Approve BARKX
- Approve LP

上述 5 个授权：

- 依次自动检测，有谁没授权，就高亮。
- 注意 USDT 要在两个合约分别授权，不可混淆。
- 用户无需依次点击，总是只能先点击最上面一个没授权的项目，之后钱包连续弹出。

toast 复用 Approve 那套。

### Deposit Fresh VN

必须在完成整个 Approve 步骤集合后才能解锁这一步，防止用户没法存 VN。

这一步将钱包中的新鲜 VN 尽可能存入主矿池（ModeA）。

基于合约业务，存入 VN 的同时会赠予 BARKX，而 BARKX 必须按当前兑换率配对 USDT，那么 VN 存入数量受限于 USDT 余额。

能存多少 VN，就显示存多少，渲染一个 Deposit VN + USDT 按钮。

若可存量为 0 VN，按钮不可点，按优先度显示其中一个原因：

- VN 余额为 0 无可存，作为首要原因。
- USDT 数量不足以支持 1 VN 存入，作为次要原因。

提示锁定时长为 360 天。

toast 复用 Deposit VN 那套。

### Buy BARKX

必须在完成 Deposit Fresh VN 步骤后才能解锁这一步，防止用户没存 VN（LP 额度空间为 0）。

这一步先自动分析用户钱包资产和空闲 LP 额度空间的关系，判断要不要买入更多 BARKX 以筹备 LP 铸造。

此策略直接参考 https://github.com/wwu70083-droid/barkx-harness-backend/blob/mainnet/srv/pack/skill.main_pool_best_plan_for_new_node.md 构造一个脚本。

脚本的分析结果应是：是否需要购买 BARKX，如果需要，那么需花费多少 USDT 购买 BARKX？

如果需要购买，则直接提供购买按钮，所花费的 USDT 数量由脚本预填写，用户不可改。

若满足如下条件之一，则购买按钮渲染为 Skip，按优先度显示其中一个原因：

- 脚本的分析结果是不购买，作为首要原因。
- 用户已利用超过 90% 的 LP 额度空间，作为次要原因。

toast 复用 Swap 那套。

### Mint LP

必须在完成或跳过 Buy BARKX 步骤后才能解锁这一步。

这一步利用钱包资产尽可能铸造 LP，但目标铸造量不超过铸造需求。

铸造需求 = 空闲 LP 额度空间 - 钱包中的闲置 LP

如果铸造需求大于等于 0.000001 LP，就渲染添加流动性按钮，并显示将提交的 BARKX 和 USDT 数量。

如果铸造需求小于 0.000001 LP（包括负值），就渲染 Skip 按钮。

toast 复用 Add Liquidity 那套。

### Deposit More LP

必须在完成或跳过 Mint LP 步骤后才能解锁这一步。

这一步利用钱包中的 LP 尽可能追加存入主矿池（ModeB）。

存入量受限于空闲 LP 额度空间。

如果可存量大于等于 0.000001 LP，就渲染存入 LP 按钮，并显示将提交的 LP 数量。

如果可存量小于 0.000001 LP，就渲染 Finish 按钮。

提示锁定时长为 24 小时。

toast 复用 Deposit More LP 那套。

## 自动化环节

用户每次打开 modal 都会从第一步（Approve 检测）开始。

- 如果检测到所有 Approve 存在，就在 1 秒后自动进入下一步。
- 如果检测到主矿池 vnStake > 0，就在 1 秒后自动进入下一步。

从 Buy BARKX 开始不再自动切步骤。

## 防误触

只能通过点击右上角 x 关闭 modal，不能支持点击空白处关闭 modal。

## i18n

先只做英文，等验收后再做其他翻译。

## modal 入口位置

在仪表盘 dashboard 页面上，BARKX Market Cap 和 My BarkX Pool 面板之间，加一个新的矩形长按钮：BarkX Pool Quick Start。

## 此 modal 入口隐藏的情况

用户已利用超过 90% 的 LP 额度空间。

---

## 实现

从 prod-v2 开新分支，切到 VPS-2 测试网配置，部署到当前 https://barkx-pool.westworld.org

---

## 经验

建议充分利用我们在开发 BarkX Assistant 时的经验，用好 https://github.com/wwu70083-droid/barkx-harness-backend/blob/mainnet/srv/pack/barkxpool.md 所提供的主矿池知识，完善这个新手 modal。

