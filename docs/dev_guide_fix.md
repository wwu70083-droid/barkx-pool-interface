# BarkX Incubator — 踩坑记录 (dev_guide_fix.md)

> 开发/测试中有价值的踩坑经验集中在此。`dev_guide.md` 只保留摘要指向，避免被拖成流水账。每条：现象 → 原因 → 修复/规避。

---

## F-01 NodeAvgInjection 分母必须恒为 30（业务漏洞）

- **现象**：早期实现 `sum / rows.length`，新用户进场不足 30 天时分母取实际天数。
- **原因**：分母小 → 新用户优势巨大。极端情况下，用户第 1 天注入巨量 vBARKX，次日刷新点分母仅为 1，可套取超大配额。这是业务漏洞。
- **修复**：`nodeAvgInjection` 分母固定为 `AVG_WINDOW_DAYS = 30n`，缺失的早期天数按 0 计入（`barkx-incubator-backend/src/quota/compute.ts`）。新节点权重在头 30 天内逐步爬升。已用 7 天回填验证：30 BARKX 注入 → 均值 7.00（=30×7/30），而非 30.00。

## F-02 前端 toast 必须用 `{ outcome, text }` 对象

- **现象**：Approve 取消后 toast 空白。
- **原因**：`useNotice().showNotice()` 期望 `{ outcome: "success"|"failure", text }`，早期误传纯字符串。
- **修复**：统一对象形式，文案见 SPEC。生产其它页（如 `e-pool.vue`）用 `getErrorText(error, fallbackKey)` 编排失败文案，Incubator 仅需 success/`Failed.`。Approve 取消保持静默（生产一致行为）。

## F-03 Inject MAX 精度

- **现象**：点 MAX 后金额多了 18 个 0。
- **原因**：把钱包余额的原始 wei 字符串塞入输入框，`safeParseUnits` 又乘了 1e18。
- **修复**：MAX 用 `formatUnits(rawWei, 18)` 转人类可读再填入。

## F-04 Approve 优先（approve-first）按钮风格

- **现象**：早期实现点 Inject 后才弹 Approve，不符生产风格。
- **原因**：未复用生产组件。
- **修复**：用 `components/mining/ApprovalActionGroup.vue`，它前置检测授权、**未知/出错默认按未授权处理**，未授权时按钮直接显示 `Approve vBARKX`，授权后才显示动作按钮。

## F-05 前端 testnet 构建必须 `--mode development`

- **现象**：默认 `npm run build`（production 模式）产物地址错乱、孵化池接口失效。
- **原因**：production/pre 模式下 `isMainnetMode` 为真 → 切换到主网地址 + 网关前缀 `/incubator`，且 `.env.production` 未含 incubator 环境变量。
- **规避**：testnet 一律 `npm run build -- --mode development`（产物仍是生产级优化，但取 `.env.development` 的 testnet 配置：测试网地址、直连后端、无网关前缀）。

## F-06 rollup 原生模块 npm bug

- **现象**：`npm run build` 报 `Cannot find module @rollup/rollup-linux-x64-gnu`。
- **原因**：npm optional deps 已知 bug。
- **规避**：先 `npm i @rollup/rollup-linux-x64-gnu --no-save`。

## F-07 `docs/` 被 gitignore

- **现象**：`git add docs/xxx.md` 被忽略。
- **原因**：`barkx-pool-interface/.gitignore` 含 `/docs`（历史文档经网页上传绕过忽略）。
- **规避**：文档用 `git add -f docs/xxx.md`。

## F-08 vBARKX 是 ERC20Burnable

- **结论**：链上核验测试网 vBARKX (`0xb29D…Aa83F`) 含 `burnFrom`（OZ ERC20Burnable）。合约 `inject` 直接 `vbarkxToken.burnFrom(msg.sender, amount)`，经授权拉取并销毁，合约不持有 vBARKX。前端 inject 流程 = approve(vBARKX→孵化合约) → inject。

## F-09 Arbitrum 监听确认延迟 12 个块

