# AGENTS.md

此文件为 Codex (Codex.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是一个使用 Composition API 和 `<script setup>` 语法的 Vue 3 + Vite 应用程序。

## 开发命令

```bash
# 启动开发服务器（允许网络访问）
npm run dev

# 构建生产版本
npm run build

# 本地预览生产构建
npm run preview
```

## 项目结构

应用程序遵循标准的 Vite + Vue 约定：

- **入口文件**: `src/main.js` - 将 Vue 应用挂载到 `#app`
- **根组件**: `src/App.vue` - 使用 `<script setup>` 语法
- **页面路由**: `src/pages/` - 基于 vite-plugin-pages 自动生成路由
- **路由配置**: `src/router/index.js` - 路由实例配置
- **状态管理**: `src/store/index.js` - Pinia store
- **组件**: 位于 `src/components/`
- **全局样式**: `src/style.less` - 全局样式文件
- **静态资源**: 位于 `src/assets/` 和 `public/`

## 关键配置说明

### Vite 插件 (vite.config.js)

| 插件 | 用途 |
| --- | --- |
| `vue()` | Vue 3 单文件组件支持 |
| `Pages()` | 自动基于 `src/pages` 目录生成路由，无需手动配置 |
| `Components()` | 自动导入组件，使用时无需手动 import |
| `compression` | 生产环境使用 Brotli 算法压缩输出 |

### 路径别名

- `@` → `src/` 目录

在导入时使用：`import Comp from '@/components/Comp.vue'`

### 路由约定

项目使用 `vite-plugin-pages`，路由基于文件结构自动生成：

```text
src/pages/
├── index.vue          → /
├── about.vue          → /about
└── users/
    ├── index.vue      → /users
    └── [id].vue       → /users/:id (动态路由)
```

### 环境变量

只有以 `VITE_` 为前缀的变量才会暴露给客户端代码。

## 架构说明

这是一个使用标准 Composition API 模式的 Vue 3 设置：

- **路由管理**: Vue Router 4 + vite-plugin-pages
- **状态管理**: Pinia 3
- **样式**: Less 预处理器

## 开发规范

### 组件拆分原则

- **优先拆分**: 将可复用的 UI 模块拆分为独立组件
- **单一职责**: 每个组件只负责一个功能模块
- **组件目录**: `src/components/` 下按功能模块组织

示例：

```text
src/components/
  ├── common/           # 通用组件
  │   ├── Button.vue
  │   └── Input.vue
  ├── layout/           # 布局组件
  │   ├── Header.vue
  │   └── Footer.vue
  └── business/         # 业务组件
      └── UserCard.vue
```

### CSS 样式规范

使用 `<style scoped>` 编写组件样式：

```vue
<template>
  <div class="box-col">内容</div>
</template>

<style scoped lang="less">
.box-col {
  display: flex;
}
.header-title {
  font-size: 18px;
}
</style>
```

**类名命名**: 使用 kebab-case（如 `box-col`、`header-title`）

### 布局开发规范

#### App.vue 结构

```text
App.vue
├── Header（固定在顶部）
└── <router-view />（页面内容）
```

#### 全局样式类 (src/style.less)

- `.flex`: flex 布局，水平垂直居中
- `.container`: 页面容器，全屏，垂直排列

#### 页面组件结构 (src/pages/)

```vue
<template>
  <div class="container">
    <div class="flex">
      页面内容
    </div>
  </div>
</template>
```

**规则**：
1. Header 组件统一放在 App.vue 的 `<router-view />` 上面
2. 页面组件只负责自己的 UI 展现，不需要写 header
3. 所有页面根元素使用 `.container`
4. 需要居中的内容用 `.flex` 包裹

### 开发完成规范

**重要：开发完成后不需要执行启动命令，用户会自己启动应用。**

### Pinia 状态管理规范

项目使用 **Pinia** 进行全局状态管理，使用 Options API 风格。

**Store 位置**: `src/store/index.js`

**Store 编写规范**：

1. **状态定义**: 在 `state()` 中定义响应式状态
2. **状态命名**: 使用简洁的名称，如 `account` 而不是 `walletAddress`
3. **方法定义**: 在 `actions` 中定义方法，通过 `this` 访问状态

**Store 示例**：

```javascript
import { defineStore } from 'pinia'

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    account: ''
  }),
  actions: {
    setAccount(address) {
      this.account = address
    }
  }
})
```

**组件中使用 Store**：

1. **直接使用**: 直接使用 store 对象访问状态和方法
2. **响应式**: Pinia 自动处理响应式，无需使用 toRefs

**组件示例**：

```vue
<script setup>
import { useWalletStore } from '@/store'

const walletStore = useWalletStore()

// 直接使用 store 访问状态和方法
const handleClick = () => {
  walletStore.setAccount('0x...')
}
</script>

<template>
  <!-- account 保持响应式 -->
  <div>{{ walletStore.account }}</div>
</template>
```

**重要原则**：

- 使用 Options API（state/actions）
- 使用简洁的变量名（如 `account`）
- 通过 `this` 访问 state
- 组件中直接使用 store 对象，无需 toRefs

### Web3 钱包开发规范

开发钱包相关功能时，使用 **viem** 库。

**重要**: 开发前请先阅读 [viem 官方文档](https://viem.sh/) 了解最新 API 用法。

**安装**:

```bash
npm install viem
```

**钱包连接流程**:

1. **创建钱包客户端**

   ```javascript
   import { createWalletClient, custom } from 'viem'
   import { mainnet } from 'viem/chains'

   const client = createWalletClient({
     chain: mainnet,
     transport: custom(window.ethereum)
   })
   ```

2. **请求授权** - 使用 `requestAddresses()` 触发钱包授权弹框

   ```javascript
   const [address] = await client.requestAddresses()
   ```

3. **获取已授权地址** - 使用 `getAddresses()` 获取已授权地址（不会触发弹框）

   ```javascript
   const [address] = await client.getAddresses()
   ```

```javascript
const [address] = await client.getAddresses()
```

**注意事项**:

- 首次连接必须使用 `requestAddresses()` 来触发用户授权
- 钱包相关状态必须使用 Pinia 全局管理
- 钱包地址使用 sessionStorage 持久化存储
- 监听钱包 `accountsChanged` 事件，账户切换时自动更新

## 已安装依赖

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| vue | ^3.5.24 | Vue 3 核心库 |
| vue-router | ^4.6.4 | 路由管理 |
| pinia | ^3.0.4 | 状态管理 |
| less | ^4.5.1 | CSS 预处理器 |
| vite-plugin-pages | ^0.33.2 | 自动生成路由 |
| unplugin-vue-components | ^30.0.0 | 自动导入组件 |
| vite-plugin-compression | ^0.5.1 | 构建压缩 |
| relayx-api | ^0.0.3 | RelayX API |
