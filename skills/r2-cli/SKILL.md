---
name: r2-cli
description: R2-CLI 二手潮奢交易工具。用于认证登录、基本操作（登录、login、auth、商品、goods）。安装后 AI Agent 可直接调用全部交易能力。
---

# R2-CLI Skill

R2-CLI 是二手潮奢交易命令行工具，支持商品管理（上架/下架/改价/列表）、认证登录等。

## 安装

```bash
npm install -g @round2ai/r2-cli@latest
```

## 命令前缀自动检测

首次使用时检测一次，后续所有命令使用检测到的前缀：

1. 项目目录有 `package.json`（name 含 r2-cli）→ `npm run dev --`
2. 存在 `dist/r2-cli.js` → `node dist/r2-cli.js`
3. `r2-cli --version` 成功 → `r2-cli`

以下文档使用 `r2-cli` 作为前缀，根据检测结果替换。

> **注意**：部分平台 npm 会拦截 `--help`/`-h` 等 flag，若 `npm run dev -- --help` 显示的是 npm 帮助，改用 `npx tsx src/entrypoints/r2-cli.tsx --help`。

## 前置条件

- 必须先登录：`r2-cli auth login`（扫码登录，支持第二回合 APP / 微信 / 支付宝扫码）
- 检查登录状态：`r2-cli auth status`
- Token 过期后需重新登录（内存缓存带过期检查，不会无限使用过期 token）
- Token 存储在 `~/.r2-cli/config.json`（原子写入，防止中断导致丢失）

## 错误格式

Agent 子命令统一错误格式：

```json
{ "success": false, "error": "错误信息" }
```

Agent 应检查 `success` 字段判断成败。验证错误（如参数缺失、查找失败）也使用相同格式。

## 进程信号

- SIGINT（Ctrl+C）和 SIGTERM 均触发优雅退出，输出"操作已取消"并 exit(130)

## 认证命令 `r2-cli auth`

| 命令 | 说明 |
|------|------|
| `r2-cli auth login` | 扫码登录（显示 unicode 二维码 + 浏览器链接，支持第二回合 APP / 微信 / 支付宝扫码，页面实时更新状态） |
| `r2-cli auth xianyu` | 闲鱼店铺授权（扫码授权，链接页面展示第二回合品牌） |
| `r2-cli auth logout` | 退出登录 |
| `r2-cli auth status` | 查看登录状态和用户信息 |

> 认证登录的 Agent 两步式流程（qr + poll）见 **r2-auth** skill。Agent 调用 `qr` 子命令时，`qrUrl` 链接页面会实时更新扫码状态，成功后自动关闭。

## 商品管理命令 `r2-cli goods`

| 命令 | 说明 |
|------|------|
| `r2-cli goods shops [-p xianyu/douyin] [--json]` | 查看已授权店铺 |
| `r2-cli goods list [--status wait/on/sold/down] [--keyword <kw>] [--page <n>] [--size <n>] [--json]` | 寄售商品列表 |
| `r2-cli goods up` | 上架商品（交互式7步向导） |
| `r2-cli goods down <ids...>` | 下架商品（支持批量） |
| `r2-cli goods reup <ids...>` | 重新上架（支持批量） |
| `r2-cli goods price <id> --price <amount>` | 修改售价 |
| `r2-cli goods select [--stock-id <id>] [--stock-goods-id <id>] [--page <n>] [--size <n>] [--json]` | 选品商品列表（今日数据） |

### Agent 专用上架命令

| 命令 | 说明 |
|------|------|
| `r2-cli goods up info <id> [--shop <shopId>] [-p xianyu/douyin]` | 获取商品详情 + 预填值 |
| `r2-cli goods up address [--provinces/--cities/--areas/--save/--set]` | 设置/查看发货地址 |
| `r2-cli goods up categories` | 获取分类树 |
| `r2-cli goods up props <channelCatId> [--brand <keyword>]` | 获取分类属性 + 品牌搜索 |
| `r2-cli goods up submit --data @detail.json --division-id <id> --cat-id <id> --channel-cat-id <id> [可选参数...]` | 提交上架 |

> 商品上架的详细流程（交互式7步 + Agent 分步）见 **r2-goods** skill。

## 用户级命令

| 命令 | 说明 |
|------|------|
| `r2-cli shops [--json]` | 查看所有已授权店铺（跨平台：闲鱼/抖音等） |
| `r2-cli stocks [--json]` | 查看所有仓库 |

> 所有 `--json` 命令输出结构化 JSON，Agent 应优先使用。不加 `--json` 则输出人类可读的表格。
