# Incubator 前端接口说明（incubator-frontend-api.md）

> 面向**前端维护者**：归纳 Incubator 业务专用的「用户前端」与「管理前端」与后端通信所需的全部接口。格式参考 `opendao_partner_api_integration_guide.md`，但**这不是 Partner API 文档**（Partner API 是服务器到服务器、token 鉴权，见 `incubator_partner_api_integration_guide.md`）。
>
> 消费方：用户前端 `barkx-pool-interface`（`src/composables/useIncubatorBackend.js` + `src/pages/incubator.vue`）；管理前端 `barkx-incubator-admin`（`js/admin-common.js` + 各页）。

## 通用约定

### Base URL

| 环境 | URL |
|------|-----|
| 生产（预计） | `https://incubator.barkai.finance` |
| 测试 | `https://barkx-backend.westworld.org` |
| 本机 | `http://localhost:8021` |

> 后端为 Express，响应**直接返回 JSON 对象**（无 `{code,message,data}` 包装）。失败返回 `{ code, message? }` + 对应 HTTP 状态码。CORS 由后端 `ALLOWED_ORIGINS` 控制（含用户前端、管理前端域名）。

### 金额 / 精度

- 所有 `*Wei` 字段为 **wei 字符串**（十进制 `string`），`BigInt(value)` 解析，前端按目标精度截断显示。
- 百分比/倍率字段为整数：`*Pct`（如 `nodeWeightPct=500` 表示 5.00×；`dynamicMappingEfficiencyPct=50` 表示 50%）。
- `nodeShare` 为 0..1 的小数（占比）。
- 日期 `YYYY-MM-DD`（UTC，受虚拟时钟影响）；`*PendingUntil`、`deadline` 为 Unix 秒。

---

## 鉴权

### 用户接口 —— convert 需钱包鉴权（审计 #1）
读类接口（profile/leaderboard/config）按地址查询、无鉴权。**convert 需钱包鉴权**：先 `GET /incubator/convert/challenge/:address` 取一次性 challenge，钱包 `personal_sign` 其 `message`，POST 时带 `{address, signature, challengeNonce}`；后端 `verifyMessage` 还原地址必须 == 目标地址、challenge 用后即焚。（曾无鉴权 → 第三方可为他人请求签名并借旧 in-flight 守卫把受害者卡在 `CONVERSION_PENDING`；现已封堵。）

### 管理接口 —— 服务端会话 token（审计 #2）

不再是「可重放、客户端自定寿命的 EIP-712 签名 Bearer」，改为一次性挑战换服务端会话 token：

```
1) GET  /admin/login/challenge/:address          → { nonce, expiresAt }
2) owner 用 EIP-712 域签名 Login(payload 含 nonce)
3) POST /admin/login { payload, signature }       → { token, expiresAt }
4) 后续请求：Authorization: Bearer <token>         （不透明服务端 token，非签名）
   POST /admin/logout 注销
```

```js
domain = { name: "BarkX-Incubator-Login", version: "1", chainId: 421614, verifyingContract: <INCUBATOR_ADDRESS> }
types  = { Login: [ {name:"wallet",type:"address"},{name:"nonce",type:"string"},{name:"issuedAt",type:"uint256"},{name:"expiresAt",type:"uint256"},{name:"scope",type:"string"} ] }
```

`/admin/login` 校验：签名还原 == `wallet`、`wallet == 合约 owner()`、一次性 nonce 未用未过期、`expiresAt-issuedAt ≤ ADMIN_LOGIN_TTL_SEC`、issuedAt 不过旧/不超前，再签发服务端 token（寿命取 `min(expiresAt, issuedAt+TTL)`）。`requireAdmin` 校验该 token（不再每次校验签名），owner 轮换即失效。失败：`400 BAD_REQUEST/BAD_TIMESTAMPS`、`401 BAD_AUTH/BAD_CHALLENGE/TTL_TOO_LONG`、`403 WRONG_SCOPE/NOT_OWNER`。Token 过期/被拒时管理前端跳回登录页。

---

## 用户接口（user-interface）

### GET /incubator/profile/:address
用户前端统计区/预览区/按钮态的唯一数据源（My Injection / Injected 另从合约直接读，不依赖后端）。

**响应 200**（节选关键字段）
```json
{
  "address": "0x...", "date": "2026-06-01",
  "myInjectionWei": "0", "userTotalInjectionWei": "3000000000000000000000",
  "nodeAvgInjectionWei": "0", "nodeWeightPct": 500,
  "nodeWeightedAvgInjectionWei": "0", "globalWeightedAvgInjectionWei": "0",
  "globalQuotaWei": "500000000000000000000000", "normalQuotaWei": "0", "nodeShare": 0,
  "normalDoneToday": false,
  "dynamicRewardWei": "0", "dynamicMappingEfficiencyPct": 0,
  "feedbackRewardWei": "0", "feedbackMappingEfficiencyPct": 0,
  "leaderQuotaGrowthWei": "0", "totalUnusedLeaderQuotaWei": "0", "leaderDoneToday": false,
  "userTotalNormalConversionWei": "0", "userTotalLeaderConversionWei": "0",
  "suspended": false,
  "normalPending": false, "leaderPending": false,
  "normalPendingUntil": null, "leaderPendingUntil": null
}
```

