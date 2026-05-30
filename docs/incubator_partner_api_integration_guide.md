# Incubator Partner API 集成指南

> 本指南严格仿照 `opendao_partner_api_integration_guide.md` 编写，描述 **BarkX Incubator** 后端对外提供的 Partner API。服务端到服务端调用，由预置 token 鉴权。

## 通用约定

### 金额

所有金额字段均为 **wei 字符串**（十进制 `string`，不是 `number`）。

```
1 BARKX = 1000000000000000000 (10^18 wei)
1 vBARKX = 1000000000000000000 (10^18 wei)
```

在 JS/TS 中使用 `BigInt(value)` 解析。

> 例外：`NodeWeight` 与 `DynamicMappingEfficiency` / `FeedbackMappingEfficiency` 是**倍率/比例数值**（`number`），例如权重 `2.0` 表示 2.00×，效率 `0.5` 表示 50%。

### 地址

统一小写 `0x` + 40 位 hex，输入大小写不敏感，服务端会自动归一化。

### 无值

用 `null` 表示，不会返回 `undefined` 或空字符串。

### 时间

- 时间戳：ISO 8601 UTC 格式（`2026-05-30T01:00:00.123Z`）
- 快照日期：`YYYY-MM-DD` 字符串

---

## 鉴权

所有 Partner API 使用统一的 Token + Timestamp 鉴权，与孵化池管理员鉴权完全隔离。

### 请求 Header

| Header | 值 | 说明 |
|--------|-----|------|
| `X-Partner-Token` | 预注册的 API 密钥明文 | 由孵化池管理员注册后分发（管理前端 Partners 页面创建，明文仅显示一次） |
| `X-Timestamp` | 当前 Unix 秒时间戳 | 必须在服务端时间 ±5 分钟内 |

### 调用示例

```bash
curl https://incubator.barkai.finance/partner/profile/0x用户地址 \
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
| 403 | `IP_NOT_ALLOWED` | 来源 IP 不在该 token 的白名单内（若已配置白名单） |
| 429 | `RATE_LIMITED` | 超出每分钟请求限制 |

> **重试提示**：遇到 `REQUEST_REPLAYED` 时，使用新的 `X-Timestamp` 即可正常重试，所有 GET 接口无副作用。

---

## Incubator

**Base URL**

| 环境 | URL |
|------|-----|
| 生产 | `https://incubator.barkai.finance` |
| 测试 | `https://barkx-backend.westworld.org` |

> **注意**：路径前缀是 `/partner/`（无子前缀），响应直接返回 JSON 对象（无 `{ code, message, data }` 包装）。

### 端点列表

| # | 方法 | 路径 | 用途 |
|---|------|------|------|
| 1 | GET | `/partner/profile/:address` | 单用户实时数据 |
| 2 | GET | `/partner/snapshots` | 可用快照日期列表 |
| 3 | GET | `/partner/snapshot/:date` | 按日期分页读取快照 |

---

### 1. GET /partner/profile/:address

查询单个用户的实时孵化池数据。

**请求**

```bash
curl https://incubator.barkai.finance/partner/profile/0x5bc95902f404310020f6673049a89f00d5de0c2a \
  -H "X-Partner-Token: your-token" \
  -H "X-Timestamp: $(date +%s)"
```

**响应 200**

```json
{
  "timeQuery": "2026-05-30T02:00:09.527Z",
  "userAddressIncubator": "0x5bc95902f404310020f6673049a89f00d5de0c2a",
  "userTotalInjection": "201000000000000000000",
  "userTotalNormalConversion": "0",
  "userTotalLeaderConversion": "170000000000000000000",
  "todayNormal": {
    "NodeWeight": 5.0,
    "NodeAvgInjection": "30000000000000000000",
    "NodeWeightedAvgInjection": "150000000000000000000",
    "NormalQuota": "147780000000000000000"
  },
  "todayLeader": {
    "DynamicReward": "100000000000000000000",
    "DynamicMappingEfficiency": 0.5,
    "FeedbackReward": "200000000000000000000",
    "FeedbackMappingEfficiency": 0.6,
    "LeaderQuota": "170000000000000000000"
  }
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `timeQuery` | string | 服务端响应时间（ISO 8601 UTC） |
| `userAddressIncubator` | string | 用户地址（小写） |
| `userTotalInjection` | string(wei) | 生涯累计注入（销毁）vBARKX 总量 |
| `userTotalNormalConversion` | string(wei) | 消耗 Normal 配额换取的 BARKX 生涯总量 |
| `userTotalLeaderConversion` | string(wei) | 消耗 Leader 配额换取的 BARKX 生涯总量 |
| `todayNormal.NodeWeight` | number | 当日 OpenDAO 节点权重倍率（1.0 = 1.00×） |
| `todayNormal.NodeAvgInjection` | string(wei) | 30 日均存量（分母恒为 30） |
| `todayNormal.NodeWeightedAvgInjection` | string(wei) | 日均存量加权 = NodeAvgInjection × NodeWeight |
| `todayNormal.NormalQuota` | string(wei) | 当日 Normal 转换配额 |
| `todayLeader.DynamicReward` | string(wei) | 当日动态收益（OpenDAO `incomeToday`） |
| `todayLeader.DynamicMappingEfficiency` | number | 动态收益映射效率（0.5 = 50%） |
| `todayLeader.FeedbackReward` | string(wei) | 当日反馈收益（OpenDAO `feedbackToday`，未上线时为 `0`） |
| `todayLeader.FeedbackMappingEfficiency` | number | 反馈收益映射效率（0.6 = 60%） |
| `todayLeader.LeaderQuota` | string(wei) | 当日新增 Leader 配额 = DynamicReward×效率 + FeedbackReward×效率 |

**与 OpenDAO 的差异**

| 差异点 | OpenDAO | Incubator |
|--------|---------|-----------|
| 核心模型 | 邀请树 + 等级 + 动态收益 | vBARKX→BARKX 配额转换 |
| 单用户特有字段 | `tier`/`vis`/`children`/`parentDisplayName` | `todayNormal`/`todayLeader` 配额分组 |
| 金额字段 | 收益/领取 | 注入/转换 + 配额 |

**错误**

| HTTP | code | 含义 |
|------|------|------|
| 400 | `BAD_ADDRESS` | 地址格式不合法 |
| 404 | `NOT_FOUND` | 用户未参与孵化池（无 inject 记录） |

---

### 2. GET /partner/snapshots

列出当前保留的快照日期。

**请求**

```bash
curl https://incubator.barkai.finance/partner/snapshots \
  -H "X-Partner-Token: your-token" \
  -H "X-Timestamp: $(date +%s)"
