# BarkX Incubator — Development Guide (dev_guide.md)

> 本文件由 `incubator-spec.md` + `incubator-user-guide.md` + `opendao_partner_api_integration_guide.md` + 静态原型 `incubator_sample.html` 综合编纂，作为四个组件（合约 / 后端 / 用户前端 / 管理前端）的开发依据。SPEC 与本指南冲突时以 SPEC 为准，本指南记录已解决的歧义与落地决策。

> **配套文档**：合约细节见 [`incubator-contract.md`](incubator-contract.md)；前端↔后端接口见 [`incubator-frontend-api.md`](incubator-frontend-api.md)；踩坑/经验见 [`dev_guide_fix.md`](dev_guide_fix.md)（本指南仅留摘要指向，不展开）；对外 Partner API 规范见 [`incubator_partner_api_integration_guide.md`](incubator_partner_api_integration_guide.md)。
>
> **当前状态（测试网，Arbitrum Sepolia）**：四个组件均已落地、联调通过并部署。
> - 合约 `BarkXIncubator`：`0x7e68A4df996d797ea4230cbAF8789BA42bFD5522`（已注资 BARKX，inject→convert 全链路 smoke 通过；含 36 L2 块冷却防护，详见 [`incubator-contract.md`](incubator-contract.md)）。旧地址 `0x98BB…6Ac4`、`0x3805…CFC4` 已废弃。
> - 后端 `:8021`，convert approver = 独立密钥 `0x29204C012bB48806f3A2bF45591Aa924dA83F9C6`（keystore 见 dev_guide_fix.md F-11）。
> - 用户前端融合进 `barkx-pool-interface` 并以 `--mode development` 构建（testnet 配置，见 F-05）。
> - HTTPS 测试域名经 nginx 反代到位（见 §7 与 F-12）。

## 0. 概览

孵化池（Incubator）以 **1 vBARKX = 1 BARKX** 的固定比例将 vBARKX 转换为 BARKX，运行在 **Arbitrum One**（测试阶段在 **Arbitrum Sepolia, chainId 421614**）。

两套独立机制，配额各自独立、每天每机制各可转换一次：

- **Normal Incubation**：基于 30 天加权平均存量分配当日总配额；当日配额，不滚存。
- **Leader Incubation**：由 OpenDAO Dynamic/Feedback 收益映射出配额；**累加型**，未用则累积，使用时清零。

四个交付物与目标仓库：

| 组件 | 仓库 | 技术栈参考 |
| --- | --- | --- |
| 智能合约 | `barkx-incubator-contract` | `opendao-contract`（Hardhat, Solidity 0.8.26, OZ ^5） |
| 后端 | `barkx-incubator-backend` | `opendao-backend`（Express + TS + better-sqlite3 + ethers v6） |
| 用户前端 | 融合进 `barkx-pool-interface` 的 `main` | 现有生产版 Vue 3 + Vite + viem |
| 管理前端 | `barkx-incubator-admin` | `opendao-admin`（静态 HTML + ethers v6 CDN） |

---

## 1. 已解决的歧义 / 原型问题（重要）

1. **配额更新展示时间 = `00:45 UTC`**。后端实际在 `00:35 UTC` 拉取 OpenDAO 并计算（提前 10 分钟留余量），但用户文档与界面统一显示 `00:45 UTC`。原型 `incubator_sample.html` 的 done-view 写的 “come back tomorrow at **00:20 UTC**” 为原型笔误，**前端改为 00:45 UTC**。
2. **无 DAO 准入门槛**。未注册 OpenDAO 的节点记为 **T0**，权重 1（无加成），仍可使用 Normal Incubation；Leader Incubation 对 T0 配额恒为 0。生产版旧 `incubator.vue` 中的 “access denied / join OpenDAO” 门槛是过时实现，**移除**。新原型也无此门槛。
3. **单一排行榜**。仅 “Incubation Leaderboard”：按**生涯转换得到 BARKX 总量**取前十（读后端）。旧 `incubator.vue` 的双榜（quota + incubation）作废，以新原型为准。
4. **旧 `src/pages/incubator.vue` 整体作废并替换**（用户已确认）。它采用 deposit/withdraw/incubate 旧模型，与当前 Normal/Leader 需求不符。新页面依据 `incubator_sample.html` 重建。
5. **Leader 配额输入数据**（SPEC 最新补充）：`incomeToday` = 当日 Dynamic Reward（OpenDAO 生产已上线）；`feedbackToday` = 当日 Feedback Reward（OpenDAO 生产**尚未上线**，当前请求不到，Partner API 规范与 `incomeToday` 一致）。故现阶段 FeedbackReward 视为 0/null，代码按规范预留。
6. **vBARKX “销毁”**：链上核验确认测试网 vBARKX (`0xb29D…Aa83F`) 是 OZ `ERC20Burnable`，提供 `burnFrom(address,uint256)`。故 `inject` 直接调用 `vbarkxToken.burnFrom(msg.sender, amount)`：经用户授权拉取并销毁，合约**从不持有** vBARKX（符合 SPEC “直接销毁 vBARKX / 无需真正接收 / 不允许提取 vBARKX”）。前端 inject 流程为 approve(vBARKX→孵化合约) → inject。