- **现象**：刚上链的 `Converted` 第一轮扫描没被归因。
- **原因**：确认延迟过小，事件落在确认窗口内。
- **规避**：`LISTENER_CONFIRMATIONS=12`（BarkX 规范）。后端按签名 `nonce` 归因 normal/leader；直接调用（无对应 convert_sig）不归因，仅告警。

## F-10 测试代币地址配置

- **现象**：Settings · Smart Contracts 显示的 BARKX/vBARKX 非 SPEC 地址。
- **原因**：`Settings` 读全局 `BARKX_CONTRACTS`（`VITE_BARKX_TOKEN_ADDRESS`/`VITE_BARKX_VBARKX_ADDRESS`），原值是前序开发遗留测试代币。
- **修复**：改为 SPEC 测试网地址（BARKX `0x457f…`、vBARKX `0xb29D…`）。孵化池另有独立 `incubatorConfig.js`（同 SPEC 地址，解耦）。

## F-11 approver 密钥与解锁

- **结论**：convert approver 用**独立**密钥 `0x2920…`（非 owner，后端用它签名，避免后端被攻破升级到 owner 权限）。keystore 在 `~/barkx-incubator-keys/approver.keystore.json`，测试密码 `12345678`。后端每次重启都 **locked**，需在管理前端 Dashboard 用 owner 钱包登录后输入密码解锁。

## F-12 nginx serving 不可影响 data-fusion

- **结论**：三个 barkx 域名走 `/etc/nginx/sites-available/barkx-incubator.conf`（仅这三名，**不触碰** data-fusion/observer/opendao）。静态产物部署到 `/var/www`，每次前端重构后需 `sudo bash /home/soleste/setup-barkx-nginx.sh` 重新 rsync。脚本 `nginx -t` 通过才 reload，配置出错不会拖垮 nginx。Agent 无免密 sudo，sudo 步骤交用户执行。

## F-13 时间加速调试的虚拟时钟持久化

- **结论**：虚拟时钟 day-offset 持久化在 `system_state.debug.day_offset`，启动时回灌；否则后端重启会把测试中的模拟日期重置回真实日。详见 dev_guide.md「时间加速调试工具」。

## F-14 监听确认间隙内的重复转换（双层防护）

- **现象/风险**：convert 上链确认后，后端监听需等 12 个块（~3s）才把当日机制标记 done。在此间隙，若用户存量仍覆盖配额，可向后端再要一份签名并再次上链——配额双花。
- **修复（两道防线）**：
  1. **后端 in-flight 守卫**：`signConvert` 拒绝为同一 (用户,机制,当日) 签发「未消费且未过期」的第二份签名（`409 CONVERSION_PENDING`）；失败/取消的尝试在签名 `deadline`（CONVERT_DEADLINE_SEC=600s）后自动释放。已验证：第一次 200，第二次 409。
  2. **合约层冷却**：每用户 `lastConvertHeight`，两次 convert 至少间隔 `CONVERT_COOLDOWN_BLOCKS=36` 块（~9s）> 监听 12 块（~3s）。即便后端误签，合约兜底。错误 `ConvertCooldown`。副作用：跨机制也需等 ~9s（合约不分机制），可接受。
- **前端**：上链确认后乐观切「Completed」态，不等监听；安全性由上述两道防线保证。
- **⚠️ 审计后已重构（见 F-17）**：后端 in-flight 守卫（防线 1）**已移除**，改由合约**每用户 `seq` 顺序 nonce** 防双花；冷却（防线 2）降为 8 块轻量阈值。本条记录历史设计。

## F-15 Arbitrum `block.number` 是 L1 块高（冷却防护重大 bug）

