# BarkX Incubator — 测试网转生产改造指南（prod_modify.md）

> 面向专业开发者：把 Incubator **测试网版本**转为**生产版本**需经历的对接与改造。生产环境的构成已由 SPEC 描述，本文只讲「从 testnet 到 prod 要改什么」。先完成安全审计再上线。

## 1. 链与合约（Arbitrum One）

- 部署目标改为 **Arbitrum One（chainId 42161）**。合约代码不变，但 `convert` 冷却已用 ArbSys L2 块高（F-15），主网同样适用。
- **代币地址换主网**：BARKX `0x55279F3c138521B0395BC8b76d123E94f1d935B2`、vBARKX `0x081Ac2F123972a4F36D23cd9e7Be7E3d2Fae2EF8`（部署脚本默认值仅测试网，需覆盖）。
- **owner / approver 用生产密钥**：owner 建议多签（withdraw / setApprover / pause 权限）；approver 仍**独立于 owner**（F-11），私钥放安全保管（HSM / 受控 keystore），**不要**用测试密码。
- 部署后 owner 向合约**注资足量 BARKX**作为转换输出来源。记录主网合约地址 + 部署区块号。

## 2. OpenDAO 数据源（关闭 mock）

- 后端 `OPENDAO_MOCK=0`，配置真实 OpenDAO Partner API：`OPENDAO_BASE_URL=https://relay.opendao.cc`、`OPENDAO_PARTNER_TOKEN=<分发的 token>`。对接规范见 `opendao_partner_api_integration_guide.md`（00:30 UTC 出快照，本后端 00:35 拉取，重试 5 次）。
- `feedbackToday`（Feedback Reward）在 OpenDAO 生产**尚未上线**，当前取不到 → Leader 配额的 feedback 项暂为 0；代码已按规范预留，OpenDAO 上线后自动生效。

## 3. 后端（生产化）

- **进程管理用 systemd**（开发期为提效不用；生产需开机自启、崩溃重启）。注意：每次重启后端仍 **locked**，需管理员解锁 keystore（可结合运维流程）。
- `DEBUG_ENDPOINTS=0` —— **关闭虚拟时钟/回填等调试接口**。
- `RPC_URL` 换生产级 Arbitrum One RPC（非 ankr 测试网）；`LISTENER_START_BLOCK`=主网部署块；`LISTENER_CONFIRMATIONS=12` 保持。
- `ALLOWED_ORIGINS` 换生产前端域名。`CONVERT_DEADLINE_SEC` 视钱包确认体验保留 60s 或微调。
- **`TRUST_PROXY=1`**（或反代子网）—— 后端默认 `trust proxy=0`（不信任 `X-Forwarded-For`，审计 #4）。生产在 nginx 单跳反代后必须设为 `1`，否则 partner IP 白名单要么失效要么按反代 IP 误判；切勿设为 `true`。
- DB 全新（不迁移测试数据）。Partner API token 重新注册（Data Fusion 在 01:00 UTC 拉取，见 partner guide）。可在管理前端 Partners 页随时 禁用/启用/轮换 token、设置 IP 白名单（审计后补全的生命周期能力）。

## 4. 前端（用户端，构建模式 + 网关）

- 生产用 `npm run build`（`--mode production` 或 `pre`）。此模式下 `isMainnetMode=true` → 自动切换到**主网代币地址**且 `useIncubatorBackend` 启用**网关前缀 `/incubator`**（经 RelayX/Coco self-service，而非直连）。
- **务必把 Incubator 环境变量加入 `.env.production`/`.env.pre`**（测试期只加在 `.env.development`，F-05）：`VITE_BARKX_INCUBATOR_ADDRESS`（主网合约）、`VITE_BARKX_INCUBATOR_API_BASE_URL`（生产后端 / 网关）、`VITE_BARKX_INCUBATOR_BARKX_ADDRESS`/`_VBARKX_ADDRESS`（主网代币，或留空走 `incubatorConfig.js` 的 MAINNET 默认）。
- 确认网关侧把 `/incubator/*` 路由到 Incubator 后端。

## 5. 域名（SPEC 规划）

| 端 | 测试 | 生产（预计） |
|----|------|------|
| 用户前端 | barkx-pool.westworld.org | pool.barkx.xyz |
| 后端 | barkx-backend.westworld.org | incubator.barkai.finance |
| 管理前端 | incubator-admin.westworld.org | incubator-admin.barkai.finance |

管理前端 `js/config.js` 换：`CHAIN_ID=42161` + HEX、主网 `INCUBATOR_ADDRESS`/代币、生产 `BACKEND_URL`、`EXPLORER`=arbiscan 主网。

## 6. 配额参数（上线前由管理员设置）

经管理前端 Config 设置真实：每日 Normal `GlobalQuota`（整数 BARKX）、Node Weight T0–T5、Dynamic / Feedback Mapping T0–T5（整数百分比）。默认值见 `dev_guide.md §2`，生产值按业务确定。

## 7. 安全 / 上线检查

- **代码审计通过**后再部署（合约 + 后端 EIP-712 签名 + 每用户 seq/cooldown 双层防护，见 F-14/F-15/F-16 与 `audit_report.md`）。
- approver 独立密钥、owner 多签、`withdraw` 禁提 vBARKX（合约已保证）。
- **生产环境变量逐项核对（忘配即把测试夹具 / 调试接口带进生产）**：
  - [ ] `OPENDAO_MOCK=0` —— 否则配额会按本地 mock fixture 计算，而非真实 OpenDAO 数据。后端默认 `true`（仅为测试网便利），生产必须显式置 0。
  - [ ] `DEBUG_ENDPOINTS=0` —— 否则虚拟时钟 / 回填 / backfill 等调试接口在生产暴露。后端默认 `true`，生产必须显式置 0。
  - [ ] `TRUST_PROXY=1`（或反代子网）—— partner IP 白名单与日志可信前提（审计 #4）。
  - [ ] `ADMIN_LOGIN_TTL_SEC` 按需（默认 8h）—— 服务端强制 `expiresAt-issuedAt ≤` 此值，admin 会话 token 寿命由服务端裁定（审计 #2）。
- 监控：Dashboard 的 Latency to tip、拉取/计算健康（拉取失败用旧数据会在 Dashboard 报告）。
- 注资充足 BARKX；Partner API 限频/白名单按需配置（管理前端 Partners 页可禁用/轮换 token）。
- 管理前端 `ethers` 已自托管（审计 #5，不再依赖公共 CDN）；actions 页在错链 / 非 owner 下硬禁用并发交易前复检链（审计 #3）。
