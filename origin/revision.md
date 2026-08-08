# v1.6.3

全局修正：检查所有页面所有弹窗，当弹窗出现时，锁定底层页面的上下滚动。（当前除了 VIP 邀请函，其他所有弹窗都存在下层滚动不锁定的问题）

## menu

二级菜单结构 Featured Pools（特选矿池），收纳三种分矿池：

* BarkX 精英矿池（ePool）

* BarkX VIP 矿池（vPool 不再对非白名单用户隐藏，显示但保持灰色不可进入）

* 孵化池（incubator，保持隐藏）

已移除 EarnX。

## dashboard

（注意保持更新 marketCap 计算公式中的 bypass 集合）

1. 面板 My BarkX Elite Pool，内容：

- 3.1 Boosted APR：0.00%（没有复投路径，但支持提速）

- 3.2 Vector Nexus (VN)：0 VN

- 3.3 LP Token：0.000000 LP

- 3.4 Pending Rewards：0.00 BARKX

- 3.5 Total Achieved：0.00 BARKX

	可见性：当值 3.2-3.5 都是 0 时，隐藏此面板。

2. 面板 My Incubator，内容：

- 2.1 My Deposit：0.00 vBARKX

- 2.2 30-Day Average：0.00 vBARKX

- 2.3 My Quota Today：0.00 vBARKX

- 2.4 Total Incubated：0.00 BARKX

	新增了 Node Weight 弹窗提示。

	可见性：当值 2.1-2.4 都是 0 时，隐藏此面板。

## swap

（没有改进）

## liquidity

（没有改进）

## pool

在 Personal Status 新增 Estimate 帮助估算 LP 配置。

## ePool

在 Personal Status 新增 Estimate 帮助估算 LP 配置。

修正了取款界面的按钮、字符琥珀色样式。

给领取按钮添加限制条件：当 pending rewards 低于 1 BARKX 时，按钮均处于不可点击状态，文案显示为 Less than 1 BARKX。

新增排行榜面板。

注：对排行榜采取懒加载，展开才加载。

## vPool

（没有改进）

## incubator

暂缓开发。

新增了整个功能。

当用户执行完当日转换后，提示明天再来。

注：对排行榜采取懒加载，展开才加载。

## nodeBoost

（没有改进）

## vn

（保持 Used VN 选项卡不可用）

## settings

恢复显示 vBARKX 合约地址。
