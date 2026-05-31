# Dev Task

## 1. 掌握进度

先读取 dev_guide.md，以及所有关联的文档，掌握项目信息。

然后摸排四仓库，掌握项目实现进度。

## 2. 安全审计后里程碑

打包当前英文界面版 BarkX Incubator 四仓库实现，打 tag 备份，设为第二个里程碑。

## 3. 实施 i18n

对 incubator 页面进行翻译，严格按照 barkx-pool-interface 中其他已经落地生产的功能所涉及的语言种类实施。

可在 settings 页面找到语言切换 modal。

翻译前，先摸排已经存在的 i18n 字典，确保新增翻译继承常用词汇，保持一致性。

以下是对繁体中文版的特别定制词汇表，其他语言你自己处理。

* Incubate = 孵化
* Incubation = 孵化
* Incubator = 孵化池
* Gateway = 網關
* Normal Incubation = 常規孵化
* Leader Incubation = 領袖孵化
* quota = 配額
* Inject = 注入
* Injection = 注入
* Injected = 已注入
* 30-Day Average Weighted = 30 日均存量加權
* 30-Day Average Injection = 30 日均注入量
* map = 映射
* Node Signal Model = 節點訊號模型
* Node Feedback Model = 節點反饋模型
* Dynamic Reward = 動態獎勵
* Feedback Reward = 反饋獎勵
* Node Weight = 節點權重
* Node Tier = 節點等級
* Nova = 新星
* Voyager = 探險
* Navigator = 領航
* Commander = 指揮
* Stellar Master = 星際
* Relay = 中繼

注意：

* OpenDAO Partner API = OpenDAO Partner API
* 不翻译阿拉伯语版本
* 不得对其他已落地生产的功能的文本造成修改，包括 toast 等
* 不翻译 admin 页面
