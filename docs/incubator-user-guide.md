# 孵化池

孵化池按照 1 : 1 的固定比例将 vBARKX 转化为 BARKX。如果节点未将 vBARKX 应用到精英矿池，还可以选择使用孵化池，逐步地转换 vBARKX 至 BARKX。

存在两种不同的孵化机制，分为常规孵化（Normal Incubation）和领袖孵化（Leader Incubation）。两种孵化机制的转换配额各自独立。

无论采用哪种孵化方式，都必须先将 vBARKX 注入孵化池。在转换时，智能合约始终调用孵化池中现存的 vBARKX 进行转换，不会从钱包中调用 vBARKX。

每个节点每天可以在两种孵化机制下各执行一次转换。转换费率均为零。

---

## 常规孵化

### 每日转换配额

BarkAI 动态管理常规孵化机制的每日转换总配额。

每天 00:45 UTC 之后，孵化池更新每一个节点的常规转换配额。每笔转换是按当前可用配额全量转换。常规的每日转换配额只能在当天使用，不会积累到第二天。

要获取常规转换配额，节点必须向孵化池提前注入 vBARKX。每日快照统计的是节点的过去 30 日平均 vBARKX 存量。随后，通过从 OpenDAO Partner API 获得数据，BarkAI 为每一个节点的日均存量加权。

> 注入（Inject）操作是不可逆的。孵化池中的 vBARKX 只能被转换，不可被取出。

### 计算配额

在某日，一个节点的当日转换配额的计算遵循如下公式：

`NodeWeightedAvgInjection = NodeAvgInjection * NodeWeight`

`NormalQuota = NodeWeightedAvgInjection / GlobalWeightedAvgInjection * GlobalQuota`

* `NodeWeightedAvgInjection` 是该节点的日均存量加权。
* `NodeAvgInjection` 是该节点的日均存量。
* `NodeWeight` 是该节点的 OpenDAO 权重。
* `NormalQuota` 是该节点的当日转换配额。
* `GlobalWeightedAvgInjection` 是全体节点的日均存量加权之和。
* `GlobalQuota` 是此孵化池的当日转换总配额。

> 现阶段，影响加权的要素是 OpenDAO 节点的等级（Tier）。未注册 OpenDAO 的节点，由于没有节点等级，其加权为 1，即无加成。

---

## 领袖孵化

### 映射配额

孵化池从 OpenDAO 节点讯号模型（Node Signal Model）和节点反馈模型（Node Feedback Model）的收入数据中映射领袖转换配额。在某一日，一个节点的动态收益（Dynamic Reward）与反馈收益（Feedback Reward）会被自动映射为其在领袖孵化机制中的转换配额。

每天 00:45 UTC 之后，通过从 OpenDAO Partner API 获得数据，孵化池更新每一个节点的领袖转换配额。每笔转换是按当前可用配额全量转换。如果当日的领袖转换配额未被使用，会自动积累。

### 映射效率

在某日，一个节点的当日转换配额的映射遵循如下公式：

`LeaderQuota = DynamicReward * DynamicMappingEfficiency + FeedbackReward * FeedbackMappingEfficiency`

* `DynamicReward` 是该节点的当日动态收益。
* `DynamicMappingEfficiency` 是该节点的动态收益的映射效率。
* `FeedbackReward` 是该节点的当日反馈收益。
* `FeedbackMappingEfficiency` 是该节点的反馈收益的映射效率。
* `LeaderQuota` 是该节点的当日转换配额。

> 现阶段，影响映射效率的要素是 OpenDAO 节点的等级（Tier）。未注册 OpenDAO 的节点，由于没有节点等级，且没有可映射的动态收益和反馈收益，其转换配额始终是零。
