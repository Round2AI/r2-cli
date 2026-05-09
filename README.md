# R2-CLI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@round2ai/r2-cli.svg)](https://www.npmjs.com/package/@round2ai/r2-cli)

R2-CLI — 二手潮奢交易命令行工具，由 [Round2AI](https://github.com/Round2AI) 团队维护 — 让人类和 AI Agent 都能在终端中完成商品上架等交易操作。

覆盖商品上架、认证登录等核心业务域，提供 3 个 AI Agent [Skills](./skills/)。

[安装](#安装与快速开始) · [AI Agent 快速开始](#快速开始ai-agent) · [Agent Skills](#agent-skills) · [认证](#认证) · [命令](#命令参考) · [安全](#安全与风险提示)

## 为什么选 R2-CLI？

- **为 Agent 原生设计** — 3 个 Skills 开箱即用，适配 Claude Code 等主流 AI 工具，Agent 无需额外适配即可操作
- **AI 友好调优** — 每条命令经过 Agent 实测验证，提供结构化 JSON 输出和智能默认值，大幅提升 Agent 调用成功率
- **双模架构** — 交互式向导（人类友好）+ `--json` 参数（Agent 友好），同一命令两种调用方式
- **三分钟上手** — 扫码登录即可使用，从安装到第一次商品上架只需三步

## 功能

| 类别 | 能力 |
|------|------|
| 认证登录 | 扫码登录（第二回合 APP / 微信 / 支付宝）、闲鱼店铺授权、状态查询、登出（支持 Agent 两步式流程） |
| 商品管理 | 商品上架（4 步流程：获取店铺 → 获取仓库 → 获取选品商品 → 提交上架 + 自动轮询上架结果）、店铺查看、仓库查看、选品商品查看 |

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
# 局域网私有部署：
# npx skills add http://192.168.0.99:3000/puresnake/r2-cli.git -y -g
```

**第 2 步 — 登录**

> Agent 不要直接运行 `r2-cli auth login`（交互式命令），使用两步式流程：

```bash
# 生成二维码，将 unicodeQR 输出给用户扫码
r2-cli auth login qr

# 用户扫码后，立即轮询确认（后台运行）
r2-cli auth login poll --token <qrToken> --expire <expireTimeMs> --interval <pollIntervalMs>
```

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
r2-cli goods list --stock-id <stockId> --json

# 4. 提交上架（自动轮询上架结果）
r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json
```

---

## Agent Skills

安装 Skills 是 AI Agent 使用 R2-CLI 的**必需步骤**。Skills 包含命令用法、登录流程、商品管理全流程等详细指令，Agent 安装后才能正确调用 R2-CLI。

```bash
# GitHub（公开仓库）
npx skills add Round2AI/r2-cli --all -y

# 局域网 Git 服务（私有部署）
npx skills add http://192.168.0.99:3000/puresnake/r2-cli.git -y -g
```

安装后 AI 助手获得 3 个 Skills：

| Skill | 说明 |
|-------|------|
| `r2-auth` | 认证登录：两步式扫码登录（生成二维码 → 轮询确认，支持第二回合 APP / 微信 / 支付宝）、状态查询、登出 |
| `r2-cli` | 命令概览：安装检测、认证命令、商品管理命令、命令前缀自动识别 |
| `r2-goods` | 商品管理：4 步上架流程（获取数据 → 展示给用户 → 用户选择 → 提交上架 + 自动轮询结果）、交互式上架、店铺/仓库/商品查看、上架查询 |

---

## 认证

| 命令 | 说明 |
|------|------|
| `r2-cli auth login` | 扫码登录（交互式，人类使用） |
| `r2-cli auth login qr` | 生成二维码 JSON（Agent 第1步） |
| `r2-cli auth login poll --token <>` | 轮询登录状态 JSON（Agent 第2步） |
| `r2-cli auth xianyu` | 闲鱼店铺授权（交互式，人类使用） |
| `r2-cli auth xianyu qr` | 获取授权二维码 JSON（Agent 第1步） |
| `r2-cli auth xianyu poll --state <>` | 轮询授权状态 JSON（Agent 第2步） |
| `r2-cli auth status` | 查看登录状态 |
| `r2-cli auth logout` | 退出登录 |

Token 存储在 `~/.r2-cli/config.json`（原子写入防丢失），过期后需重新登录。内存缓存带过期检查，不会使用失效凭证。扫码登录支持两种方式：终端 unicode 二维码 + 浏览器链接（页面展示第二回合品牌，实时更新扫码状态，成功后自动关闭）。支持第二回合 APP、微信、支付宝扫码。

---

## 命令参考

### 商品管理

| 命令 | 说明 |
|------|------|
| `r2-cli goods shops [--json]` | 查看所有已授权店铺（跨平台） |
| `r2-cli goods stocks [--json]` | 查看所有仓库 |
| `r2-cli goods list --stock-id <id> [--json]` | 查看仓库中的选品商品 |
| `r2-cli goods listing --stock-goods-id <id> --shop-id <id> [--json]` | 查询上架信息 |
| `r2-cli goods up` | 交互式上架（自动轮询上架结果） |
| `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount>` | Agent 直接上架（自动轮询上架结果，`--json`） |
| `r2-cli goods down --id <id> [--json]` | 下架商品 |
| `r2-cli goods price --id <id> --price <amount> [--json]` | 修改上架价格 |

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

### 开发中

> 以下命令已显示在 `--help`，执行时提示暂未实现。

| 命令 | 说明 |
|------|------|
| `r2-cli ingest` | ERP 数据对接 |
| `r2-cli ask` | 自然语言查询经营数据 |
| `r2-cli demand` | 市场需求热度扫描 |
| `r2-cli fulfillment` | 履约全链路追踪 |
| `r2-cli simulate` | 竞价成交模拟 |
| `r2-cli bidding-strategy` | 竞价策略建议 |
| `r2-cli decide` | 经营动作建议 |
| `r2-cli agent` | AI Agent 集成 |

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
