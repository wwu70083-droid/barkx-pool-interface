# Dev Task

现象：当我在 confirm 调用钱包后主动取消 convert，刷新页面回来进入 modal，会看到 confirm 按钮依然是 pending for relay，而且不知道要等待多久。

推测：后端依然认为有一个 convert 请求在 pending，并且当前 discard 逻辑和等待时长不清楚。

意见：先明确在 in-flight 防护不受影响的前提下，请求的 discard 是如何工作的，然后尝试尽量缩短等待时间，让用户可以尽快合法地重新发起 convert。