---

## 2. Tier 映射表（T0–T5，配置项默认值）

原型 modal 表给出的默认配置（百分比取整存储；权重以百分比表示，100 = 1.00x）：

| Tier | 名称 | Node Weight | Dynamic Mapping Eff. | Feedback Mapping Eff. |
| --- | --- | --- | --- | --- |
| T0 | Not Registered | 1.00 (100%) | 0% | 0% |
| T1 | Nova | 1.00 (100%) | 10% | 20% |
| T2 | Voyager | 2.00 (200%) | 20% | 40% |
| T3 | Navigator | 5.00 (500%) | 50% | 60% |
| T4 | Commander | 10.00 (1000%) | 100% | 100% |
| T5 | Stellar Master | 20.00 (2000%) | 300% | 200% |

> 管理前端三张配置表均为 “限定整数百分比” 输入；OpenDAO tier 为 1–5，未注册映射为 T0。

### 配额公式

```
NodeWeightedAvgInjection = NodeAvgInjection * (NodeWeight%/100)
NormalQuota              = NodeWeightedAvgInjection / GlobalWeightedAvgInjection * GlobalQuota
LeaderQuota              = DynamicReward * (DynamicEff%/100) + FeedbackReward * (FeedbackEff%/100)
```

- `NodeAvgInjection` = 该用户 `userInjection` 的 30 日均值。**分母恒为 30**（非用户实际进场天数）：进场不足 30 天的节点，缺失的早期天数按 0 计入，例如进场第 7 天 = 过去 7 个每日存量之和 / 30。新节点权重在头 30 天内逐步爬升。（此处曾有除以实际天数的业务漏洞，已修补，见 dev_guide_fix.md F-01。）
- `GlobalWeightedAvgInjection` = 全体节点 `NodeWeightedAvgInjection` 之和。
- `GlobalQuota` = 管理员设置的当日 Normal 总配额（整数 BARKX）。

---

## 3. 智能合约 `barkx-incubator-contract`

> 合约结构、状态、方法、事件、错误、冷却/ArbSys、部署脚本等**详见 [`incubator-contract.md`](incubator-contract.md)**。本节只留摘要。

`BarkXIncubator`（Solidity 0.8.26 / OZ ^5，chainId 421614，测试网部署 `0x7e68A4df996d797ea4230cbAF8789BA42bFD5522`）：固定 1 vBARKX = 1 BARKX。

- `inject(amount)`：`vbarkxToken.burnFrom` 销毁 vBARKX、记 `userTotalInjection`（合约不持有 vBARKX，见 F-08）。
- `convert(amount, nonce, deadline, sig)`：校验 approver 的 EIP-712 `Convert` 签名（域 `BarkX-Incubator` v1）、防重放、**冷却**、`userInjection >= amount`，输出 BARKX 并记 `userTotalConversion`。合约**不分** normal/leader，机制由后端按签名 `nonce` 归因。
- `userInjection = userTotalInjection - userTotalConversion`（当前可转虚拟存量）。
- 管理（onlyOwner）：`setApprover` / `pause` / `withdraw`（**禁提 vBARKX**）/ `transferOwnership`。
- 代币（测试网）：BARKX `0x457f…3339B0f`、vBARKX `0xb29D…Aa83F`（ERC20Burnable）。owner `0x5bC9…0C2a`；approver 用独立密钥（F-11）。

### 双层防止「监听确认间隙」内重复转换（要点）
1. **合约层冷却（第二道兜底）**：每用户 `lastConvertHeight`，两次 convert 至少间隔 `CONVERT_COOLDOWN_BLOCKS=36` 个 **L2** 块（~9s）> 监听 12 块（~3s）。冷却高度取 **ArbSys L2 块高**（不是 `block.number`＝L1，详见 F-15）；机制无关 → 跨机制也需等 ~9s（可接受）。错误 `ConvertCooldown`，视图 `currentConvertBlock()` / `lastConvertHeight`。
2. **后端层 in-flight 守卫（第一道）**：见 §4「转换签名、in-flight 守卫与 discard」。

