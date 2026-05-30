# BarkX Incubator 静态安全审计报告

日期：2026-05-30

范围：
- `/home/soleste/barkx-pool-interface`
- `/home/soleste/barkx-incubator-contract`
- `/home/soleste/barkx-incubator-backend`
- `/home/soleste/barkx-incubator-admin`

方法：
- 仅静态审阅。
- 未修改任何代码。
- 未进行动态利用、fuzz、依赖 CVE 扫描或链上实时验证。

总体结论：
- 上次报告的高风险问题已按预期修复：
  - convert 签发现在需要通过一次性 challenge 证明钱包所有权
  - admin 登录现在使用一次性 challenge + 服务端会话 token
  - admin 操作现在会在发送交易前强制检查链与 owner
  - `trust proxy` 已改为环境变量控制，不再全局信任
  - admin 侧 `ethers` 已改为本地自托管，不再加载公共 CDN
- 在当前审阅代码中，未发现新的高危或中危问题。
- 剩余问题仅为低风险的运维/抗滥用项。

## 发现

### 1. 低风险：公共 challenge 接口可被刷写，导致 `challenge` 表增长

受影响代码：
- `barkx-incubator-backend/src/routes/incubator.ts:39-43`
- `barkx-incubator-backend/src/routes/auth.ts:19-23`
- `barkx-incubator-backend/src/auth/challenge.ts:25-46`
- `barkx-incubator-backend/src/db/migrations/0003_security_hardening.sql:17-25`

原因：
- 两个 challenge 签发接口都是公开的，每次请求都会写入一条 DB 记录。
- 清理动作只是顺带执行，而且主要只清理当前地址相关的旧记录。
- 没有端点级限流，也没有全局定时 GC 去清除过期/未使用的 challenge。

影响：
- 未认证调用者可以持续生成记录，导致 SQLite 文件逐步膨胀。
- 这是拒绝服务/存储增长风险，不是权限提升风险。

建议：
- 给 challenge 接口加轻量级限流。
- 增加定时清理任务，清除过期/已使用的 challenge。
- 也可以限制每个地址/作用域的未完成 challenge 数量。

状态：**已修复（2026-05-30）**。
- 两个 challenge 端点加按 IP 限流（30 次/分钟 → `429 RATE_LIMITED`）：`barkx-incubator-backend/src/util/rateLimit.ts`，接入 `src/routes/incubator.ts` 与 `src/routes/auth.ts`。
- `issueChallenge` 现在将每个 `(scope,address)` 的未完成 challenge 封顶为 1 条（再次签发时删除旧记录）：`src/auth/challenge.ts`。
- 定时 GC（每 5 分钟 + 启动时一次）清除过期/已用 challenge 及过期 `admin_session`：`src/auth/challenge.ts` 的 `gcChallenges()`，在 `src/server.ts` 调度。

### 2. 低风险：owner 轮换的失效存在 10 秒缓存延迟

受影响代码：
- `barkx-incubator-backend/src/auth/adminAuth.ts:37-49`
- `barkx-incubator-backend/src/auth/adminAuth.ts:56-103`
- `barkx-incubator-backend/src/auth/adminAuth.ts:109-137`

原因：
- `getOwner()` 会将链上 owner 缓存 `OWNER_TTL_MS = 10000` 毫秒。
- 登录与 `requireAdmin()` 都会读取这个缓存值。
- 在链上完成 owner 轮换后，旧 owner 在缓存刷新前仍可能被接受。

影响：
- 紧急 owner 轮换不是严格立即生效。
- 现有 admin 会话在轮换后也会短暂继续有效。

建议：
- 进一步缩短缓存 TTL，或在每次 admin 请求时直接失效缓存。
- 如果担心性能，可改为按区块高度缓存，而不是按墙钟时间缓存。

状态：**已修复（2026-05-30）**。
- `OWNER_TTL_MS` 由 10000 降至 2000（`barkx-incubator-backend/src/auth/adminAuth.ts`），轮换后旧 owner 被接受的窗口缩短约 5 倍。缓存现仅用于合并请求突发；admin 流量很低。

## 其他观察

- 与 auth 相关的 challenge/session 路径在仓库中看起来没有专门的自动化测试；当前测试仍主要集中在配额数学。**已处理（2026-05-30）：`barkx-incubator-backend/src/__tests__/auth.test.ts` 新增 7 个用例，覆盖 challenge 生命周期与 admin 会话登录校验。**
- 测试网默认值（`OPENDAO_MOCK`、`DEBUG_ENDPOINTS`）仍然是有意开启的，生产环境仍需按 `prod_modify.md` 显式关闭。

## 结语

第二轮审阅确认了上次的高风险问题已经被修复。剩余问题属于运维加固项，而不是可利用的权限提升漏洞。

**后续（2026-05-30）：** 上述两条低风险问题均已修复（challenge 限流 + 每地址封顶 + 定时 GC；owner 缓存 TTL 降至 2 秒），并为 auth 路径补充了自动化测试。详见 `dev_guide_fix.md` F-18。
