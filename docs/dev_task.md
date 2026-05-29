# Dev Task

初步视觉验证成功。

https://barkx-pool.westworld.org 和 https://incubator-admin.westworld.org 都可以正常访问了。

你可以记载 serving setup 了。

业务测试稍后进行。

---

一个明显错误：测试代币合约地址配置

在 Settings 功能的 Smart Contracts 面板，我可以看到 BarkX Pool Interface 目前的环境配置。抛开本测试用不到的 USDT，本测试需要的 BARKX 和 vBARKX 地址都不是 SPEC 规定的地址，似乎都是前序开发人员留下的测试代币配置。

需要更正为我们所用的测试代币。

---

在 admin dashboard，我看到 On-chain approver=0x29204C012bB48806f3A2bF45591Aa924dA83F9C6，但目前我们难道不应该用 owner，也就是 0x5bC95902F404310020F6673049a89F00d5de0C2a 作为 approver 吗？

我没有 0x29204C012bB48806f3A2bF45591Aa924dA83F9C6 的控制权。

---

我发现我虽然有私钥，但我并没有你所生成的 owner 的 keystore 密码，所以每次重启后都必须由你代劳 unlock 后端。