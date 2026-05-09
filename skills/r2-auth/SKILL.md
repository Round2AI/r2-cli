---
name: r2-auth
description: R2-CLI 认证登录专家。两步式扫码登录和闲鱼店铺授权。用于登录、login、auth、扫码、二维码、授权、xianyu、logout、登出、状态查询场景。Agent 生成二维码后同时展示 unicodeQR 和 qrUrl 给用户。
---

# R2-Auth Skill

两步式扫码登录 + 闲鱼店铺授权，专为 AI Agent 设计。

## 命令前缀

见 **r2-cli** skill 的"命令前缀自动检测"章节。

## 扫码登录（两步）

### 第 1 步：生成二维码

```bash
r2-cli auth login qr
```

输出 JSON：
```json
{
  "qrToken": "xxx",
  "expireTimeMs": 300000,
  "pollIntervalMs": 800,
  "unicodeQR": "█▀▀▀▀▀█ ...",
  "url": "https://m.puresnake.com/r2/auth/login?qrToken=xxx&from=wechat",
  "qrUrl": "http://127.0.0.1:52173/login/"
}
```

**Agent 必须同时展示以下两种方式**：

1. 将 `unicodeQR` 直接输出到聊天窗口（unicode 半块字符 █▀▄ 可显示为 QR 码）
2. 输出 `qrUrl` 链接供用户点击在浏览器中打开

两种方式缺一不可。用户可使用**第二回合 APP / 微信 / 支付宝**扫码。

### 第 2 步：立即轮询登录状态

**关键**：输出二维码后，Agent 必须立即在后台启动轮询，不要等待用户回复。

```bash
r2-cli auth login poll --token <qrToken> --expire <expireTimeMs> --interval <pollIntervalMs>
```

使用 Bash 工具的 `run_in_background: true` 启动，然后用 `TaskOutput` 阻塞等待。参数取自第 1 步返回的 JSON。

成功：`{ "success": true, "userInfo": { "nickname": "...", "mobile": "..." }, "token": "..." }`
失败：`{ "success": false, "error": "轮询超时 ..." }`

## 闲鱼店铺授权（两步）

流程与登录相同。

```bash
# 第 1 步
r2-cli auth xianyu qr
# → { "state": "xxx", "expireTimeMs": 300000, "pollIntervalMs": 1000, "unicodeQR": "...", "qrUrl": "..." }

# 第 2 步
r2-cli auth xianyu poll --state <state> --expire <expireTimeMs> --interval <pollIntervalMs>
# → 成功：{ "success": true, "shopId": "...", "shopName": "..." }
```

Agent 同样必须同时展示 `unicodeQR` 和 `qrUrl`。

## 其他命令

| 命令 | 说明 |
|------|------|
| `r2-cli auth status` | 查看登录状态 |
| `r2-cli auth logout` | 退出登录 |

## 注意事项

- 二维码默认 5 分钟过期，超时需重新执行第 1 步
- 登录成功后，后续 goods 等命令可直接使用
