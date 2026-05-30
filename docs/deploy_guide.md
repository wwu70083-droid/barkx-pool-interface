# BarkX Incubator — 测试网部署指南（deploy_guide.md）

> 面向专业开发者：在新的测试环境从零部署 Incubator 测试网版本（合约 / 后端 / 用户前端 / 管理前端），以便继续开发与验证。链：**Arbitrum Sepolia（chainId 421614）**。配套：`dev_guide.md`、`incubator-contract.md`、`incubator-frontend-api.md`、`dev_guide_fix.md`。

## 0. 前置

- Node ≥ 20、Git、能访问 4 个仓库（`barkx-incubator-{contract,backend,admin}` + `barkx-pool-interface`）。
- Arbitrum Sepolia RPC（项目用 ankr，见各 `.env.example`）。
- 一个 **owner/部署者**私钥，地址需有 ETH（gas）、BARKX（注资合约）、vBARKX（测试 inject）。可用水龙头/自分流。
- 反向代理（nginx）+ 三个子域名 + 通配符证书（HTTPS）。端口区间 8020–8030（禁 8000–8010）。

## 1. 合约 `barkx-incubator-contract`

```bash
git clone <repo> && cd barkx-incubator-contract && npm install
node scripts/gen-approver-key.js        # 生成独立 convert approver keystore → ~/barkx-incubator-keys/
cp .env.example .env                     # 填 ARB_SEPOLIA_RPC、DEPLOYER_PRIVATE_KEY(owner)
npm test                                 # 21 用例（可选）
npm run deploy:arb-sepolia               # 部署 → 写 deployed.arbitrumSepolia.json，记录【合约地址】
npm run fund:arb-sepolia                 # FUND_BARKX=50000 owner→合约 注资 BARKX
npm run smoke:arb-sepolia                # 链上 inject→convert 全链路自检（可选）
```
记录：**合约地址**、**部署区块号**（`deploy tx` 的 blockNumber，给后端 `LISTENER_START_BLOCK`）、**approver 地址**（`~/barkx-incubator-keys/approver.secret.json`）。代币：BARKX `0x457f…3339B0f`、vBARKX `0xb29D…Aa83F`（已写入脚本默认）。

## 2. 后端 `barkx-incubator-backend`（端口 8021）

```bash
git clone <repo> && cd barkx-incubator-backend && npm install
cp .env.example .env
```
`.env` 关键项：`INCUBATOR_ADDRESS`=合约地址；`BARKX_ADDRESS`/`VBARKX_ADDRESS`；`RPC_URL`；`APPROVER_KEYSTORE_PATH=~/barkx-incubator-keys/approver.keystore.json`；`LISTENER_START_BLOCK`=部署区块号；`LISTENER_CONFIRMATIONS=12`；`CONVERT_DEADLINE_SEC=60`；`OPENDAO_MOCK=1`（测试用 `fixtures/opendao-mock.json`）；`ALLOWED_ORIGINS`=用户前端+管理前端域名；`DEBUG_ENDPOINTS=1`（启虚拟时钟调试）。
```bash
npm run migrate           # 建库（含 tier 默认值、global_quota 默认 500000）
npx tsx src/server.ts     # 或 npm run build && npm start（开发期不用 systemd）
```
启动后**locked**：到管理前端 Dashboard 用 owner 钱包登录后输入 keystore 密码解锁，才能签 convert。`~/barkx-incubator-keys/passwords.json` 存测试密码。

## 3. 用户前端（融合在 `barkx-pool-interface`）

```bash
git clone <repo> && cd barkx-pool-interface && npm install
npm i @rollup/rollup-linux-x64-gnu --no-save     # 规避 npm optional-dep bug（F-06）
```
`.env.development` 的 Incubator 段：`VITE_BARKX_INCUBATOR_ADDRESS`=合约地址；`VITE_BARKX_INCUBATOR_API_BASE_URL`=后端域名；`VITE_BARKX_INCUBATOR_BARKX_ADDRESS`/`_VBARKX_ADDRESS`=SPEC 测试代币。
```bash
npm run build -- --mode development    # 必须 --mode development（F-05），产物在 dist/
```
把 `dist/` 部署到静态服务器/反代根目录。导航：Featured Pools → Incubator（位于 BarkX VIP Pool 下方）。

## 4. 管理前端 `barkx-incubator-admin`（静态，无构建）

编辑 `js/config.js`：`INCUBATOR_ADDRESS`=合约地址（也是 EIP-712 登录域 verifyingContract）、`BARKX_ADDRESS`/`VBARKX_ADDRESS`、`BACKEND_URL`（非 localhost 走后端域名）、`CHAIN_ID`。静态托管即可（`python3 -m http.server 8022` 或反代）。

## 5. Serving / 反向代理（HTTPS）

三个子域名经 nginx（通配符证书）：
- `用户前端域名` → 静态 `dist/`（SPA，`try_files $uri /index.html`）。
- `管理前端域名` → 静态 admin 目录。
- `后端域名` → `proxy_pass http://127.0.0.1:8021`。

参考脚本 `barkx-pool-interface`/部署机上的 `setup-barkx-nginx.sh`（自动探测通配符证书、部署 `/var/www`、写 vhost、`nginx -t` 后 reload）。**不要影响同机其它 vhost**（见 F-12）。每次前端重构后需重新同步静态产物。

## 6. 验证

- `curl https://<后端域名>/health` → `{ok:true}`。
- 管理前端登录（owner 钱包 EIP-712）→ Dashboard 解锁 keystore；Config 见 tier 表/GlobalQuota。
- 用户前端连钱包 → Incubator 页：approve+inject → 用 Debug「Backfill 30 / Advance Day」造数据 → convert。
- 测试流程详见 `dev_guide.md §10 时间加速调试工具`。

## 7. 重新部署合约时（同步项）

改动合约 → 重新部署后必须同步：后端 `INCUBATOR_ADDRESS`+`LISTENER_START_BLOCK`+**重置 DB**（删 `data/incubator.sqlite*` 后 migrate）；用户前端 `VITE_BARKX_INCUBATOR_ADDRESS`+重生成 `src/abi/BarkXIncubator.json`+重构建；管理前端 `js/config.js`；重新注资 BARKX。沿用同一 approver 密钥则后端 keystore/密码不变。