---

## 4. 后端 `barkx-incubator-backend`

Express + TypeScript + better-sqlite3 (WAL) + ethers v6，端口 **8021**（区间 8020–8030，禁用 8000–8010），**开发期不用 systemd**。风格贴近 BarkX Pool 后端与 `opendao-backend`。

### 签名解锁
- convert 的 approver 私钥走 keystore，启动后需管理员输入密码解锁方可签名（复用 opendao-backend `auth/keystore.ts` 模式）。approver 为独立密钥（非 owner），测试密码与 keystore 路径见 dev_guide_fix.md F-11。后端每次重启都 locked。

### 定时任务
- `00:35 UTC`：全量拉取 OpenDAO 快照（开发期用 mock fixture，生产切真实 Partner API，见 `opendao_partner_api_integration_guide.md`）。失败重试 5 次；`00:40 UTC` 前仍失败可用旧数据计算，但**管理前端必须报告**。生成两张表：
  - **Normal Quota Table**：仅当日有效。
  - **Leader Quota Table**：累加型；当日 `LeaderQuota` 增加到用户 “未用累积配额”。
- 每日快照每个用户当前 `userInjection`，维护 30 日滑窗以算 `NodeAvgInjection`。
- `00:45 UTC`：生成 Incubator Partner API 快照，保留 7 天。

### 拉取的 OpenDAO 字段
`timeSnapshot, userAddress, tier(1–5), incomeToday(=DynamicReward), feedbackToday(=FeedbackReward, 现不可得→0)`。未在 OpenDAO 出现的用户记为 T0。

### 用户业务流程（与 SPEC 一致）
- **Normal**：前端判存量≥配额 → 请求签名 → 后端校验（存量≥配额、当日 normal 未用、用户未被暂停）→ 预占 nonce、签 `Convert` → 返回 → 用户调合约 `convert` → 监听 `Converted` 确认后，清零该用户当日 normal 配额、`userTotalNormalConversion += amount`。
- **Leader**：同上，配额为 “未用累积配额” 全量；确认后清零该用户 leader 累积配额、`userTotalLeaderConversion += amount`。
- **Inject**：用户调合约 `inject`；监听 `Injected` 更新注入记录（30 日窗）。

> 链上事件监听采用 BarkX 规范：Arbitrum 确认延迟 **12 个块**（`LISTENER_CONFIRMATIONS=12`）。

> 校验铁律：请求转换时虚拟存量必须 ≥ 可用配额；每次转换必清空该机制配额。除非管理员补跑触发重置，否则同一日同一机制不可重复转换。

### 转换签名、in-flight 守卫与 discard
- **签名**：`signConvert` 校验（存量≥配额、当日该机制未用、未被暂停、≥1 BARKX）→ 预占 nonce、签 EIP-712 `Convert`（有效期 `CONVERT_DEADLINE_SEC=60s`）→ 返回 `{amount,nonce,deadline,signature}`。
- **in-flight 守卫（第一道防护）**：签名前若已存在同 (用户, 机制, 当日) 的「未消费且未过期」签名，拒签 `409 CONVERSION_PENDING`。防止监听确认间隙（~12 块/3s）内重复签发导致配额双花。
- **discard / 过期规则**：
  - 成功上链 → 监听 `Converted` 消费该签名（置 `consumed_at`）→ 守卫立即释放。
  - 失败/取消（钱包拒绝、gas 失败、链上 revert）→ 签名**永不被消费**，只能等其 `deadline` 过期（60s）后守卫才释放。
  - **不能提前 discard**：被取消的签名在 `deadline` 前仍是链上有效的 EIP-712 签名，提前再签发第二份会让用户同时持两份有效签名 → 双花。故锁定时长**必须 = 签名链上有效期**；缩短等待只能靠缩短 `CONVERT_DEADLINE_SEC`（已 600→120→60s，再短会让确认慢的合法 convert 过期）。详见 F-16。
- **前端**：profile 返回 `normalPendingUntil/leaderPendingUntil`，Confirm 按钮显示 `Pending for Relay (Xs)` 倒计时，到点自动重新轮询解锁。彻底免等需合约改用每用户顺序 nonce（未做，见 F-16）。

### 用户接口（风格贴近 BarkX Pool 后端）
- `GET /incubator/profile/:address` → `userInjection`(链上), `NodeWeightedAvgInjection`, `NodeWeight`, `NodeShare`(当日配额占比), `GlobalQuota`, `NormalQuota`, `DynamicReward`, `DynamicMappingEfficiency`, `FeedbackReward`, `FeedbackMappingEfficiency`, `LeaderQuota`, `totalUnusedLeaderQuota`, `normalDoneToday`, `leaderDoneToday`。
- `POST /incubator/convert/normal`、`POST /incubator/convert/leader` → 校验后返回 `{ amount, nonce, deadline, signature }`。
- `GET /incubator/leaderboard` → 生涯转换 BARKX 前十。
- `GET /incubator/config` → 三张 tier 表 + GlobalQuota（供前端 modal 展示）。

