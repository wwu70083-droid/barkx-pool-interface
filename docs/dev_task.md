# Dev Task

初步视觉验证成功。

https://barkx-pool.westworld.org 和 https://incubator-admin.westworld.org 都可以正常访问了。

业务测试稍后进行。

先解决一个明显错误：测试代币合约地址配置

在 Settings 功能的 Smart Contracts 面板，我可以看到 BarkX Pool Interface 目前的环境配置。抛开本测试用不到的 USDT，本测试需要的 BARKX 和 vBARKX 地址都不是 SPEC 规定的地址，似乎都是前序开发人员留下的测试代币配置。

需要更正为我们所用的测试代币。

另外，我发现我虽然有私钥，但我并没有你所生成的 owner 的 keystore 密码，所以每次重启后都必须由你代劳 unlock 后端。