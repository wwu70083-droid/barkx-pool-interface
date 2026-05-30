# Dev Task

已经测通 normal incubator，现在开始测试 leader incubator，为此，需要构造数据，模拟拉取的 OpenDAO 收益账本。

## 构造 mock fixture

已准备好测试地址，需按下表构造模拟数据：

| userAddress | tier | incomeToday | feedbackToday |
|--------------------------------------------|----|----------|---------|
| 0x7091473Ea5A2E6eBd60E186a66c10e8D09AA78cf | T1 | 0 BARKX | 0 BARKX |
| 0xf21CF16479a716bF59Be7Ac1E062c5029092F604 | T1 | 10 BARKX | 0 BARKX |
| 0x3dB757e02DeEf039BA524b00F006141B66CFe70e | T2 | 0 BARKX | 10 BARKX |
| 0x8E552A42703079d8F442159148b643cA1645233d | T2 | 20 BARKX | 100 BARKX |
| 0x52fbdB4E97d1974aD43D1d3F0bf79C45109342Bf | T3 | 30 BARKX | 0 BARKX |
| 0x3De7878E16e65AAdAEbB44e1013546096Aa70A41 | T3 | 30 BARKX | 100 BARKX |
| 0xA8A58078982C684C3aa90f554898e7187bd0DD83 | T4 | 40 BARKX | 0 BARKX |
| 0xEc1F4705dE4F777dA0AFEea7000cF156fb54012E | T4 | 40 BARKX | 100 BARKX |
| 0xcECe2eD4B956A4fBf19ca2FbDD5378C131511E63 | T5 | 50 BARKX | 0 BARKX |
| 0x9f96255bC85068c6d310F1463f04A3b11BEcd6D6 | T5 | 50 BARKX | 100 BARKX |

你只构造数据并准备好让后端使用，我来触发计算和测试。