- **现象**：合约 convert 冷却 `CONVERT_COOLDOWN_BLOCKS=36` 本意 ~9s（36×0.25s L2），实测约 7 分钟。虚拟时钟快速测试时 convert 被合约 revert（冷却未满），叠加后端 in-flight 守卫，用户重试报 `409 CONVERSION_PENDING`。
- **证据**：用户 `Converted` 事件在 L2 块 272147712，但 `lastConvertHeight`（同一 tx 由 `block.number` 写入）= 10952539（L1 Sepolia 块高，且早于合约部署块）。
- **原因**：Arbitrum 上 Solidity `block.number` 返回 **L1 块高**（~12s/块），不是 L2 块高（~0.25s/块）。36×L1块 ≈ 36×12s ≈ 7 分钟。
- **修复**：冷却改用 ArbSys 预编译 `IArbSys(0x64).arbBlockNumber()` 取 **L2 块高**。用低级 `staticcall` + 返回长度判断，无此预编译的本地/其它链回退 `block.number`（本地测试照常通过；`try/catch` 不能捕获返回数据解码失败，故用低级 staticcall）。36 L2 块 = ~9s，符合 SPEC。需重新部署合约。
- **连带**：`CONVERT_DEADLINE_SEC` 600→120s，缩短「失败/取消 convert 后 in-flight 守卫锁定重试」的窗口。锁定时长必须 = 签名链上有效期（≥有效期才能防双花），故只能靠缩短有效期来缩短锁定，120s 对正常钱包确认足够。
- **⚠️ 审计后**：L2 块高（ArbSys）的修复保留；但 `CONVERT_COOLDOWN_BLOCKS` 已 **36→8**（~2s）——双花防护移交合约 `seq`，冷却仅作防刷，顺带消除 36 块带来的跨机制连续转换等待。见 F-17。

## F-16 取消 convert 后的 in-flight 等待与 discard

- **现象**：用户在钱包取消 convert 后刷新重进，Confirm 按钮仍为 Pending，且不知等多久。
- **discard 机制**：被取消的签名永不会被监听消费（无链上事件），只能等其 `deadline` 过期后 in-flight 守卫才释放。**不能提前释放**——该签名在 deadline 前仍是链上有效的 EIP-712 签名，提前再签发第二份会让用户同时持两份有效签名 → 双花。故锁定时长必须 = 签名链上有效期。
- **改进**：`CONVERT_DEADLINE_SEC` 120→60s（在不破坏防护前提下把最坏等待减半；再短会让确认慢的正常用户的合法 convert 过期）。后端 profile 增 `normalPendingUntil/leaderPendingUntil`，前端 Confirm 按钮显示 `Pending for Relay (Xs)` 实时倒计时，到点自动重新轮询解锁。
- **彻底消除等待的方案（✅ 审计时已实施，见 F-17）**：合约改用每用户**顺序 `seq`**（convert 校验 `seq==convertSeq[user]` 并自增），取消后用新 seq 重新签发也安全（两份共享旧 seq，链上只能成功一份，另一份 `BadSeq`）。in-flight 守卫与 `CONVERSION_PENDING` 随之移除；profile 的 `pending*` 字段降为软提示。

## F-17 安全审计修复（重新部署）

- **背景**：安全团队静态审计（`audit_report.md`）后，对全部 5 findings + 3 观察做修复，并**重新部署合约**至 `0x1884F88B212f7d946600193cb53307992Da32E77`、后端清库重置。
- **#1 convert（叠加修复）**：
  1. 链下钱包鉴权——`GET /incubator/convert/challenge/:address` 发一次性 nonce，钱包 `personal_sign`，POST 带 `{address,signature,challengeNonce}`，`verifyMessage` 还原地址必须 == 目标地址。封堵「替他人请求签名卡死受害者」。
  2. 合约每用户 `seq` 顺序 nonce（F-16 根治）——新 typehash `Convert(user,amount,seq,nonce,deadline)`，`seq==convertSeq[user]` 校验后自增。**in-flight 守卫移除**，无 `CONVERSION_PENDING`。`nonce` 仍为后端审计行号 + 机制归因。
