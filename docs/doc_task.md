# Doc Task

## dev_guide.md

均值的计算方法得到了非常重要的修正。如果用你之前的计算方式，新进入的用户会有巨大的优势，因为他的分母小，可能第一天以巨量 vBARKX 注入就能在下一个刷新点得到超大配额。这是一个业务漏洞，现在被修补了。

时间加速调试工具是重要的测试模块。需要单独给一个章节介绍一下此工具如何使用。

立即将近期实现整理到 dev_guide.md，确保文档跟上开发进度，并且没有过时信息。

## dev_guide_fix.md

如果开发和测试中遇到有价值的踩坑经验，整理到 dev_guide_fix.md 中说明，仅在 dev_guide.md 留下摘要指向，不要把 dev_guide.md 拖成流水账。

## incubator_partner_api_integration_guide.md

严格仿照 opendao_partner_api_integration_guide.md，编写 incubator_partner_api_integration_guide.md