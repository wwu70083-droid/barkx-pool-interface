# Partner API 集成指南

## 通用约定

### 金额

所有金额字段均为 **wei 字符串**（十进制 `string`，不是 `number`）。

```
1 BARKX = 1000000000000000000 (10^18 wei)
```

在 JS/TS 中使用 `BigInt(value)` 解析。

### 地址

统一小写 `0x` + 40 位 hex，输入大小写不敏感，服务端会自动归一化。

### 无值

用 `null` 表示，不会返回 `undefined` 或空字符串。

### 时间

- 时间戳：ISO 8601 UTC 格式（`2026-05-11T01:00:00.123Z`）
- 快照日期：`YYYY-MM-DD` 字符串

---

## 鉴权

所有 Partner API 使用统一的 Token + Timestamp 鉴权，与矿池管理员鉴权完全隔离。

### 请求 Header

| Header | 值 | 说明 |
|--------|-----|------|
| `X-Partner-Token` | 预注册的 API 密钥明文 | 由矿池管理员注册后分发 |
| `X-Timestamp` | 当前 Unix 秒时间戳 | 必须在服务端时间 ±5 分钟内 |

### 调用示例

```bash
curl http://<host>:<port>/partner/main/profile/0x用户地址 \
  -H "X-Partner-Token: your-partner-token" \
  -H "X-Timestamp: $(date +%s)"
```

### 代码示例（TypeScript）

```typescript
import axios from 'axios';

const PARTNER_TOKEN = 'your-partner-token';

async function callPartnerApi(baseUrl: string, path: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const res = await axios.get(`${baseUrl}${path}`, {
    headers: {
      'X-Partner-Token': PARTNER_TOKEN,
      'X-Timestamp': timestamp,
    },
  });
  return res.data;
}
```

### 错误码

| HTTP | code | 含义 |
|------|------|------|
| 401 | `AUTH_HEADERS_MISSING` | 缺少 `X-Partner-Token` 或 `X-Timestamp` |
| 401 | `INVALID_TOKEN` | Token 不存在或已禁用 |
| 401 | `TIMESTAMP_SKEW` | 时间戳偏差超过 5 分钟，请检查服务器时钟（NTP 同步） |
| 401 | `REQUEST_REPLAYED` | 同一 Token + Timestamp 组合已使用过，请用新的 Timestamp 重试 |
| 429 | `RATE_LIMITED` | 超出每分钟请求限制 |

> **重试提示**：遇到 `REQUEST_REPLAYED` 时，使用新的 `X-Timestamp` 即可正常重试，所有 GET 接口无副作用。

---

## OpenDAO

**Base URL**

| 环境 | URL |
|------|-----|
| 生产 | `https://relay.opendao.cc` |

> **注意**：OpenDAO 的路径前缀是 `/partner/`（无子前缀），响应直接返回 JSON 对象（无 `{ code, message, data }` 包装）。

### 端点列表

| # | 方法 | 路径 | 用途 |
|---|------|------|------|
| 1 | GET | `/partner/profile/:address` | 单用户实时数据 |
| 2 | GET | `/partner/snapshots` | 可用快照日期列表 |
| 3 | GET | `/partner/snapshot/:date` | 按日期分页读取快照 |

---

### 1. GET /partner/profile/:address

查询单个用户的实时 OpenDAO 数据。

**请求**

```bash
curl https://relay.opendao.cc/partner/profile/0x7091473ea5a2e6ebd60e186a66c10e8d09aa78cf \
  -H "X-Partner-Token: your-token" \
  -H "X-Timestamp: $(date +%s)"
```

**响应 200**

