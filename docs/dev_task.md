# Dev Task

## 样式对齐

1. 原型 incubator_sample.html 的 Inject vBARKX modal 的宽度是与通用面板等宽的，你的实现中 modal 宽度做窄了。按原型样式调整宽度。
2. 原型 incubator_sample.html 的配色风格是自带的海蓝色，而不是 style.css 的通用蓝紫色。你观察几个现有生产模块的页面风格，会发现 e-pool、v-pool 各有自己的主题色，incubator 也是如此。重新读取原型文件规定的色彩风格，完成实现。
3. 原型 incubator_sample.html 的页面底部还有 Powered by OpenDAO 字样，当前实现漏了，需补充。
4. Normal Incubation 和 Leader Incubation 中的 Less than 1 BARKX 字体规格是不是没统一？肉眼感觉 Normal Incubation 的 Less than 1 BARKX 小一点。核查一下。

## 文案对齐

以下 modal 的文案都要和原型 incubator_sample.html 的对齐，我帮你抄录在这里。你再去原型里看一下。

1. OpenDAO Node Weight modal 的文案是：

This value is securely fetched from the **OpenDAO Partner API**.

It acts as a multiplier applied directly to your 30-Day Average Injection. A higher weight factor significantly amplifies your competitive proportion in the daily snapshot, securing a larger share of the BARKX conversion quota.

2. Dynamic Reward Mapping modal 的文案是：

This value is securely fetched from the **OpenDAO Partner API**.

It acts as a factor to directly map your OpenDAO Dynamic Reward into the leader's incubation quota.

3. Feedback Reward Mapping modal 的文案是：

This value is securely fetched from the **OpenDAO Partner API**.

It acts as a factor to directly map your OpenDAO Feedback Reward into the leader's incubation quota.

4. Inject vBARKX modal 的文案是：

Inject your vBARKX to build your 30-day average balance. Daily snapshots taken at **00:45 UTC** determine your share for the BARKX conversion quota in the next day.

5. 另外，原型里两个不同机制的 Confirm Incubation modal 各自采用了不同的文案，你去原型里找来分别对齐。

## 数据源

在你关闭后端服务期间，我查看用户前端，发现与 SPEC 不符合的现象。当后端下线时，前端依然可以读合约，那么，根据 SPEC 要求的：

* My Injection：用户在合约中的有效存量，读合约 userInjection
* Injected：严格等于 My Injection

这些值应该从合约中正常读取。但前端上，这些值也都显示为 0，说明它们是从后端读的。分析得对吗？




