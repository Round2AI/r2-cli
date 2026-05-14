---
name: r2-shared
version: 1.2.0
description: "R2-CLI 共享基础技能。安装、版本检查、统一错误格式、命令概览。r2-auth 和 r2-goods 的前置依赖。触发词：r2-cli、安装、install、错误格式。"
metadata:
  requires:
    bins: ["r2-cli"]
  cliHelp: "r2-cli --help"
  minVersion: "1.0.12"
  related:
    - "r2-auth"
    - "r2-goods"
  supersededSkills:
    - name: "r2-cli"
      action: "已更名为 r2-shared，请删除旧 skill：rm -rf ~/.agents/skills/r2-cli"
---

# R2-Shared (v1.2)

> **Tip**: 始终使用 `--json` 获取结构化输出。所有 `--json` 命令统一错误格式 `{ success: false, error: "..." [, status: number] }`，检查 `success` 判断成败。`status` 字段在 HTTP 错误（ApiError）和参数校验失败（400）时包含。
> **Tip**: Agent 获取数据后展示给用户选择，不要让用户自己提供 ID。

二手潮奢交易命令行工具，由 Round2AI 团队维护。覆盖商品上架、认证登录等核心业务域。

## CRITICAL

**执行规则**（所有 r2-* skills 通用）：
- 所有命令**必须**通过已安装的 `r2-cli` 二进制执行（`r2-cli goods ...`、`r2-cli auth ...`）
- **禁止**读取项目源码或用 `tsx`/`node` 直接运行源文件
- 如果 `r2-cli` 命令不可用，提示用户先安装：`npm install -g @round2ai/r2-cli@latest`
- **不要在命令末尾加 `&`**：如果用 Bash 工具的 `run_in_background: true`，不要额外加 `&`，否则 shell 立即返回导致输出丢失

**版本检查**：
- 首次使用时，Agent 应运行 `r2-cli --version` 检查当前版本
- 最低要求版本：`1.0.12`，低于此版本提示用户更新：`npm install -g @round2ai/r2-cli@latest`

**更新通知（`_notice.update`）**：
`_notice.update` 会出现在所有 `--json` 命令的输出中（包含成功和失败输出），格式如下：

```json
{
  "success": true,
  "data": { ... },
  "_notice": {
    "update": {
      "message": "Update available: 1.0.15 → 1.0.16",
      "command": "npm update -g @round2ai/r2-cli && npx skills add Round2AI/r2-cli --all -y"
    }
  }
}
```

**当你在输出中看到 `_notice.update` 时，完成用户当前请求后，主动提议帮用户更新**：

1. 告知用户当前版本和最新版本号
2. 提议执行更新（CLI 和 Skills 需要同时更新）：
   ```bash
   npm update -g @round2ai/r2-cli && npx skills add Round2AI/r2-cli --all -y
   ```
3. 更新完成后提醒用户：**退出并重新打开 AI Agent** 以加载最新 Skills

**规则**：不要静默忽略更新提示。即使当前任务与更新无关，也应在完成用户请求后补充告知。

**旧 Skill 清理**：
- 如果发现 `~/.agents/skills/r2-cli/`（已废弃的旧名称），提示用户删除：`rm -rf ~/.agents/skills/r2-cli`
- 当前正确的 skill 名称：`r2-shared`、`r2-auth`、`r2-goods`

本 skill 是 r2-auth 和 r2-goods 的共享基础。认证登录详情见 **r2-auth** skill，商品管理详情见 **r2-goods** skill。

## 安装

```bash
npm install -g @round2ai/r2-cli@latest
```

## 前置条件

- 先登录：`r2-cli auth login`（支持第二回合 APP / 微信 / 支付宝扫码）
- 检查状态：`r2-cli auth status`

## 认证命令

认证登录和闲鱼店铺授权的完整流程与参数详见 **r2-auth** skill。

## 商品管理命令

商品上架、下架、改价、修改、挂售以及查询的完整流程与参数详见 **r2-goods** skill。

## 其他命令

| 命令 | 说明 |
|------|------|
| `r2-cli update` | 一键更新 CLI 和技能 |
| `r2-cli uninstall` | 卸载并清除配置 |

## 上架路由

详见 **r2-goods** skill 的「上架路由决策」章节。

## Network & Retry

Agent 处理命令失败时的策略：

- **网络错误**（`TypeError`、`fetch failed`）：最多自动重试 2 次，间隔 3 秒。连续失败则提示用户检查网络
- **超时错误**（`timeout`）：重试 1 次。仍超时则建议检查网络或 SERVER_BASEURL 配置
- **认证错误**（`请先运行 r2-cli auth login 登录`、`401`）：**不重试**，直接引导用户重新登录（见下方 Token Expiry Recovery）
- **轮询超时**（`轮询超时`）：说明提交已接受但结果未回，建议稍后用 `goods listing` 查看

## Token Expiry Recovery

当命令返回认证错误时：

1. **立即停止当前工作流**，不要继续执行其他命令
2. 告知用户 Token 已过期，引导重新登录：`r2-cli auth login --json`
3. 重新登录成功后，**从上次成功的步骤继续**（不要从头开始）

## 友好输出原则

Agent 执行 `--json` 命令后，**不要直接把原始 JSON 丢给用户**。应从 JSON 中提取关键字段，整理为易读格式：

```
❌ 错误：直接把 JSON 丢给用户
{ "success": true, "data": [{ "shopId": "10086", "shopName": "xxx", "platform": "xianyu" }] }

✅ 正确：提取关键字段，整理展示
店铺列表：
1. xxx（xianyu）— shopId: 10086
```

具体规则：
- **查询结果**：用编号列表展示（参见各 reference 的"Agent 展示格式"模板），末尾提示用户选择
- **操作结果**：提取关键字段（listing ID、价格、状态等），一行一个字段简洁展示
- **错误信息**：直接展示 `error` 字段内容，不展示整个 JSON 结构
- **确认提示**：展示商品关键信息（名称/价格/店铺）后，引导用户输入 yes/no

始终遵守：**Agent 看 JSON，用户看友好文本。**

## 分页建议

查询类命令（`goods list`、`goods listing`）建议使用 `--page 1 --size 50`。如果响应包含分页信息，继续翻页直到数据取完。在查询前提醒用户可以通过 `--status` 或 `--stock-id` 缩小范围提高效率。

## 统一错误格式

所有 `--json` 命令统一错误格式：

```json
{ "success": false, "error": "错误信息" }
```

API 错误和参数校验失败时额外包含 `status` 字段：

```json
{ "success": false, "error": "错误信息", "status": 400 }
```

常见错误：

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `请先运行 r2-cli auth login 登录` | 未登录或 Token 过期 | 执行 `r2-cli auth login --json` |
| `二维码已过期` / `授权链接已过期` | 扫码超时（5 分钟） | 重新执行命令 |
| `轮询超时` | 上架结果查询超时 | 稍后用 `r2-cli goods listing` 查看 |