```json
{
  "timeQuery": "2026-05-21T02:00:09.527Z",
  "sumBarkxProductionDynamic": "739900000000000000000",
  "sumBarkxClaimedDynamic": "281668000000000000000",
  "registerTime": "2026-05-09T18:08:21.341Z",
  "userAddress": "0x7091473ea5a2e6ebd60e186a66c10e8d09aa78cf",
  "userDisplayName": "Briny#0590",
  "parentDisplayName": null,
  "tier": 2,
  "vis": "B",
  "children": 10,
  "childrenTier1": 6,
  "childrenTier2": 4,
  "childrenTier3": 0,
  "childrenTier4": 0,
  "childrenTier5": 0,
  "incomeToday": "5000000000000000000",
  "pendingBarkx": "140834000000000000000",
  "claimedBarkx": "140834000000000000000",
  "lastClaimTxid": "0x1cf576ef7735fd7acf05da686d893683733859cffa4e1b4bb337c9ebd2c32232"
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `timeQuery` | string | 服务端响应时间（ISO 8601 UTC） |
| `sumBarkxProductionDynamic` | string(wei) | 全网累计动态收益产出 BARKX 总量 |
| `sumBarkxClaimedDynamic` | string(wei) | 全网累计已领取动态收益 BARKX 总量 |
| `registerTime` | string | 用户注册时间（ISO 8601 UTC） |
| `userAddress` | string | 用户地址（小写） |
| `userDisplayName` | string | 用户显示名 |
| `parentDisplayName` | string\|null | 邀请人显示名，root 直系子节点为 null |
| `tier` | number | 用户等级（1-5） |
| `vis` | string | 可见性等级（A-F） |
| `children` | number | 直接下级总数 |
| `childrenTier1` | number | Tier 1 下级数量 |
| `childrenTier2` | number | Tier 2 下级数量 |
| `childrenTier3` | number | Tier 3 下级数量 |
| `childrenTier4` | number | Tier 4 下级数量 |
| `childrenTier5` | number | Tier 5 下级数量 |
| `incomeToday` | string(wei) | 今日收益 |
| `pendingBarkx` | string(wei) | 待领取收益 |
| `claimedBarkx` | string(wei) | 累计已领取收益 |
| `lastClaimTxid` | string\|null | 最近一次 claim 交易哈希，未领取过为 null |

**与其他矿池的差异**

| 差异点 | Main/VIP/Elite Pool | OpenDAO |
|--------|---------------------|---------|
| 响应格式 | `{ code, message, data: {...} }` | 直接返回数据对象 |
| 路径前缀 | `/partner/main/` 等 | `/partner/` |
| 质押数据 | 有 `activeStake` 分组 | 无（OpenDAO 是邀请树，非质押） |
| Node Boost | Main 有 `nodeBoost` | 无 |
| 核心模型 | 质押挖矿 | 邀请树 + 等级 + 动态收益 |
| 特有字段 | — | `tier`, `vis`, `children`, `childrenTier1-5`, `parentDisplayName` |

**错误**

| HTTP | code | 含义 |
|------|------|------|
| 400 | `BAD_ADDRESS` | 地址格式不合法 |
| 404 | `NOT_FOUND` | 用户不存在 |

---

### 2. GET /partner/snapshots

列出当前保留的快照日期。

**请求**

```bash
curl https://relay.opendao.cc/partner/snapshots \
  -H "X-Partner-Token: your-token" \
  -H "X-Timestamp: $(date +%s)"
```

**响应 200**

```json
{
  "snapshots": [
    { "snapshotDate": "2026-05-21", "generatedAt": "2026-05-21T00:30:01.234Z", "rowCount": 139 },
    { "snapshotDate": "2026-05-20", "generatedAt": "2026-05-20T00:30:00.987Z", "rowCount": 138 }
  ],
  "retentionDays": 7
}
```

- `snapshots[]` 按日期降序（最新在前）
- 部署后尚未生成快照时返回空数组

---

### 3. GET /partner/snapshot/:date

按日期分页读取快照数据。

**请求参数**

| 参数 | 类型 | 默认 | 限制 |
|------|------|------|------|
| `page` | int | 1 | ≥ 1 |
| `pageSize` | int | 10000 | 1 ~ 10000 |

**请求**

```bash
curl "https://relay.opendao.cc/partner/snapshot/2026-05-21?page=1&pageSize=100" \
  -H "X-Partner-Token: your-token" \
  -H "X-Timestamp: $(date +%s)"
```

**响应 200**

```json
{
  "timeSnapshot": "2026-05-21",
  "generatedAt": "2026-05-21T00:30:01.234Z",
  "sumBarkxProductionDynamic": "739900000000000000000",
  "sumBarkxClaimedDynamic": "281668000000000000000",
  "page": 1,
  "pageSize": 100,
  "total": 139,
  "rows": [
    {
      "registerTime": "2026-05-09T18:08:21.341Z",
      "userAddress": "0x7091473ea5a2e6ebd60e186a66c10e8d09aa78cf",
      "userDisplayName": "Briny#0590",
      "parentDisplayName": null,
      "tier": 2,
      "vis": "B",
      "children": 10,
      "childrenTier1": 6,
      "childrenTier2": 4,
      "childrenTier3": 0,
      "childrenTier4": 0,
      "childrenTier5": 0,
      "incomeToday": "5000000000000000000",
      "pendingBarkx": "140834000000000000000",
      "claimedBarkx": "140834000000000000000",
      "lastClaimTxid": "0x1cf576ef..."
    }
  ]
}
```

- `rows[]` 按 `registerTime` 升序（最早注册的用户在前）
- 每行字段与 profile 接口一致（去掉 `timeQuery`）

**错误**

| HTTP | code | 含义 |
|------|------|------|
| 400 | `BAD_DATE` | 日期格式不合法 |
| 400 | `BAD_PAGE` | page/pageSize 参数错误 |
| 404 | `SNAPSHOT_NOT_FOUND` | 该日期无快照 |
| 410 | `GONE` | 该日期快照已过期被清理（超过 7 天保留期） |

---

### 快照生成时间

- 默认 cron：每日 **UTC 00:30**（北京时间 08:30）
- 保留策略：最近 7 个快照，超期自动清理
- 幂等：同日重跑会覆写，不产生重复数据