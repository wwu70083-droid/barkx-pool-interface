# viem 文档

viem 是一个 TypeScript 优先的以太坊客户端库，提供类型安全的区块链交互功能。

## 安装

```bash
npm install viem
# 或者使用 pnpm
pnpm install viem
# 或者使用 bun
bun install viem
```

## 核心概念

### 客户端类型
- **Public Client**: 用于读取链上数据
- **Wallet Client**: 用于发送交易和签名
- **Test Client**: 用于测试环境
- **Bundler Client**: 用于账户抽象（ERC-4337）

## 基本使用

### 1. 创建客户端

```typescript
import { createPublicClient, createWalletClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// 创建公共客户端
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth-mainnet.g.alchemy.com/v2/your-api-key')
})

// 创建钱包客户端
const account = privateKeyToAccount('0x...')
const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http('https://eth-mainnet.g.alchemy.com/v2/your-api-key')
})
```

### 2. 读取链上数据

```typescript
// 获取区块号
const blockNumber = await publicClient.getBlockNumber()

// 获取余额
const balance = await publicClient.getBalance({
  address: '0x...'
})

// 获取交易
const transaction = await publicClient.getTransaction({
  hash: '0x...'
})
```

### 3. 与合约交互

#### 使用合约实例（推荐）
```typescript
import { getContract, parseAbi } from 'viem'

// 创建合约实例
const contract = getContract({
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  abi: wagmiAbi,
  client: {
    public: publicClient,
    wallet: walletClient
  }
})

// 读取合约数据
const balance = await contract.read.balanceOf([
  '0x...'
])

// 写入合约
const hash = await contract.write.transfer([
  '0x...', 
  1000000n // 1 USDC (6位小数)
])

// 监听事件
const unwatch = contract.watchEvent.Transfer(
  { from: '0x...' },
  { onLogs: logs => console.log(logs) }
)
```

#### 使用独立函数
```typescript
import { parseAbi } from 'viem'

// 定义合约 ABI
const abi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
])

// 读取合约数据
const balance = await publicClient.readContract({
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  abi,
  functionName: 'balanceOf',
  args: ['0x...']
})

// 写入合约（需要钱包客户端）
const hash = await walletClient.writeContract({
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  abi,
  functionName: 'transfer',
  args: ['0x...', 1000000] // 1 USDC (6位小数)
})
```

### 4. 发送交易

```typescript
// 发送原生代币
const hash = await walletClient.sendTransaction({
  to: '0x...',
  value: parseEther('0.1') // 发送 0.1 ETH
})

// 等待交易确认
const receipt = await publicClient.waitForTransactionReceipt({ hash })
```

### 5. 监听事件

```typescript
// 监听合约事件
const unwatch = publicClient.watchContractEvent({
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  abi,
  eventName: 'Transfer',
  onLogs: (logs) => {
    console.log('New transfers:', logs)
  }
})

// 停止监听
unwatch()
```

## 高级功能

### 1. 账户抽象（ERC-4337）

viem 支持账户抽象，允许使用智能合约账户：

```typescript
import { createPublicClient, http, parseEther } from 'viem'
import { 
  createBundlerClient, 
  createPaymasterClient,
  toCoinbaseSmartAccount 
} from 'viem/account-abstraction'
import { mainnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// 创建公共客户端
const client = createPublicClient({
  chain: mainnet,
  transport: http()
})

// 创建 Bundler 客户端
const bundlerClient = createBundlerClient({
  client,
  transport: http('https://public.pimlico.io/v2/1/rpc')
})

// 设置所有者账户
const owner = privateKeyToAccount('0x...')

// 创建智能账户
const account = await toCoinbaseSmartAccount({
  client,
  owners: [owner],
  version: '1.1'
})

// 发送用户操作（User Operation）
const hash = await bundlerClient.sendUserOperation({
  account,
  calls: [{
    to: '0xcb98643b8786950F0461f3B0edf99D88F274574D',
    value: parseEther('0.001')
  }]
})

// 等待确认
const receipt = await bundlerClient.waitForUserOperationReceipt({ hash })
```

#### 使用 Paymaster 赞助交易

```typescript
// 创建 Paymaster 客户端
const paymasterClient = createPaymasterClient({
  transport: http('https://public.pimlico.io/v2/1/rpc')
})

// 配置 Bundler 客户端使用 Paymaster
const bundlerClient = createBundlerClient({
  client,
  paymaster: paymasterClient,
  transport: http('https://public.pimlico.io/v2/1/rpc')
})

// 或者使用简化的赞助配置
const bundlerClient = createBundlerClient({
  client,
  paymaster: true, // 使用 Bundler 内置的 Paymaster 支持
  transport: http('https://public.pimlico.io/v2/1/rpc')
})
```

### 2. ZKsync 支持

viem 提供对 ZKsync 链的原生支持：

