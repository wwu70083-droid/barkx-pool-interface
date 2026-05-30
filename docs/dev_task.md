# Dev Task

冷却防护已经测试通过。

## 前端改进

1. 按钮改进：Confirm Incubation modal 点开时自动检测 conversion in fight 状态，会将 modal 中的 Confirm 按钮显示为 Conversion in Progress 文案，并冻结按钮。这样无需等到用户点击再报 toast。（但此 toast 逻辑保留备用）
2. 按钮改进：Confirm Incubation modal 点开时自动对比当前高度和合约中查询到的 lastConvertHeight，如果冷却未结束，会将 modal 中的 Confirm 按钮显示为 Conversion in Cooldown 文案，并冻结按钮。此情形的优先级比 Conversion in Progress 低。
3. 业务流程改良：当一个转换机制处于当日 Completed 状态时，要将橙色的 Inject vBARKX 按钮显示出来，否则，若用户消费了所有转换，当日就无法补充 injection 了，会造成困扰。
4. 数据展示改良：在 Inject vBARKX modal 内，补充一行统计行 My Injection，依然显示 XX.XX，不带单位。如果这里不显示统计行，那么，当用户消费了所有转换，外侧任何地方都看不到 My Injection 统计行了，会造成困扰。
5. 格式修改：排行榜中的地址缩略形式严格调整为 0x00...00，与原型对齐。
6. 格式修改：排行榜中的 BARKX 数量精度改为整数截断，与原型对齐。