| 字段 | 用途 |
|------|------|
| `myInjectionWei` | My Injection / Injected（前端实际从合约 `userInjection` 读，profile 此值仅备用） |
| `nodeWeightedAvgInjectionWei` | 30-Day Average Weighted |
| `nodeWeightPct` | OpenDAO Node Weight（/100 显示倍率） |
| `nodeShare` | Current Quota Share（×100 显示 %） |
| `globalQuotaWei` / `normalQuotaWei` | Global Quota Today / My Quota Today |
| `normalDoneToday` / `leaderDoneToday` | 当日机制是否已转换（Completed 态） |
| `dynamicRewardWei` / `dynamicMappingEfficiencyPct` | Leader：Dynamic Reward + 映射效率 |
| `feedbackRewardWei` / `feedbackMappingEfficiencyPct` | Leader：Feedback Reward + 映射效率 |
| `leaderQuotaGrowthWei` / `totalUnusedLeaderQuotaWei` | Leader Quota Growth / Total Unused Leader Quota |
| `normalPending` / `leaderPending` | **软提示**：是否有未消费未过期的当日签名（Confirm 按钮显示 "Pending for Relay"）。审计后 in-flight 守卫已移除，此为提示而非硬阻塞——重复提交在链上 revert `BadSeq`，安全 |
| `normalPendingUntil` / `leaderPendingUntil` | 该签名的到期 Unix 秒（前端倒计时 `Pending for Relay (Xs)`），无则 `null` |
| `suspended` | 用户是否被管理员暂停转换 |

错误：`400 BAD_ADDRESS`、`500 PROFILE_FAILED`。

### GET /incubator/config
供 Info Modal（Node Weight / Dynamic / Feedback 映射表）展示。
```json
{ "globalQuotaBarkx": "500000",
  "tiers": [ { "tier":0,"name":"Not Registered","weightPct":100,"dynamicEffPct":0,"feedbackEffPct":0 }, … T1–T5 ] }
```

### GET /incubator/leaderboard
生涯转换 BARKX 前十（地址显示 `0x00...00`、金额整数截断）。
```json
{ "leaderboard": [ { "rank":1, "address":"0x...", "totalConvertedWei":"452100000000000000000000" }, … ] }
```

### GET /incubator/convert/challenge/:address
发一次性钱包鉴权 challenge（审计 #1）。限流 **30 次/分钟/IP**，超限 `429 RATE_LIMITED`。
```json
{ "challengeNonce":"<hex>", "message":"BarkX Incubator convert authorization\nAddress: 0x..\nChallenge: <hex>", "expiresAt":1780124700 }
```
前端用钱包 `personal_sign(message)`，再调下方 convert。

### POST /incubator/convert/normal · POST /incubator/convert/leader
请求体 `{ "address":"0x...", "signature":"0x..", "challengeNonce":"<hex>" }`（`signature` = 钱包对 challenge `message` 的 `personal_sign`）。后端先 `verifyMessage` 校验地址所有权 + 消费 challenge，再校验（存量≥配额、当日该机制未用、未被暂停、≥1 BARKX）→ 读链上 `convertSeq(user)` → 返回可提交合约 `convert` 的签名：
```json
{ "amount":"800000000000000000000", "seq":3, "nonce":2, "deadline":1780124642,
  "signature":"0x…", "mechanism":"normal" }
```
前端：`incubator.convert(amount, seq, nonce, deadline, signature)`。

错误：`400 BAD_ADDRESS`；`401 AUTH_REQUIRED/BAD_SIGNATURE/SIG_MISMATCH/BAD_CHALLENGE`（钱包鉴权失败）；`403 USER_SUSPENDED`；`409 ALREADY_CONVERTED_TODAY` / `INSUFFICIENT_INJECTION`；`422 QUOTA_BELOW_MIN`；`503 APPROVER_LOCKED`（后端 keystore 未解锁）；`500 SIGN_FAILED`。（in-flight 守卫已移除，不再有 `CONVERSION_PENDING`。）

---

## 管理接口（admin-interface，前缀 `/admin`）

### 认证（公开，无需 token）
- `GET /login/challenge/:address` → `{ nonce, expiresAt }`（一次性登录挑战）。限流 **30 次/分钟/IP**，超限 `429 RATE_LIMITED`。
- `POST /login` `{ payload, signature }` → `{ ok, token, expiresAt }`（见上「管理接口 —— 服务端会话 token」）。
- `POST /logout`（带 Bearer）→ `{ ok }`，注销当前会话 token。

