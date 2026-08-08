# Dashbooard 修改

1. 删除整个 My Deposit Status 面板。

---

2. 将 BarkX Pool Rewards 面板改为 My BarkX Pool，内容：

- 2.0 Boosted APR：100.00%（每 3 秒自动交错轮换显示 Boosted APY）

- 2.1 Vector Nexus (VN)：0 VN

- 2.2 LP Token：0.000000 LP

- 2.3 Pending Rewards：0.00 BARKX

- 2.4 Total Achieved：0.00 BARKX

	（增强注释：Pending Network Incentives 统计行被永久抛弃了）

	将检测 Mode A 仓位的 Active Node 指示器合并到这里的 i 图标旁，点击后的提示框融合两个信息区：

	* 节点状态 Node Status

	* 复投率 Compound Eligibility

	此面板始终可见。

	此面板已修改为完全不透明。

---

3. 将 BarkX Elite Pool Rewards 面板改为 My BarkX Elite Pool，内容：

- 3.0 Boosted APR：75.00%（没有复投路径，只显示 APR）

- 3.1 Vector Nexus (VN)：0 VN

- 3.2 LP Token：0.000000 LP

- 3.3 Pending Rewards：0.00 BARKX

- 3.4 Total Achieved：0.00 BARKX

	可见性修改：当值 3.1-3.4 都是 0 时，隐藏此面板。（池未开发）

	此面板已修改为完全不透明。

---

4. 将 BarkX VIP Pool Rewards 面板改为 My BarkX VIP Pool，内容：

- 4.0 APR：56.50%（没有复投路径，只显示 APR）

- 4.1 Vector Nexus (VN)：0/0 VN

- 4.2 LP Token：0.00 vLP

- 4.3 Pending Rewards：0.00 BARKX

- 4.4 Total Achieved：0.00 BARKX

	可见性修改：当值 4.1-4.4 都是 0 时，隐藏此面板。（逻辑不再是检测白名单）
	
	此面板已修改为完全不透明。

---

5. 将 EarnX Rewards 面板改为 My EarnX，内容：

- 5.0 APR：10.00%（没有复投路径，只显示 APR）

- 5.1 My Postion：0.00 vBARKX

- 5.2 Pending Rewards：0.00 BARKX

- 5.3 Commission Received：0.00 BARKX

- 5.4 Total Achieved：0.00 BARKX

	可见性修改：当值 5.1-5.4 都是 0 时，隐藏此面板。（池未开发）

	此面板已修改为完全不透明。

---

6. 将 Assets in Wallet 面板挪到下方，位于 Pool Status 折叠面板上方。

	新增点击弹窗 Complete Asset Overview，展示更多资产类型。

	此面板始终可见。

	此面板已修改为完全不透明。

---

7. 原顶部 APY 改为 BARKX Market Cap，指 BARKX 的当前流通市值。

	barkxMarketCap = (totalSupply - multisigReserve) * barkxPrice

- totalSupply 就是 arbiscan 上显示的 token supply，是原始总铸造量减去黑洞地址的量。

- multisigReserve 是地址 0xBba6a2AAe9f99f79952f962252b355ED553DDe6d 中的量。

	使用金色字体。