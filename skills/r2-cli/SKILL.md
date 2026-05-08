---
name: r2-cli
description: R2-CLI 二手潮奢交易工具。用于认证登录、商品上架。Agent 获取数据后展示给用户选择，完成 4 步上架流程。
---

# R2-CLI Skill

R2-CLI 是二手潮奢交易命令行工具，支持商品上架、认证登录等。

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
- Token 过期后需重新登录
- Token 存储在 `~/.r2-cli/config.json`

## 错误格式

Agent 子命令统一错误格式：

```json
{ "success": false, "error": "错误信息" }
```

Agent 应检查 `success` 字段判断成败。

## 进程信号

- SIGINT（Ctrl+C）和 SIGTERM 均触发优雅退出

## 认证命令 `r2-cli auth`

| 命令 | 说明 |
|------|------|
| `r2-cli auth login` | 扫码登录（交互式，人类使用） |
| `r2-cli auth login qr` | 生成登录二维码 JSON（Agent 第1步） |
| `r2-cli auth login poll --token <>` | 轮询登录状态 JSON（Agent 第2步） |
| `r2-cli auth xianyu` | 闲鱼店铺授权（交互式） |
| `r2-cli auth xianyu qr` | 获取授权二维码 JSON（Agent 第1步） |
| `r2-cli auth xianyu poll --state <>` | 轮询授权状态 JSON（Agent 第2步） |
| `r2-cli auth status` | 查看登录状态 |
| `r2-cli auth logout` | 退出登录 |

> 认证登录的 Agent 两步式流程见 **r2-auth** skill。

## 商品管理命令 `r2-cli goods`

| 命令 | 说明 |
|------|------|
| `r2-cli goods shops [--json]` | 查看所有已授权店铺 |
| `r2-cli goods stocks [--json]` | 查看所有仓库 |
| `r2-cli goods list --stock-id <id> [--json]` | 查看仓库中的选品商品 |
| `r2-cli goods listing --stock-goods-id <id> --shop-id <id> [--json]` | 查询上架信息 |
| `r2-cli goods up` | 交互式上架 |
| `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` | Agent 直接上架（自动轮询结果） |

### Agent 上架 4 步流程

**核心理念：Agent 获取数据后展示给用户选择，不要让用户自己提供 ID。**

1. `r2-cli goods shops --json` → 展示店铺列表（shopId、shopName、platform）→ 用户选择
2. `r2-cli goods stocks --json` → 展示仓库列表（stockId、stockName）→ 用户选择
3. `r2-cli goods list --stock-id <id> --json` → 展示商品列表（stockGoodsId、goodsName、brand、size、salePrice）→ 用户选择
4. `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` → 提交上架（自动轮询结果）

> 完整流程和参数说明见 **r2-goods** skill。
