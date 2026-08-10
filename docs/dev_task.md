# Dev Task

运营团队现在遇到问题：我们已经上线了 chatx 网页版，现在用户可以使用 barkx agent 操作矿池，然而，大量用户尚未意识到这一点，使用 chatx 的人很少。

解决思路：在三个矿池的 rewards tab 上新增引流 modal，引导用户去 chatx 链接。

## 设计

注意 modal 的色彩风格必须遵循所在 pool 的自有 style。

modal 上应向用户显示的内容：

### 文案

- 强烈建议前往 BarkX Chat 使用 AI 来处理未领奖励，并操作其他矿池事务，享受 Crypto + AI 新体验
- 社区每周日举行一次抽奖，过去一周使用 BarkX Chat 指挥 AI 的节点，自动参与抽奖
- 在一周内让 AI 代理完成矿池操作的次数越多，节点获奖概率越高
- 奖金（AI Bonus）最高可达每节点 100 BARKX
- 请在 Discord 了解抽奖情况

### 按钮

- 前往 BarkX Chat
    - 以新选项卡打开 https://chat.barkx.xyz/
    - 在 https://barkx-pool.westworld.org/#/pool?tab=rewards 用此页面的蓝
    - 在 https://barkx-pool.westworld.org/#/e-pool?tab=rewards 用此页面的青
    - 在 https://barkx-pool.westworld.org/#/v-pool?tab=rewards 用此页面的琥珀
- 放弃使用 AI
    - 用于关闭此 modal
    - modal 展开后，显示过倒计时 3 秒才可用
    - 可用前为灰色冻结态
    - 可用后为红色
- 加入 Discord
    - i18n 处于繁体中文时，以新选项卡打开 https://discord.gg/barkcn
    - i18n 处于繁体中文之外的其他语种时，以新选项卡打开 https://discord.gg/barkai
    - 紫色按钮

### 启动

只要用户切换到：

- https://barkx-pool.westworld.org/#/pool?tab=rewards
- https://barkx-pool.westworld.org/#/e-pool?tab=rewards
- https://barkx-pool.westworld.org/#/v-pool?tab=rewards

就会立刻展示相应 modal。

不支持利用 cookie 等任何方式让此特性休眠。

### 关闭

只能用「放弃」按钮关闭 modal。

不提供右上角 x 按钮。

不支持点击空白处关闭。

## 实现

在 main 直接干，然后推送并部署 VPS-2。

先只做英文版，暂不翻译其他语言，等待验收后再做其他 i18n 工序。

除了此 modal 的必要增量，别的都不动。