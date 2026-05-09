# R2-CLI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@round2ai/r2-cli.svg)](https://www.npmjs.com/package/@round2ai/r2-cli)

R2-CLI — 二手潮奢交易命令行工具，由 [Round2AI](https://github.com/Round2AI) 团队维护 — 让人类和 AI Agent 都能在终端中完成商品上架等交易操作。

覆盖商品上架、认证登录等核心业务域，提供 7 个商品命令及 3 个 AI Agent [Skills](./skills/)。

[安装](#安装与快速开始) · [AI Agent 快速开始](#快速开始ai-agent) · [Agent Skills](#agent-skills) · [认证](#认证) · [命令](#命令参考) · [安全](#安全与风险提示)

## 为什么选 R2-CLI？

- **为 Agent 原生设计** — 3 个 Skills 开箱即用，适配 Claude Code 等主流 AI 工具，Agent 无需额外适配即可操作
- **AI 友好调优** — 每条命令经过 Agent 实测验证，提供结构化 JSON 输出和智能默认值，大幅提升 Agent 调用成功率
- **双模架构** — 交互式向导（人类友好）+ `--json` 参数（Agent 友好），同一命令两种调用方式
- **三分钟上手** — 扫码登录即可使用，从安装到第一次商品上架只需三步

## 功能

| 类别 | 能力 |
|------|------|
| 认证登录 | 扫码登录（第二回合 APP / 微信 / 支付宝）、闲鱼店铺授权、状态查询、登出（Agent 一步式流程） |
| 商品管理 | 商品上架（4 步流程：获取店铺 → 获取仓库 → 获取选品商品 → 提交上架 + 自动轮询上架结果）、店铺查看、仓库查看、选品商品查看、上架列表查询、下架、改价 |

---

## 安装与快速开始

> **AI Agent 注意**：如果你是 AI Agent 且正在协助用户，请直接跳转到[快速开始（AI Agent）](#快速开始ai-agent)。

### 安装

```bash
npm install -g @round2ai/r2-cli@latest
```

### 使用

```bash
# 1. 扫码登录
r2-cli auth login

# 2. 查看授权店铺
r2-cli goods shops

# 3. 交互式上架
r2-cli goods up
```

---

## 快速开始（AI Agent）

> 以下步骤面向 AI Agent。部分步骤需要用户配合（扫码、确认）。

**第 1 步 — 安装**

```bash
# 安装 CLI
npm install -g @round2ai/r2-cli@latest

# 安装 Skills（必需）
npx skills add Round2AI/r2-cli --all -y
```

**第 2 步 — 登录**

> Agent 使用 `auth login --json` 一步完成登录（自动打开浏览器 + 自动轮询登录状态）：

```bash
r2-cli auth login --json
```

命令自动打开浏览器展示扫码页面，输出 QR JSON，用户扫码确认后自动输出登录结果。

**第 3 步 — 验证**

```bash
r2-cli auth status
```

**第 4 步 — 商品上架（4 步流程）**

> Agent 获取数据后展示给用户选择，不要让用户自己提供 ID。

```bash
# 1. 获取店铺 → 展示 shopId/shopName/platform → 用户选择
r2-cli goods shops --json

# 2. 获取仓库 → 展示 stockId/stockName → 用户选择
r2-cli goods stocks --json

# 3. 获取选品商品 → 展示 stockGoodsId/goodsName/brand/size/salePrice → 用户选择
r2-cli goods list --stock-id <stockId> --json    # 按仓库过滤
r2-cli goods list --stock-goods-id <id> --json   # 或按商品 ID 查询

# 4. 提交上架（自动轮询上架结果）
r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json
```

---

## Agent Skills

安装 Skills 是 AI Agent 使用 R2-CLI 的**必需步骤**。Skills 包含命令用法、登录流程、商品管理全流程等详细指令，Agent 安装后才能正确调用 R2-CLI。

```bash
# GitHub（公开仓库）
npx skills add Round2AI/r2-cli --all -y
```

安装后 AI 助手获得 3 个 Skills：

| Skill | 说明 |
|-------|------|
| `r2-auth` | 认证登录：一步式扫码登录（生成二维码 + 自动轮询，支持第二回合 APP / 微信 / 支付宝）、闲鱼店铺授权、状态查询、登出 |
| `r2-cli` | 命令概览：安装检测、认证命令、商品管理命令、命令前缀自动识别 |
| `r2-goods` | 商品管理：4 步上架流程（获取数据 → 展示给用户 → 用户选择 → 提交上架 + 自动轮询结果）、下架、改价、店铺/仓库/商品/上架列表查看 |

---

## 认证

| 命令 | 说明 |
|------|------|
| `r2-cli auth login` | 扫码登录（自动打开浏览器，人类使用） |
| `r2-cli auth login --json` | 扫码登录（自动打开浏览器 + JSON 输出，Agent 推荐） |
| `r2-cli auth login poll --token <>` | 手动轮询登录状态（备选，不推荐） |
| `r2-cli auth xianyu` | 闲鱼店铺授权（自动打开浏览器，人类使用） |
| `r2-cli auth xianyu --json` | 闲鱼店铺授权（自动打开浏览器 + JSON 输出，Agent 推荐） |
| `r2-cli auth xianyu poll --state <>` | 轮询授权状态 JSON（备选，不推荐） |
| `r2-cli auth status` | 查看登录状态 |
| `r2-cli auth logout` | 退出登录 |

Token 存储在 `~/.r2-cli/config.json`（原子写入防丢失），过期后需重新登录。内存缓存带过期检查，不会使用失效凭证。扫码登录自动打开浏览器展示品牌化扫码页面（实时更新扫码状态，成功后自动关闭），同时输出链接到终端作为备选。支持第二回合 APP、微信、支付宝扫码。

---

## 命令参考

### 商品管理

| 命令 | 说明 |
|------|------|
| `r2-cli goods shops [--json]` | 查看所有已授权店铺（跨平台） |
| `r2-cli goods stocks [--json]` | 查看所有仓库 |
| `r2-cli goods list [--stock-id <id>] [--stock-goods-id <id>] [--json]` | 查看选品商品（可按仓库或商品 ID 过滤，支持 `--page` 和 `--size`） |
| `r2-cli goods listing [--json]` | 查询上架列表（支持 `--id` / `--shop-id` / `--stock-goods-id` / `--stock-id` / `--status` / `--platform` 过滤） |
| `r2-cli goods up` | 交互式上架（自动轮询上架结果） |
| `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` | Agent 直接上架（自动轮询上架结果） |
| `r2-cli goods down --id <id> [--json]` | 下架商品（也可用 `--stock-goods-id <id> --shop-id <id>`） |
| `r2-cli goods price --id <id> --price <amount> [--json]` | 修改上架价格（也可用 `--stock-goods-id <id> --shop-id <id>`） |

### 上架参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--stock-goods-id <id>` | 是 | 库存商品 ID（来自选品商品列表的 `stockGoodsId` 字段） |
| `--shop-id <id>` | 是 | 第三方店铺 ID（来自店铺列表的 `shopId` 字段，不是 `id`） |
| `--price <amount>` | 是 | 上架价格（正数） |
| `-p, --platform <platform>` | 否 | 平台，默认 xianyu |
| `--json` | 否 | JSON 输出（Agent 推荐） |

### 其他命令

| 命令 | 说明 |
|------|------|
| `r2-cli uninstall` | 卸载 R2-CLI 并清除所有配置 |

---

## 安全与风险提示

本工具可供 AI Agent 调用以自动化操作二手潮奢交易，Agent 将以您的用户身份在授权范围内执行操作，可能导致商品误上架、价格错误等风险，请谨慎操作。

建议：
- Agent 提交前向用户确认关键参数（售价、店铺）
- Token 存储在本地 `~/.r2-cli/config.json`（原子写入，防止中断导致配置丢失），注意保护

---

## 关于 Round2AI

Round2AI 由 PURESNAKE 团队开发。

**使命：让潮奢循环交易没有摩擦。**

PURESNAKE 深耕二手潮奢交易流通 6 年，累计鉴定超 400 万单，自建 6 座质检云仓，全国员工超 100 人，B2B 平台年成交规模超 1 亿。业务覆盖回收、鉴定、质检、仓储、定价、销售全链路。

**R2-CLI 帮商家解决三件事：买什么，卖多少钱，怎么卖掉。**

---

## 技术信息

| | |
|---|---|
| 语言 | Node.js (TypeScript) |
| 协议 | MIT |
| 安装 | `npm install -g @round2ai/r2-cli` |
| 授权 | `r2-cli auth login` |
| AI Agent Skills | 3 |
| 数据源 | 通过 ERP 对接各电商平台、线下 POS、自营仓储 WMS |

---

Already used by merchants in production.

_Round2AI — 让潮奢循环交易没有摩擦。_

_Reduce friction in circular commerce._
