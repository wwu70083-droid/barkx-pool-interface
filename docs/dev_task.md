# Dev Task

两件事：

1. 当前测试网合约改 feeRate 为 1%，这将是生产默认参数。以后不再是 0.5%。
2. 写面向生产部署的合约部署脚本，推送到 https://github.com/wwu70083-droid/barkx-orderbook-contract，我将从 macOS 上用 foundry 部署。
    - 主网 BARKX 合约地址：0x55279F3c138521B0395BC8b76d123E94f1d935B2
    - 主网 vBARKX 合约地址：0x081Ac2F123972a4F36D23cd9e7Be7E3d2Fae2EF8
    - 主网部署者 EOA：0x6df0AA79Ed1564FF99c1f3A15dD0c4f7a9c710f7
    - deployer = owner，无需 transferOwnership
    
部署时，我会把 ankr rpc、arbiscan api key、deployer private key 写到 .env 里，你提供 .env Sample 即可。

还缺什么部署参数，问我。

