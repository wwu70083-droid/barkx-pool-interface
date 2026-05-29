# Dev Task

我正在开始业务测试，逐步发现问题中。

## 用户前端

1. 在 Inject vBARKX modal 中点击 MAX，似乎是按照钱包余额扩大 18 个 0 了，检查此处的精度转换问题。
2. 在 Inject vBARKX modal 中，你的实现是点击 Inject 后开始 Approve，但这不符合整个生产版本已经落地的 Approve 风格。在 BarkX Pool Interface 的其他部分，页面会始终优先检测代币是否被 Approve 过，如果没有，按钮会直接显示 Approve vBARKX，而不显示 Inject vBARKX。如果因网络延迟等原因没能获取到 Approve 状态，也会直接以未 Approve 为缺省值，显示需要 Approve。去其他页面读一下现有逻辑，复刻过来。
3. 因 Approve 而调用钱包后，取消操作，发现 toast 为空白。去现有生产代码中为各种情形搜索 已经存在的 toast 编排，适配过来。对于 Incubator 专用的 toast 文案，现提供：

### Inject 专用

* 成功注入：Injection succeeded. XX.XX vBARKX has been injected.
* 失败注入：Failed.

### Confirm Incubation 专用

* 成功转换：Incubation succeeded. XX.XX BARKX has been converted.
* 失败转换：Failed.