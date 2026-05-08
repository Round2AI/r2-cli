---
name: r2-auth
description: R2-CLI 认证登录专家。两步式扫码登录：生成二维码图片 + 轮询确认。用于登录、login、auth、扫码、二维码场景。
---

# R2-Auth Skill

两步式扫码登录，专为 AI Agent 设计。第一步生成二维码，Agent 同时输出 unicodeQR 和 qrUrl 链接展示给用户（可使用 第二回合 APP / 微信 / 支付宝 扫码）；第二步轮询等待用户扫码确认。

## 安装

```bash
npm install -g @round2ai/r2-cli@latest
```

## 命令前缀

见 **r2-cli** skill 的"命令前缀自动检测"章节。以下文档使用 `r2-cli` 作为前缀，根据检测结果替换。

## 登录流程（两步）

### 第1步：生成二维码

```bash
r2-cli auth login qr
```

输出 JSON：
```json
{
  "qrToken": "xxx",
  "url": "https://m.puresnake.com/r2/auth/login?qrToken=xxx&from=wechat",
  "expireTimeMs": 300000,
  "pollIntervalMs": 800,
  "qrPath": "C:\\Users\\xxx\\.r2-cli\\qrcode.png",
  "qrImageBase64": "data:image/png;base64,iVBOR...",
  "qrUrl": "http://127.0.0.1:52173",
  "unicodeQR": "█▀▀▀▀▀█ ..."
}
```

**Agent 必须同时展示以下两种方式，让用户自行选择**：

1. 将 `unicodeQR` 直接输出到聊天窗口（unicode 半块字符 █▀▄ 可显示为 QR 码）
2. 输出 `qrUrl` 链接供用户点击在浏览器中打开，格式：`请点击链接打开二维码：http://127.0.0.1:xxxxx`

两种方式缺一不可——终端可能不支持 unicode 半块字符，也可能无法打开本地链接，同时展示确保至少一种可用。用户可使用 **第二回合 APP / 微信 / 支付宝** 扫码，链接页面会展示第二回合品牌和所有支持的扫码方式。

### 第2步：立即轮询登录状态

**关键**：输出二维码后，Agent 必须立即在后台启动轮询，不要等待用户回复。

```bash
r2-cli auth login poll --token <qrToken> --expire <expireTimeMs> --interval <pollIntervalMs>
```

使用 Bash 工具的 `run_in_background: true` 启动轮询，然后用 `TaskOutput` 阻塞等待结果。参数取自第1步返回的 JSON 字段。

成功输出：
```json
{
  "success": true,
  "userInfo": { "nickname": "...", "mobile": "..." },
  "token": "..."
}
```

失败输出：
```json
{
  "success": false,
  "error": "轮询超时 ..."
}
```

## 闲鱼店铺授权

授权闲鱼店铺，流程与扫码登录类似（两步式）。

### 第1步：获取授权二维码

```bash
r2-cli auth xianyu qr
```

输出 JSON：
```json
{
  "state": "xxx",
  "url": "https://open.api.goofish.com/authorize?...",
  "expireTimeMs": 300000,
  "pollIntervalMs": 1000,
  "qrPath": "C:\\Users\\xxx\\.r2-cli\\xianyu-auth-qrcode.png",
  "qrImageBase64": "data:image/png;base64,iVBOR...",
  "qrUrl": "http://127.0.0.1:52173",
  "unicodeQR": "█▀▀▀▀▀█ ..."
}
```

**Agent 渲染策略**：同登录流程——必须同时展示 `unicodeQR` 和 `qrUrl` 链接，让用户自行选择。用户可使用 **第二回合 APP / 微信 / 支付宝** 扫码。

### 第2步：轮询授权状态

```bash
r2-cli auth xianyu poll --state <state> --expire <expireTimeMs> --interval <pollIntervalMs>
```

成功输出：
```json
{ "success": true, "shopId": "...", "shopName": "..." }
```

失败输出：
```json
{ "success": false, "error": "授权状态: expired" }
```

## 其他命令

| 命令 | 说明 |
|------|------|
| `r2-cli auth status` | 查看登录状态 |
| `r2-cli auth logout` | 退出登录 |

## 人类一键登录

```bash
r2-cli auth login
```

同时显示 unicode 二维码和浏览器链接，用户任选一种扫码。链接页面展示"第二回合"品牌和三种扫码方式（第二回合 APP / 微信 / 支付宝），扫码状态实时更新（等待 → 已扫码 → 登录成功），成功后页面显示"登录成功"并自动关闭。

## 人类一键授权

```bash
r2-cli auth xianyu
```

同登录流程：同时显示 unicode 二维码和浏览器链接，链接页面展示"第二回合"品牌，授权状态实时更新，成功后页面自动关闭。

## 注意事项

- Token 存储在 `~/.r2-cli/config.json`（原子写入，防止中断导致丢失），过期后需重新登录
- 内存缓存的 token 带过期检查（5 分钟安全边际），过期自动重新读取
- 二维码默认5分钟过期，超时需重新执行第1步
- 轮询支持 SIGINT/SIGTERM 中止，Ctrl+C 立即取消等待（sleep 响应 abort 信号）
- 登录成功后，后续 goods 等命令可直接使用
- `qr` 子命令会在后台轮询状态，链接页面实时更新（等待 → 已扫码 → 登录成功），成功后自动关闭服务器
- `qr` 子命令的进程在服务器关闭后自动退出，无需手动终止
- QR 链接页面采用第二回合品牌色（`#06d290`），展示品牌标识和三种扫码方式标签