> 以下接口均需 `Authorization: Bearer <token>`（服务端会话 token）。

### Dashboard / 解锁
- `GET /dashboard` → `{ lock:{state,unlockedAddress,unlockedAt,…}, approverOnChain, paused, listenerLastBlock, health:{ lastComputeOk, lastComputeError, lastCompute, lastPartnerSnapshot } }`。也用作 token 探活。
- `GET /lock/status` → keystore 状态 `{ configured, state:"locked|unlocked|unconfigured", unlockedAddress, unlockedAt }`。
- `POST /lock/approver/unlock` `{ password }` → `{ ok, address }`；错误 `401 BAD_PASSWORD`、`503 NOT_CONFIGURED`。
- `POST /lock/approver/lock` → `{ ok }`。

### Config
- `GET /config` → 同 `/incubator/config`。
- `POST /config/global-quota` `{ barkx:<int> }` → `{ ok, globalQuotaBarkx }`；`400 BAD_VALUE`。
- `POST /config/tier` `{ tier:0..5, weightPct, dynamicEffPct, feedbackEffPct }`（整数）→ `{ ok }`；`400 BAD_TIER/BAD_VALUE`。

### Users
- `GET /users?q=&limit=&offset=` → `{ total, limit, offset, users:[ { address, tier, suspended, first_inject_block, normal_wei, leader_wei, unused_leader_wei } ] }`。
- `POST /users/:address/suspend` `{ suspended:bool }` → `{ ok, address, suspended }`；`400 BAD_ADDRESS`。

### Quota 补跑
- `POST /quota/recompute/normal` → `{ ok, date, pulledOk, stale, users }`（重拉、覆盖当日 normal、全员重置当日 normal 转换机会）。
- `POST /quota/recompute/leader` → 同上（重拉、当日 leader 配额增加到未用累积、全员重置当日 leader 转换机会）。

### Partners（Partner API token 管理）
- `GET /partners` → `{ partners:[ {id,name,enabled,rate_limit_per_minute,ip_allowlist,created_at,last_used_at} ] }`。
- `POST /partners` `{ name, rateLimitPerMinute?, ipAllowlist? }` → `{ ok, id, name, token }`（**明文 token 仅此一次返回**）。
- `POST /partners/:id/enable` `{ enabled:bool }` → `{ ok, id, enabled }`（禁用/启用，切断泄露 token 无需改库）。
- `POST /partners/:id/rotate` → `{ ok, id, token }`（换新明文 token，旧 token 立即失效）。
- `POST /partners/:id/ip-allowlist` `{ ipAllowlist }` → `{ ok, id, ipAllowlist }`（逗号分隔，空串清空）。

### Debug 虚拟时钟（testnet，`DEBUG_ENDPOINTS=1` 时启用）
- `GET /debug/state` → `{ realDate, dayOffset, effectiveDate }`。
- `POST /debug/set-offset` `{ days:<int> }` → `{ ok, dayOffset, effectiveDate }`（0=回到真实今天）。
- `POST /debug/advance-day` `{ days?, runCompute? }` → `{ ok, dayOffset, effectiveDate, computed }`（前进 N 天，逐天跑计算）。
- `POST /debug/backfill-injection` `{ days? }` → `{ ok, users, days, effectiveDate }`（回填 N 天注入历史 + 补跑 Normal，瞬间得 30 日均值）。

详见 dev_guide.md「§10 时间加速调试工具」。

---

## 通用错误码

| HTTP | code | 含义 |
|------|------|------|
| 400 | `BAD_ADDRESS`/`BAD_DATE`/`BAD_VALUE`/`BAD_TIER`/`BAD_DAYS`/`BAD_ID`/`NO_PASSWORD`/`NO_NAME`/`BAD_REQUEST` | 参数错误 |
| 401 | `NO_AUTH`/`BAD_AUTH`/`BAD_CHALLENGE`/`TTL_TOO_LONG`/`AUTH_REQUIRED`/`BAD_SIGNATURE`/`SIG_MISMATCH`/`BAD_PASSWORD` | 鉴权失败（会话/钱包挑战）/ keystore 密码错 |
| 403 | `WRONG_SCOPE`/`NOT_OWNER`/`USER_SUSPENDED` | 权限不足 / 用户被暂停 |
| 409 | `ALREADY_CONVERTED_TODAY`/`INSUFFICIENT_INJECTION` | 当日已转 / 存量不足（in-flight 守卫已移除，无 `CONVERSION_PENDING`） |
| 422 | `QUOTA_BELOW_MIN` | 配额 < 1 BARKX |
| 429 | `RATE_LIMITED` | challenge 端点超过 30 次/分钟/IP（审计 #1） |
| 503 | `APPROVER_LOCKED`/`NOT_CONFIGURED` | 后端签名 keystore 未解锁 |
| 500 | `PROFILE_FAILED`/`SIGN_FAILED`/`RECOMPUTE_FAILED`/… | 内部错误（带 `message`） |
