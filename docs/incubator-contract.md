# Incubator 合约开发说明（incubator-contract.md）

> `barkx-incubator-contract` 的开发者文档：合约结构、状态、方法、事件、防护与部署。`dev_guide.md` §3 只保留摘要，细节看本文件。

## 概览

`BarkXIncubator.sol` —— 固定 **1 vBARKX = 1 BARKX** 的转换网关。用户 `inject`（销毁 vBARKX、记虚拟存量）建立存量，再凭后端 approver 的 EIP-712 签名 `convert` 部分存量为 BARKX。合约**不区分** Normal/Leader（机制归属由后端按签名 `nonce` 记录），链上只记生涯注入/转换总量与冷却高度。

- 链：Arbitrum One（测试 Arbitrum Sepolia，chainId `421614`）。
- 当前测试网部署：`0x7e68A4df996d797ea4230cbAF8789BA42bFD5522`。
- 代币：BARKX `0x457fA4A1fCd0600c1Cf8485dD198f580f3339B0f`；vBARKX `0xb29D3368e40DA289694Db5debd37B3dfdb0Aa83F`（OZ `ERC20Burnable`）。
- 栈：Solidity `0.8.26`，OZ `^5`：`Ownable` + `Pausable` + `ReentrancyGuard` + `EIP712` + `ECDSA` + `SafeERC20` + `Address`。

## 状态

| 变量 | 类型 | 说明 |
| --- | --- | --- |
| `barkxToken` | `IERC20 immutable` | 转换输出代币（owner 预存） |
| `vbarkxToken` | `IERC20Burnable immutable` | 注入时 `burnFrom` 销毁 |
| `approver` | `address` | 受信任的后端签名方 |
| `userTotalInjection[user]` | `uint256` | 生涯注入（inject 累加） |
| `userTotalConversion[user]` | `uint256` | 生涯转换输出（convert 累加） |
| `lastConvertHeight[user]` | `uint256` | 上次 convert 的 **L2** 块高（冷却用） |
| `_usedApproval[sigHash]` | `mapping=>bool` | 签名防重放（private） |
| `CONVERT_COOLDOWN_BLOCKS` | `uint256 constant = 36` | 两次 convert 最小 L2 块间隔（~9s） |
| `ARB_SYS` | `address constant = 0x..64` | ArbSys 预编译 |

## 视图

- `userInjection(user) = userTotalInjection - userTotalConversion` —— 当前可转虚拟存量（convert 前校验 ≥ amount，不会下溢）。
- `currentConvertBlock()` —— 冷却所用的 L2 块高（见下「冷却」）。
- `isApprovalUsed(sig)` / `convertDigest(user,amount,nonce,deadline)` —— 链下辅助。
- 公开 mapping 自带 getter：`lastConvertHeight`、`userTotalInjection`、`userTotalConversion`、`approver`。

## 方法

均 `whenNotPaused nonReentrant`（注意原子封闭）。

### inject(amount)
`vbarkxToken.burnFrom(msg.sender, amount)`（需用户先 `approve` 孵化合约；经授权拉取并销毁，合约**不持有** vBARKX）→ `userTotalInjection += amount` → `emit Injected(user, amount, total)`。

### convert(amount, nonce, deadline, approverSig)
按序校验：
1. `amount != 0`，`block.timestamp <= deadline`。
2. 防重放：`!_usedApproval[keccak256(sig)]`。
3. EIP-712：`ECDSA.recover(_hashTypedDataV4(Convert(msg.sender,amount,nonce,deadline)), sig) == approver`。
4. **冷却**：`lastConvertHeight==0 || currentL2 >= lastConvertHeight + 36`，否则 `ConvertCooldown`。
5. `userInjection(msg.sender) >= amount`，否则 `InsufficientInjection`。
6. 置位 `_usedApproval`、写 `lastConvertHeight = currentL2`、`userTotalConversion += amount`、`barkxToken.safeTransfer(msg.sender, amount)`、`emit Converted(user, amount, nonce, total)`。

> 冷却置于签名校验**之后**：重放签名仍报 `ApprovalReplayed`；双花攻击用的是新 nonce 的有效签名，在此被拦。

### 管理（onlyOwner）
- `setApprover(addr)`、`pause()/unpause()`、`transferOwnership` 等。
- `withdraw(token, amount, to)` —— 提取 BARKX 余额/误转 ERC20/ETH；**显式拒绝 `token == vbarkxToken`**（`CannotWithdrawVbarkx`）。

## EIP-712
`EIP712("BarkX-Incubator", "1")`，`verifyingContract` = 本合约。
`Convert(address user,uint256 amount,uint256 nonce,uint256 deadline)`。

## 冷却与 Arbitrum L2 块高（关键）
Arbitrum 上 Solidity `block.number` 返回 **L1** 块高（~12s/块），不是 L2（~0.25s/块）。若冷却用 `block.number`，36 块会变成 ~7 分钟。故 `_l2Block()` 经 **ArbSys 预编译 `arbBlockNumber()`** 取 L2 块高（低级 `staticcall` + 返回长度判断；无预编译的本地/其它链回退 `block.number`，本地测试照常）。36 L2 块 ≈ 9s。详见 dev_guide_fix.md F-15。

这是「监听确认间隙双花」防护的**第二道**（合约兜底）；第一道是后端 in-flight 守卫，见 dev_guide.md §4 与 F-14/F-16。

## 事件 / 错误
- 事件：`Injected(user,amount,totalInjection)`、`Converted(user,amount,nonce,totalConversion)`、`Withdrawn(token,to,amount)`、`ApproverUpdated(old,new)`。
- 错误：`ZeroAddress`、`ZeroAmount`、`InsufficientInjection`、`ApprovalExpired`、`ApprovalReplayed`、`ApprovalSignerMismatch`、`CannotWithdrawVbarkx`、`ConvertCooldown`。

## 部署 / 脚本
- 构造：`(barkxToken, vbarkxToken, initialOwner, initialApprover)`。owner = `0x5bC95902F404310020F6673049a89F00d5de0C2a`。
- `.env`：`ARB_SEPOLIA_RPC`（项目用 SPEC ankr RPC）、`DEPLOYER_PRIVATE_KEY`。
- 脚本：`scripts/gen-approver-key.js`（生成独立 approver keystore，见 F-11）、`deploy.js`、`fund.js`（owner 向合约转 BARKX）、`smoke.js`（链上 inject→convert 全链路）。
- 部署后 owner 向合约预存足量 BARKX；`deployed.arbitrumSepolia.json` 记地址。
- 测试：`npx hardhat test`，21 用例（含冷却 reverts-then-succeeds、first-ever 通过、防重放、跨域拒签、用户绑定、提币禁 vBARKX 等）。

## 重新部署须知
合约改动需重新部署 → 同步更新：后端 `INCUBATOR_ADDRESS` + `LISTENER_START_BLOCK` + **重置 DB**；前端 `VITE_BARKX_INCUBATOR_ADDRESS` + 重新生成 `src/abi/BarkXIncubator.json` + 重构建；管理前端 `js/config.js` 的 `INCUBATOR_ADDRESS`（也是 EIP-712 登录域 verifyingContract）；重新注资 BARKX。approver 沿用同一独立密钥则后端 keystore/密码不变。
