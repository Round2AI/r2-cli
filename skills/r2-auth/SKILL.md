---
name: r2-auth
version: 1.0.0
description: "R2-CLI 认证登录专家。扫码登录和闲鱼店铺授权。用于登录、login、auth、扫码、二维码、授权、xianyu、logout、登出、状态查询场景。Agent 使用 auth login --json 一步完成登录。Agent 必须先将 qrUrl 链接展示给用户，再等待扫码结果。"
metadata:
  requires:
    bins: ["r2-cli"]
  cliHelp: "r2-cli auth --help"
  related:
    - "r2-shared"
---

# R2-Auth (v1)

> **Tip**: Agent 使用 `--json` 一步完成登录：生成二维码 + 自动打开浏览器 + 自动轮询。**必须先将 qrUrl 展示给用户**，再等待扫码结果。
> **Tip**: 二维码 5 分钟过期，超时需重新执行命令。Token 存储在 `~/.r2-cli/config.json`。

扫码登录 + 闲鱼店铺授权，专为 AI Agent 设计。

## CRITICAL

**CRITICAL -- 开始前 MUST 先用 Read 工具读取 [../r2-shared/SKILL.md](../r2-shared/SKILL.md)**，其中包含执行规则、版本检查、统一错误格式、网络重试策略和 Token 过期恢复流程。

命令执行规则见 **r2-shared** skill 的「执行规则」。安装、统一错误格式见 **r2-shared** skill。

---

## 扫码登录（auth login）

### 一步式（推荐）

```bash
r2-cli auth login --json
```

命令会依次输出两段 JSON：

> ⚠️ **命令会自动轮询，不需要（也不应该）手动调用 `auth login poll`。只需等待命令完成即可。**

**第 1 段：二维码信息（立即输出）**

```json
{
  "qrToken": "xxx",
  "expireTimeMs": 300000,
  "pollIntervalMs": 800,
  "qrUrl": "http://127.0.0.1:52173/login/"
}
```

| 字段 | 说明 |
|------|------|
| `qrToken` | 二维码 token（轮询用，不需要手动使用） |
| `expireTimeMs` | 二维码过期时间（毫秒），默认 5 分钟 |
| `qrUrl` | 本地扫码页面链接（**请在浏览器中打开此链接**，页面会显示二维码供手机扫描） |

> ⚠️ **浏览器可能无法自动打开**：请手动复制 `qrUrl` 在浏览器中打开。用户使用**第二回合 APP / 微信 / 支付宝**扫描页面上的二维码。

**第 2 段：登录结果（用户扫码确认后输出）**

```json
{ "success": true, "userInfo": { "nickname": "...", "mobile": "..." } }
```

### Agent 操作步骤

> ⚠️ **不要手动轮询**：`auth login --json` 已内置自动轮询，不要用 `auth login poll` 单独轮询。
> ⚠️ **不要在命令末尾加 `&`**：如果工具已有后台执行选项，不要额外加 `&`，否则输出丢失。

1. 启动 `r2-cli auth login --json`（异步/后台执行，设置 5 分钟超时）
2. 读取命令输出，获取第 1 段 JSON（QR 信息）
3. **必须先**将 `qrUrl` 以醒目格式展示给用户：

   ```
   请在浏览器中打开此链接扫码登录：http://127.0.0.1:PORT/login/
   ```

4. **不要关闭/中断命令** — 命令正在自动轮询，等待用户扫码
5. 告知用户：用**第二回合 APP / 微信 / 支付宝**扫描页面上的二维码。浏览器会尝试自动打开扫码页面，**如未自动打开请手动复制上方链接在浏览器中打开**
6. 继续读取命令输出，等待第 2 段 JSON（登录结果，最长 5 分钟）
7. 检查第 2 段 JSON 的 `success` 字段判断登录是否成功

**为什么必须先展示链接**：浏览器自动打开在 Windows/远程服务器/SSH 环境下经常失败。`qrUrl` 是用户扫码的唯一保障，必须优先展示并提示手动打开。

---

## 闲鱼店铺授权（auth xianyu）

流程与登录类似，同样一步完成：

```bash
r2-cli auth xianyu --json
```

**第 1 段：授权二维码信息（立即输出）**

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
| `qrUrl` | 本地浏览器授权页面链接 |

**第 2 段：授权结果（用户扫码确认后输出）**

```json
{ "success": true, "shopId": "...", "shopName": "..." }
```

Agent 操作步骤与登录相同：启动命令 → 获取第 1 段 JSON → **先展示 `qrUrl`** → **不要中断命令，等待第 2 段 JSON**。同样不要手动轮询。

---

## 其他命令

| 命令 | 说明 | 详细文档 |
|------|------|----------|
| `r2-cli auth login` | 扫码登录（人类使用，自动打开浏览器） | [r2-auth-login](references/r2-auth-login.md) |
| `r2-cli auth xianyu` | 闲鱼店铺授权（人类使用，自动打开浏览器） | [r2-auth-login](references/r2-auth-login.md) |
| `r2-cli auth login poll --token <>` | 手动轮询登录状态（备选，不推荐） | [r2-auth-login](references/r2-auth-login.md) |
| `r2-cli auth xianyu poll --state <>` | 手动轮询授权状态（备选，不推荐） | [r2-auth-login](references/r2-auth-login.md) |
| `r2-cli auth status` | 查看登录状态 | [r2-auth-status](references/r2-auth-status.md) |
| `r2-cli auth logout` | 退出登录 | [r2-auth-logout](references/r2-auth-logout.md) |

---

## 错误处理

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `请先运行 r2-cli auth login 登录` | 未登录或 Token 过期 | 执行 `r2-cli auth login --json` |
| `二维码已过期` | 扫码超时（5 分钟） | 重新执行命令 |
| `授权链接已过期` | 授权扫码超时（5 分钟） | 重新执行命令 |
| `网络连接失败` | API 服务不可达 | 检查网络连接，确认 SERVER_BASEURL 配置 |
