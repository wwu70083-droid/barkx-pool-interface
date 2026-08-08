# BARKX Market Cap

## 计算方法

marketCap = ( totalSupply - [bypassSupply] ) * barkxPrice

### totalSupply

这是 arbiscan 上显示的实时 totalSupply，也就是原始铸造量减去黑洞地址中销毁的量。

### bypassSupply

这是一个地址集合，每次更新前端时核对此集合范围。

TBD 表示尚未部署。

| Type         | Address                                    | Name                      |
| ------------ | ------------------------------------------ | ------------------------- |
| 金库合约地址 | 0xBba6a2AAe9f99f79952f962252b355ED553DDe6d | Safe Multisig Contract    |
| 市值管理账户 | 0xEfa52ccD73FF2BBbaa3b7c1578c7dd6EF96474f3 | Market Maker EOA          |
| 矿池合约地址 | 0x7670f1B896dF2e03B37CCf428bf8a6035e3d33AB | BarkX Pool Contract       |
| 矿池合约地址 | 0x8c96376cC98dAfaB58DD97cE1b66A5688591d5E1 | BarkX Elite Pool Contract |
| 矿池合约地址 | 0x2f1D9540e9d60109715B5652f3609F19031CEbdc | BarkX VIP Pool Contract   |
| 矿池合约地址 | TBD                                        | Incubator Contract        |
| 矿池合约地址 | 0x0D10d65E15B3D380d78E600d848734b6003482Dc | OpenDAO Contract          |