### Incubator Partner API（被 Data Fusion 等消费）
鉴权 `X-Partner-Token` + `X-Timestamp`（±5min，防重放，限频），复用 opendao-backend partner 中间件模式。每日 `00:45 UTC` 快照，保留 7 天（Data Fusion 在 `01:00 UTC` 拉取）。

- 顶层：`timeSnapshot|timeQuery`, `sumVbarkxInjected`, `sumBarkxConverted`, `GlobalWeightedAvgInjection`, `GlobalQuota`。
- 按用户：`userAddressIncubator`, `blockJoinIncubator`(首次 inject 区块, 默认升序), `userTotalInjection`, `userTotalNormalConversion`, `userTotalLeaderConversion`, 今日 Normal(`NodeWeight,NodeAvgInjection,NodeWeightedAvgInjection,NormalQuota`)、今日 Leader(`DynamicReward,DynamicMappingEfficiency,FeedbackReward,FeedbackMappingEfficiency,LeaderQuota`)。

### 管理接口
- 登录（owner EIP-712，`BarkX-Incubator-Login` 域，scope=admin）。
- 解锁 keystore（`/admin/lock/approver/unlock|lock|status`）。
- Config：`GlobalQuota`(整数 BARKX) / Node Weight T0–T5 / Dynamic T0–T5 / Feedback T0–T5。
- Users 列表。
- Quota：补跑 normal（重拉、覆盖当日 normal 配额、全员重置当日 normal 转换机会）；补跑 leader（重拉、把当日 leader 配额增加到未用累积、全员重置当日 leader 转换机会）；暂停某用户转换权限。
- 拉取失败 / 用旧数据等异常在 dashboard 报告。

---

## 5. 用户前端（融合进 `barkx-pool-interface`）

- **替换** `src/pages/incubator.vue` 为依据 `incubator_sample.html` 的 Normal/Leader 双 Tab 实现，保留原型全部样式呈现，转写为生产版 Vue3 + viem 框架。
- 复用：`useWallet`、`useContracts`、`useApproval`、`useBalances`、`useNotice`、i18n（`useLocale`）。
- 新增 `src/composables/useIncubatorBackend.js`（仿 `useElitePoolBackend.js`，base URL = 新增 env `VITE_BARKX_INCUBATOR_API_BASE_URL`）。
- 新增 ABI `src/abi/BarkXIncubator.json` 并在 `src/abi/index.js` 注册；合约地址用 `VITE_BARKX_INCUBATOR_ADDRESS`（`.env` 已留空位），孵化池的 BARKX/vBARKX 用 SPEC 指定测试网地址（按需新增 env）。
- 导航：在 `src/components/mining/MiningShell.vue` 的 `navItems` 中、`v-pool` 之后加入 `incubator`（Featured Pools 二级菜单，位于 BarkX VIP Pool 下方）。
- i18n：替换 `pages.incubator.*`、`nav.incubator` 键；**最终验收前仅英文**。
- 数值显示按目标精度截断（金额 2 位小数）。
- 关键交互：
  - 统计区按 §2 字段读链上 / 读后端。
  - 预览区 `Amount to Incubate` 严格 = 当前机制配额（Normal=My Quota Today；Leader=Total Unused Leader Quota），只读；`Converted Amount` 严格相等只读；`Injected` 严格 = My Injection。
  - 主按钮 `Incubate to BARKX`：存量 < 应转额 → `Insufficient Injection`（禁用）；应转额 < 1 → `Less than 1 BARKX`（禁用）；否则开 Confirm Incubation modal → 请求后端签名 → 调合约 convert。
  - Inject modal：`Inject vBARKX` 按钮总检测授权，无授权显示 `Approve vBARKX`；钱包余额 < 填写额显示 `Insufficient Balance`（禁用）。
  - 完成态：`Normal/Leader Incubation Completed`，提示次日 00:45 UTC。
  - Info modal：Node Weight / Dynamic Reward Mapping / Feedback Reward Mapping（读后端 config）。
- **不得改动生产版其他功能与样式**（孵化池高度解耦）。测试时仅孵化池功能可用，其他功能取不到数据属正常。

---

## 6. 管理前端 `barkx-incubator-admin`