```

**响应 200**

```json
{
  "snapshots": [
    { "snapshotDate": "2026-05-30", "generatedAt": "2026-05-30T00:45:01.234Z", "rowCount": 4 },
    { "snapshotDate": "2026-05-29", "generatedAt": "2026-05-29T00:45:00.987Z", "rowCount": 3 }
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
curl "https://incubator.barkai.finance/partner/snapshot/2026-05-30?page=1&pageSize=100" \
  -H "X-Partner-Token: your-token" \
  -H "X-Timestamp: $(date +%s)"
```

**响应 200**

```json
{
  "timeSnapshot": "2026-05-30",
  "generatedAt": "2026-05-30T00:45:01.234Z",
  "sumVbarkxInjected": "201000000000000000000",
  "sumBarkxConverted": "170000000000000000000",
  "GlobalWeightedAvgInjection": "150000000000000000000",
  "GlobalQuota": "500000000000000000000000",
  "page": 1,
  "pageSize": 100,
  "total": 4,
  "rows": [
    {
      "userAddressIncubator": "0x5bc95902f404310020f6673049a89f00d5de0c2a",
      "blockJoinIncubator": 195827340,
      "userTotalInjection": "201000000000000000000",
      "userTotalNormalConversion": "0",
      "userTotalLeaderConversion": "170000000000000000000",
      "todayNormal": {
        "NodeWeight": 5.0,
        "NodeAvgInjection": "30000000000000000000",
        "NodeWeightedAvgInjection": "150000000000000000000",
        "NormalQuota": "147780000000000000000"
      },
      "todayLeader": {
        "DynamicReward": "100000000000000000000",
        "DynamicMappingEfficiency": 0.5,
        "FeedbackReward": "200000000000000000000",
        "FeedbackMappingEfficiency": 0.6,
        "LeaderQuota": "170000000000000000000"
      }
    }
  ]
}
```

**顶层字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `timeSnapshot` | string | 快照日期（`YYYY-MM-DD`） |
| `generatedAt` | string | 快照生成时间（ISO 8601 UTC） |
| `sumVbarkxInjected` | string(wei) | 自启动以来后端记载的 vBARKX 销毁总量 |
| `sumBarkxConverted` | string(wei) | 自启动以来后端记载的 BARKX 输出总量 |
| `GlobalWeightedAvgInjection` | string(wei) | 全体节点日均存量加权之和 |
| `GlobalQuota` | string(wei) | 当日 Normal 转换总配额 |
| `page` / `pageSize` / `total` | int | 分页信息 |
| `rows[]` | array | 用户行，字段同 profile（去掉 `timeQuery`，增加 `blockJoinIncubator`） |

**行字段补充**

| 字段 | 类型 | 说明 |
|------|------|------|
| `blockJoinIncubator` | number\|null | 首次 inject 的区块高度（默认排序字段，最老记录在上） |

- `rows[]` 按 `blockJoinIncubator` 升序（最早参与的用户在前）

**错误**

| HTTP | code | 含义 |
|------|------|------|
| 400 | `BAD_DATE` | 日期格式不合法 |
| 404 | `SNAPSHOT_NOT_FOUND` | 该日期无快照 |
| 410 | `GONE` | 该日期快照已过期被清理（超过 7 天保留期） |

---

### 快照生成时间

- 默认 cron：每日 **UTC 00:45**
- 保留策略：最近 7 天，超期自动清理
- 幂等：同日重跑会覆写，不产生重复数据
- 下游（如 Data Fusion）建议在 **UTC 01:00** 之后拉取
