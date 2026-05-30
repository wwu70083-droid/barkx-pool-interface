# Dev Task

两种转换机制均测通，DB Mirror 已改进。现在开始优化 admin 界面。

## Dashboard

学习 opendao-admin，在仪表盘增加 Latency to tip 实时监控。

## Users

## 故障

用户的精确搜索功能不可用，报 users: HTTP_500，需修复。

根据下方分类过滤原则，搜索时，因为结果是精确的，无视分类过滤，直接按结果进入指定的表，显示精确结果。

### 分类过滤

在搜索框 clear 按钮右侧新增表切换按钮：

* Injected Only：仅显示有过 inject 行为的用户列表
* Pre-inject Only：仅显示从未有过 inject 行为的用户列表

从不融合显示两个列表的内容，两种视图不同（字段多寡）。

在两种表视图右上角，再分别加上 Show Suspended Only 按钮，激活后只显示被禁用的账户。

#### Injected Only 视图

字段规划：

* Address
* Tier：快照取得的节点等级，格式为 0 到 5 的纯数字，不要带 T
* First Injection：首次 inject 的 UTC 时间，显示到日期 YYYY-MM-DD
* Injection：用户的当前 injection 量，四位小数截断
* Normal Incubation：以 Normal 机制生涯累积转换 BARKX 数量，四位小数截断
* Pending Normal Quota：最新个人 normal 配额（不累加）
* Leader Incubation：以 Leader 机制生涯累积转换 BARKX 数量，四位小数截断
* Pending Leader Quota：最新个人 leader 配额（会积累）
* Status：Active / Suspended
* Suspend Button

排序规则：本表按照 First Injection 字段排序，最早的在上。不要把 suspended 移动到队尾。

分页规则：每页最多 100 行。

#### Pre-inject Only 视图

字段规划：

* Address
* Tier：快照取得的节点等级，格式为 0 到 5 的纯数字，不要带 T（实际为 1 到 5，因为未注册 OpenDAO 的用户不可能有 leader quota 产生）
* Pending Leader Quota：最新个人 leader 配额（会积累）
* Status：Active / Suspended
* Suspend Button

排序规则：本表按照 Pending Leader Quota 字段排序，最多的在上。不要把 suspended 移动到队尾。

分页规则：每页最多 100 行。