```typescript
import { createWalletClient, custom } from 'viem'
import { zksync } from 'viem/chains'
import { eip712WalletActions } from 'viem/zksync'

const walletClient = createWalletClient({
  chain: zksync,
  transport: custom(window.ethereum!)
}).extend(eip712WalletActions()) // 扩展 EIP712 支持

// 部署合约
const hash = await walletClient.deployContract({
  abi,
  account,
  bytecode: '0x...',
  args: [69420],
  factoryDeps: [ // ZKsync 特有的工厂依赖
    '0x702040405260405161083e38038061083e833981016040819123456...'
  ]
})
```

### 3. Blob 交易支持（EIP-4844）

```typescript
import * as cKzg from 'c-kzg'
import { toBlobs, setupKzg, stringToHex } from 'viem'
import { mainnetTrustedSetupPath } from 'viem/node'

// 设置 KZG
const kzg = setupKzg(cKzg, mainnetTrustedSetupPath)

// 准备 Blob 交易
const request = await walletClient.prepareTransactionRequest({
  account,
  blobs: toBlobs({ data: stringToHex('blobby blob!') }),
  kzg,
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
})

// 签名并发送
const signature = await account.signTransaction({
  blobs: toBlobs({ data: stringToHex('blobby blob!') }),
  kzg,
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
})
```

### 4. 批量调用（Multicall）

```typescript
const results = await publicClient.multicall({
  contracts: [
    {
      address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
      abi: wagmiAbi,
      functionName: 'totalSupply'
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      abi: usdcAbi,
      functionName: 'balanceOf',
      args: ['0x...']
    }
    // ... 更多合约调用
  ]
})
```

## 实用工具函数

```typescript
import { 
  parseEther, 
  formatEther, 
  parseUnits, 
  formatUnits,
  isAddress,
  getAddress,
  keccak256,
  toHex,
  fromHex
} from 'viem'

// ETH 单位转换
const wei = parseEther('1.5') // 1.5 ETH -> Wei
const eth = formatEther(1500000000000000000n) // Wei -> ETH

// ERC20 代币单位转换
const usdc = parseUnits('100', 6) // 100 USDC -> 单位
const usdcFormatted = formatUnits(100000000n, 6) // 单位 -> USDC

// 地址处理
const validAddress = isAddress('0x...') // 验证地址
const checksumAddress = getAddress('0x...') // 获取校验和地址

// 哈希和编码
const hash = keccak256('0x...') // Keccak256 哈希
const hex = toHex(12345) // 数字转十六进制
const number = fromHex('0x3039') // 十六进制转数字
```

## 错误处理

```typescript
import { BaseError, ContractFunctionRevertedError } from 'viem'

try {
  await walletClient.writeContract({
    // ... 合约调用参数
  })
} catch (error) {
  if (error instanceof BaseError) {
    const revertError = error.walk(err => err instanceof ContractFunctionRevertedError)
    if (revertError) {
      console.log('合约回退原因:', revertError.data)
    }
  }
}
```

## 最佳实践

1. **始终使用 TypeScript**: viem 为所有操作提供完整的类型支持
2. **使用环境变量**: 存储私钥和 API 密钥
3. **处理错误**: 使用 try-catch 块处理可能的错误
4. **验证输入**: 使用 viem 的验证函数确保数据有效性
5. **监听事件**: 使用事件监听代替轮询获取状态变化
6. **使用合约实例**: 对于频繁交互的合约，使用 `getContract` 创建实例
7. **批量操作**: 使用 multicall 减少 RPC 调用次数
8. **账户抽象**: 考虑使用智能合约账户提升用户体验

## 常用链配置

```typescript
import { 
  mainnet, 
  polygon, 
  arbitrum, 
  optimism,
  base,
  zksync,
  sepolia,
  polygonZkEvm 
} from 'viem/chains'

// 使用不同的链
const client = createPublicClient({
  chain: base, // 或其他支持的链
  transport: http()
})

// OP Stack 链
const opStackClient = createPublicClient({
  chain: base,
  transport: http()
})

// ZKsync 链
const zkSyncClient = createWalletClient({
  chain: zksync,
  transport: custom(window.ethereum!)
}).extend(eip712WalletActions())
```

## 完整示例：代币转账

```typescript
import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseUnits,
  parseEther 
} from 'viem'
import { mainnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

async function transferTokens() {
  // 初始化客户端
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http('https://eth-mainnet.g.alchemy.com/v2/your-api-key')
  })
  
  const account = privateKeyToAccount(process.env.PRIVATE_KEY)
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http('https://eth-mainnet.g.alchemy.com/v2/your-api-key')
  })
  
  // USDC 合约配置
  const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const abi = [{
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }]
  
  // 执行转账
  const amount = parseUnits('10', 6) // 10 USDC
  const hash = await walletClient.writeContract({
    address: usdcAddress,
    abi,
    functionName: 'transfer',
    args: ['0x...', amount]
  })
  
  console.log('交易哈希:', hash)
  
  // 等待确认
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  console.log('交易确认:', receipt.status)
}

// 运行示例
transferTokens().catch(console.error)
```

这个文档涵盖了 viem 的核心功能和最新特性，包括账户抽象、ZKsync 支持、Blob 交易等高级功能。所有示例都经过更新，便于快速上手使用。