照搬 `opendao-admin`（静态 HTML + ethers v6 CDN + `admin-common.js` API client + owner EIP-712 登录），改造：

- **Dashboard**：解锁后端（keystore 密码）；展示拉取/计算健康状态与异常报告。
- **Users**：列表/查询。
- **Config**：GlobalQuota（整数）、Node Weight T0–T5、Dynamic Reward Mapping T0–T5、Feedback Reward Mapping T0–T5（整数百分比）。默认值见 §2。
- **Actions**：全局暂停、提币、设置 Approver（owner 钱包签名发交易）。
- **Quota**：补跑 normal、补跑 leader、暂停某用户转换权限。
- 更新 `js/config.js`：backend URL、chainId 421614、合约地址、域名。

---

## 7. 环境 / 端口 / 域名 / 密钥

- RPC：`https://rpc.ankr.com/arbitrum_sepolia/90575d2096156f6b6fdc6f2952dd17ab1f9f17f2dbf2c6c00ef7b1d2228ec6c7`
- 测试 owner：`0x5bC95902F404310020F6673049a89F00d5de0C2a`（私钥在 agent 机器，opendao 开发时自生成；有充足 ETH/BARKX/vBARKX）。多用户测试可自分流代币。
- 端口：8020–8030（禁用 8000–8010）。后端用 8021。
- 测试域名：用户前端 `barkx-pool.westworld.org`（生产 `pool.barkx.xyz`）；后端 `barkx-backend.westworld.org`（生产预计 `incubator.barkai.finance`）；管理前端 `incubator-admin.westworld.org`（生产预计 `incubator-admin.barkai.finance`）。本机端口仅内部互通。

## 8. 仓库结构

- 用户前端代码 + 文档（统一 `docs/`）→ `barkx-pool-interface` 的 `main`。
- 管理前端 → `barkx-incubator-admin`。
- 后端 → `barkx-incubator-backend`。
- 合约 → `barkx-incubator-contract`。

## 9. 开发顺序（本次）

1. 合约：写 + 测 + 部署 Arb Sepolia，记录地址。
2. 后端：配额计算（mock fixture）、EIP-712 签名、监听、Partner API、管理 API。
3. 用户前端：替换 `incubator.vue`，接入真实链上 + 后端。
4. 管理前端：克隆 opendao-admin 改造。

---

## 10. 时间加速调试工具（虚拟时钟，testnet）

Normal Incubation 依赖「30 日均存量」和「每日 00:35 UTC 刷新/重置」，按真实 1 天 = 24 小时无法测试。后端内置**虚拟时钟 day-offset**：整个业务层的「今天」都经由 `util/time.ts` 的 `utcDate()` 取值，设置偏移即可快进天数，无需等真实天数。

### 设计
- 偏移量（整天）持久化在 `system_state.debug.day_offset`，**启动时回灌**——后端重启不会把测试中的模拟日期重置回真实日。
- `nowIso()`（审计时间戳）始终用真实时钟，不受偏移影响。
- 由 `DEBUG_ENDPOINTS` 开关控制（testnet 默认开，生产置 0 关闭）。

### 管理接口（owner 鉴权）
| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/admin/debug/state` | 返回 `{ realDate, dayOffset, effectiveDate }` |
| POST | `/admin/debug/set-offset` `{ days }` | 跳到绝对偏移；**0 = 回到真实今天**（不跑计算） |
| POST | `/admin/debug/advance-day` `{ days, runCompute }` | 前进 N 天，逐天跑每日计算（每天记一笔注入快照、刷新配额、重置当日转换机会、累加 leader 配额） |
| POST | `/admin/debug/backfill-injection` `{ days }` | 为所有已知用户按当前链上 `userInjection` 回填 N 天平铺注入历史，再补跑 Normal——**瞬间得到 30 日均值** |

管理前端 **Debug** 页提供上述按钮 + 时钟状态展示，无需 curl/EIP-712 手签。

### 建议的 Normal Incubation 测试流程
1. 用户 inject vBARKX → 等约 12 个块让监听入账（用户进入 `users` 表）。
2. Debug → **Backfill 30**：瞬间得到 30 日均值与当日配额。
3. Dashboard 用 owner 钱包登录并解锁后端（keystore 密码，见 F-11）。
4. 在用户前端 Incubate。
5. 验证每日重置：Debug → **Advance Day 1**，确认 Normal 面板重新可转换、Leader 未用配额累加。
6. 测试结束 **Set Offset 0** 回到真实日。

> 注意：`backfill-injection` 只对已在 `users` 表的地址生效（即已被监听记录过首次 inject 的用户）；先 inject 并等监听入账，再回填。

