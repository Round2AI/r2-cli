---
name: r2-auth
description: R2-CLI 认证登录专家。两步式扫码登录：生成二维码图片 + 轮询确认。用于登录、login、auth、扫码、二维码场景。
---

# R2-Auth Skill

两步式扫码登录，专为 AI Agent 设计。第一步生成二维码，Agent 将 unicodeQR 直接输出到聊天窗口展示给用户；第二步轮询等待用户扫码确认。

## 安装与调用方式

全局安装：
```bash
npm install -g @round2ai/r2-cli@latest
```

自动检测命令前缀（首次使用时执行一次）：
1. 项目目录有 `package.json`（name 含 r2-cli）→ 使用 `npm run dev --`
2. 存在 `dist/r2-cli.js` → 使用 `node dist/r2-cli.js`
3. `r2-cli --version` 成功 → 使用 `r2-cli`

以下文档使用 `r2-cli` 作为前缀，根据检测结果替换。

## 登录流程（两步）

### 第1步：生成二维码

```bash
r2-cli auth login qr
```

输出 JSON：
```json
{
  "qrToken": "xxx",
  "expireTimeMs": 300000,
  "pollIntervalMs": 800,
  "qrPath": "C:\\Users\\xxx\\.r2-cli\\qrcode.png",
  "unicodeQR": "█▀▀▀▀▀█ ..."
}
```

**Agent 必须**：将 `unicodeQR` 字段的值直接输出到聊天窗口（作为文本回复），不要使用 Read 工具读取 PNG 图片——聊天窗口无法渲染图片，但 unicode 半块字符（█▀▄）可以正常显示。

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

## 其他命令

| 命令 | 说明 |
|------|------|
| `r2-cli auth status` | 查看登录状态 |
| `r2-cli auth logout` | 退出登录 |

## 人类一键登录

```bash
r2-cli auth login
```

直接在终端显示 unicode 二维码，适合人类在 CLI 中使用。

## 注意事项

- Token 存储在 `~/.r2-cli/config.json`，过期会自动刷新
- 二维码默认5分钟过期，超时需重新执行第1步
- 登录成功后，后续 goods 等命令可直接使用