- **#2 admin 登录**：可重放、客户端自定寿命的 EIP-712 bearer → **服务端会话 token**。一次性登录 nonce（嵌入 Login payload）、服务端强制 `expiresAt-issuedAt ≤ ADMIN_LOGIN_TTL_SEC`、拒过旧 issuedAt；`requireAdmin` 校验不透明 token（owner 轮换即失效）。新表 `challenge`/`admin_session`。
- **#3 admin actions**：切链失败硬报错；按钮仅 `chain==421614 && 钱包==owner()` 启用；发交易前即时复检链。
- **#4 trust proxy**：`app.set('trust proxy', true)` → env `TRUST_PROXY`（默认 0；nginx 单跳设 1），防 `X-Forwarded-For` 伪造绕过 partner IP 白名单。
- **#5 admin ethers**：公共 CDN → 自托管 `vendor/ethers-6.13.4.umd.min.js`。
- **附加**：cooldown 36→8（见 F-15）；partner token 生命周期（enable/disable/rotate/ip-allowlist）补全；`OPENDAO_MOCK`/`DEBUG_ENDPOINTS` 默认值不改、靠 `prod_modify.md §7` 清单。
- **DB schema**：迁移 `0003_security_hardening.sql` —— `convert_sig.chain_seq` + `challenge` + `admin_session`。清库后由 migrate 重建。
- **测试**：合约 `hardhat test` 23 用例全过（含 `BadSeq`、同 seq 互斥）；后端 `tsc` 通过 + challenge 逻辑功能测试；前端 dev 构建通过。

## F-18 第二轮审计的低风险加固

第二轮审计（`audit_report.md` / `audit_report_cn.md`）确认高/中危已全修，仅剩 2 条 Low + 观察，均已处理：

- **#1 challenge 接口可被刷写撑表**：
  - `auth/challenge.ts`：`issueChallenge` 改为**先删同 `(scope,address)` 旧记录再插**（每地址每 scope 至多 1 条未完成 challenge，re-request 自动作废旧的）；新增 `gcChallenges()` 清过期/已用。
  - `util/rateLimit.ts`：内存定窗限流中间件，按客户端 IP；两个公开 challenge 端点（`/incubator/convert/challenge/:address`、`/admin/login/challenge/:address`）限 **30 次/分钟/IP**，超限 `429 RATE_LIMITED`。
  - `server.ts`：boot 起每 5 分钟 GC（过期/已用 challenge + 过期 `admin_session`），并在启动时跑一次。
- **#2 owner 轮换失效有 10s 缓存延迟**：`auth/adminAuth.ts` `OWNER_TTL_MS` 10000→**2000**，紧急轮换失效窗口缩 5 倍；缓存仅用于合并请求突发（admin 流量低）。
- **观察：auth 路径缺自动化测试**：新增 `src/__tests__/auth.test.ts`（7 用例）覆盖 challenge 单次消费/过期/错地址/re-issue 作废、admin 登录 happy path + 会话 token、TTL 过长/issuedAt 过旧/坏 challenge/非 owner 拒绝、requireAdmin 缺/未知 token 拒绝。`node --test` 全过（用 `setCachedOwnerForTesting` 绕过链）。
- **观察：测试网默认值**：`OPENDAO_MOCK`/`DEBUG_ENDPOINTS` 仍按 `prod_modify.md §7` 在上线时关闭，未改默认（既定决策）。

> 已修复（测试维护，与本轮审计独立）：`src/__tests__/quota.test.ts` 原期望值绑定的是**旧版 mock fixture**（OWNER 0x5bC9… 为 T3、奖励 100/200，及旧 hardhat 地址 T1/T5）。当前 `fixtures/opendao-mock.json` 已整体换成 10 个集群测试地址（不含 OWNER），曾导致 2 个 leader 用例读不到 `leader_balance` 行而失败（`compute.ts` 逻辑无误，纯属夹具漂移）。已按当前 fixture 重写：改用 fixture 内地址 A1(T1)/A3(T3)/A5(T5)，通过 `users.total_injection_wei` 驱动注入（`nodeAvg = total/30`）使 normal 数学保持洁净（global weighted 155000），leader 期望值按当前奖励重算（A3=75、A1=1、A5=350 BARKX）。`npm test` 现 9/9 全绿。
