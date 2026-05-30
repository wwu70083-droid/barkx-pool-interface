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

### 用户接口 —— 无鉴权
按地址查询/请求。`convert` 仅按地址签发：签名把对应地址的当日配额绑定为可转，输出的 BARKX 只能进该地址，且合约要求 `msg.sender == user`，故无需用户签名鉴权，第三方代查代请求无收益。

### 管理接口 —— EIP-712 owner 登录（Bearer）

```
Authorization: Bearer base64(JSON{ payload, signature })
```

`payload = { wallet, issuedAt, expiresAt, scope:"admin" }`，用 EIP-712 域签名：

```js
domain = { name: "BarkX-Incubator-Login", version: "1", chainId: 421614, verifyingContract: <INCUBATOR_ADDRESS> }
types  = { Login: [ {name:"wallet",type:"address"},{name:"issuedAt",type:"uint256"},{name:"expiresAt",type:"uint256"},{name:"scope",type:"string"} ] }
```

后端校验签名有效、未过期，且 `wallet == 合约 owner()`。失败：`401 NO_AUTH/BAD_AUTH`、`403 WRONG_SCOPE/NOT_OWNER`。Token 过期或被拒时管理前端跳回登录页。

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
| `normalPending` / `leaderPending` | in-flight：是否有未消费未过期的当日签名（Confirm 按钮显示 "Pending for Relay"） |
| `normalPendingUntil` / `leaderPendingUntil` | 该 in-flight 签名的到期 Unix 秒（前端倒计时 `Pending for Relay (Xs)`），无则 `null` |
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

### POST /incubator/convert/normal · POST /incubator/convert/leader
请求体 `{ "address": "0x..." }`。后端校验（存量≥配额、当日该机制未用、未被暂停、≥1 BARKX、无 in-flight）→ 返回可提交合约 `convert` 的签名：
```json
{ "amount":"800000000000000000000", "nonce":2, "deadline":1780124642,
  "signature":"0x…", "mechanism":"normal" }
```
前端：`incubator.convert(amount, nonce, deadline, signature)`。

错误：`400 BAD_ADDRESS`；`403 USER_SUSPENDED`；`409 ALREADY_CONVERTED_TODAY` / `CONVERSION_PENDING`（in-flight，见 dev_guide F-16）/ `INSUFFICIENT_INJECTION`；`422 QUOTA_BELOW_MIN`；`503 APPROVER_LOCKED`（后端 keystore 未解锁）；`500 SIGN_FAILED`。

---

## 管理接口（admin-interface，均需 Bearer，前缀 `/admin`）

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
- `POST /partners` `{ name, rateLimitPerMinute? }` → `{ ok, id, name, token }`（**明文 token 仅此一次返回**）。

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
| 400 | `BAD_ADDRESS`/`BAD_DATE`/`BAD_VALUE`/`BAD_TIER`/`BAD_DAYS`/`NO_PASSWORD`/`NO_NAME` | 参数错误 |
| 401 | `NO_AUTH`/`BAD_AUTH`/`BAD_PASSWORD` | 鉴权失败 / keystore 密码错 |
| 403 | `WRONG_SCOPE`/`NOT_OWNER`/`USER_SUSPENDED` | 权限不足 / 用户被暂停 |
| 409 | `ALREADY_CONVERTED_TODAY`/`CONVERSION_PENDING`/`INSUFFICIENT_INJECTION` | 当日已转 / in-flight 中 / 存量不足 |
| 422 | `QUOTA_BELOW_MIN` | 配额 < 1 BARKX |
| 503 | `APPROVER_LOCKED`/`NOT_CONFIGURED` | 后端签名 keystore 未解锁 |
| 500 | `PROFILE_FAILED`/`SIGN_FAILED`/`RECOMPUTE_FAILED`/… | 内部错误（带 `message`） |
