---
name: r2-auth
description: R2-CLI 认证登录专家。扫码登录和闲鱼店铺授权。用于登录、login、auth、扫码、二维码、授权、xianyu、logout、登出、状态查询场景。Agent 使用 auth login --json 一步完成登录。Agent 必须先将 qrUrl 链接展示给用户，再等待扫码结果。
---

# R2-Auth Skill

扫码登录 + 闲鱼店铺授权，专为 AI Agent 设计。

## 命令前缀

见 **r2-cli** skill 的"命令前缀自动检测"章节。以下文档使用 `r2-cli` 作为前缀，根据检测结果替换。

---

## 扫码登录（一步式，推荐）

一条命令完成：生成扫码页面 + 自动打开浏览器 + 自动轮询登录状态：

```bash
r2-cli auth login --json
```

命令会依次输出两段 JSON：

### 第 1 段：二维码信息（立即输出）

```json
{
  "qrToken": "xxx",
  "expireTimeMs": 300000,
  "pollIntervalMs": 800,
  "url": "https://m.puresnake.com/r2/auth/login?qrToken=xxx&from=wechat",
  "qrUrl": "http://127.0.0.1:52173/login/"
}
```

| 字段 | 说明 |
|------|------|
| `qrToken` | 二维码 token（轮询用，不需要手动使用） |
| `expireTimeMs` | 二维码过期时间（毫秒），默认 5 分钟 |
| `pollIntervalMs` | 轮询间隔（毫秒），不需要手动使用 |
| `url` | 扫码链接（用户也可手动访问） |
| `qrUrl` | 本地浏览器扫码页面链接 |

### 第 2 段：登录结果（用户扫码确认后输出）

成功：

```json
{ "success": true, "userInfo": { "nickname": "...", "mobile": "..." } }
```

失败：

```json
{ "success": false, "error": "二维码已过期" }
```

### Agent 操作步骤

1. 用 Bash 工具 `run_in_background: true` 启动命令
2. 用 `TaskOutput(block=true, timeout=5000)` 获取第 1 段 JSON
3. **必须先**将 `qrUrl` 以醒目格式单独一行展示给用户：

   ```
   扫码登录：http://127.0.0.1:PORT/login/
   ```

4. 告知用户：浏览器会尝试自动打开扫码页面，如未打开请手动点击上方链接。用户可使用**第二回合 APP / 微信 / 支付宝**扫码。
5. 用 `TaskOutput(block=true, timeout=300000)` 等待第 2 段 JSON（登录结果）
6. 检查 `success` 字段判断登录是否成功

**为什么必须先展示链接**：自动打开浏览器在某些环境下可能失败（远程服务器、SSH、无头终端）。链接是用户扫码的唯一保障，必须优先展示。

> 旧版两步式流程（先 `auth login qr` 再 `auth login poll`）已废弃。如需手动轮询，可使用 `auth login poll --token <>`。

---

## 闲鱼店铺授权

流程与登录类似，同样一步完成：

```bash
r2-cli auth xianyu --json
```

### 第 1 段：授权二维码信息（立即输出）

```json
{
  "state": "xxx",
  "expireTimeMs": 300000,
  "pollIntervalMs": 1000,
  "qrUrl": "http://127.0.0.1:PORT/login-xianyu/"
}
```

| 字段 | 说明 |
|------|------|
| `state` | 授权状态 token（轮询用） |
| `expireTimeMs` | 过期时间（毫秒），默认 5 分钟 |
| `pollIntervalMs` | 轮询间隔（毫秒） |
| `qrUrl` | 本地浏览器授权页面链接 |

### 第 2 段：授权结果（用户扫码确认后输出）

成功：

```json
{ "success": true, "shopId": "...", "shopName": "..." }
```

失败：

```json
{ "success": false, "error": "授权链接已过期" }
```

Agent 操作步骤与登录相同：
1. 获取第 1 段 JSON
2. **先展示 `qrUrl` 链接给用户**（单独一行，醒目格式）
3. 告知用户浏览器会尝试自动打开，如未打开请手动点击链接
4. 等待第 2 段 JSON

---

## 其他命令

| 命令 | 说明 |
|------|------|
| `r2-cli auth login` | 扫码登录（自动打开浏览器，人类使用） |
| `r2-cli auth login --json` | 扫码登录（输出 JSON + 自动打开浏览器，Agent 推荐） |
| `r2-cli auth login poll --token <>` | 手动轮询登录状态（备选，不推荐） |
| `r2-cli auth xianyu` | 闲鱼店铺授权（自动打开浏览器，人类使用） |
| `r2-cli auth xianyu --json` | 闲鱼店铺授权（输出 JSON + 自动打开浏览器，Agent 推荐） |
| `r2-cli auth xianyu poll --state <>` | 手动轮询授权状态（备选，不推荐） |
| `r2-cli auth status` | 查看登录状态 |
| `r2-cli auth logout` | 退出登录 |

---

## 注意事项

- 命令会尝试自动打开浏览器展示扫码页面，但链接始终会输出到终端，确保即使浏览器未打开用户也能手动访问
- 二维码默认 5 分钟过期，超时需重新执行命令
- 登录成功后 Token 存储在 `~/.r2-cli/config.json`（原子写入，防止中断导致丢失），后续 `goods` 等命令可直接使用
- 内存缓存的 Token 带过期检查（5 分钟安全边际），过期自动重新读取
