# R2-CLI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@round2ai/r2-cli.svg)](https://www.npmjs.com/package/@round2ai/r2-cli)

R2-CLI — 二手潮奢交易命令行工具，由 [Round2AI](https://github.com/Round2AI) 团队维护 — 让人类和 AI Agent 都能在终端中完成商品上架、下架、改价、经营分析等交易操作。

覆盖商品管理、认证登录、经营分析、市场分析、价格分析、库存履约等核心业务域，提供 30+ 命令及 3 个 AI Agent [Skills](./skills/)。

[安装](#安装与快速开始) · [AI Agent 快速开始](#快速开始ai-agent) · [Agent Skills](#agent-skills) · [认证](#认证) · [命令](#命令参考) · [安全](#安全与风险提示)

## 为什么选 R2-CLI？

- **为 Agent 原生设计** — 3 个 Skills 开箱即用，适配 Claude Code、Codex 等主流 AI 工具，Agent 无需额外适配即可操作
- **AI 友好调优** — 每条命令经过 Agent 实测验证，提供结构化 JSON 输出和智能默认值，大幅提升 Agent 调用成功率
- **双模架构** — 交互式向导（人类友好）+ JSON 原子子命令（Agent 友好），同一流程两种调用方式
- **三分钟上手** — 扫码登录即可使用，从安装到第一次商品上架只需四步

## 功能

| 类别 | 能力 |
|------|------|
| 🔐 认证登录 | 扫码登录、状态查询、登出（支持 Agent 两步式流程） |
| 📦 商品管理 | 上架、下架、重新上架、改价、商品列表 |
| 🏪 店铺管理 | 查看已授权店铺（闲鱼/抖音） |
| 📊 经营分析 | 日报/周报、自然语言查询经营数据 |
| 🔍 市场分析 | 市场需求热度、竞价模拟、策略建议 |
| 💰 价格分析 | 收货价/售卖价建议、在售商品优化 |
| 📦 库存履约 | 滞销预警、库龄超期、履约追踪 |
| 🧠 经营决策 | 补货/清仓/调价/风控建议 |

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

# 3. 查看待上架商品
r2-cli goods list --status wait

# 4. 交互式上架（7 步向导）
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

**第 4 步 — 开始使用**

```bash
# 查看待上架商品
r2-cli goods list --status wait

# Agent 分步上架（6 步）
r2-cli goods up info <id>          # 获取商品详情
r2-cli goods up categories         # 获取分类
r2-cli goods up props <catId>      # 获取属性
r2-cli goods up submit ...         # 提交上架
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
| `r2-auth` | 认证登录：两步式扫码登录（生成二维码 → 轮询确认）、状态查询、登出 |
| `r2-cli` | 命令概览：安装检测、认证命令、商品管理命令、命令前缀自动识别 |
| `r2-goods` | 商品管理：交互式7步上架向导、Agent 分步上架（info/categories/props/submit）、下架、改价、列表 |

---

## 认证

| 命令 | 说明 |
|------|------|
| `r2-cli auth login` | 扫码登录（交互式，人类使用） |
| `r2-cli auth login qr` | 生成二维码 JSON（Agent 第1步） |
| `r2-cli auth login poll --token <>` | 轮询登录状态 JSON（Agent 第2步） |
| `r2-cli auth status` | 查看登录状态 |
| `r2-cli auth logout` | 退出登录 |

Token 存储在 `~/.r2-cli/config.json`，过期自动刷新。

---

## 命令参考

### 商品管理

| 命令 | 说明 |
|------|------|
| `r2-cli goods shops -p <xianyu\|douyin>` | 查看已授权店铺 |
| `r2-cli goods list --status <status>` | 商品列表（wait/on/sold/down） |
| `r2-cli goods up` | 交互式上架（7 步向导） |
| `r2-cli goods down <ids...>` | 下架商品（支持批量） |
| `r2-cli goods reup <ids...>` | 重新上架（支持批量） |
| `r2-cli goods price <id> --price <amount>` | 修改售价 |

### Agent 专用上架命令

| 命令 | 说明 |
|------|------|
| `r2-cli goods up info <id>` | 获取商品详情 + 预填值 |
| `r2-cli goods up address` | 设置/查看发货地址 |
| `r2-cli goods up categories` | 获取分类树 |
| `r2-cli goods up props <catId>` | 获取分类属性 |
| `r2-cli goods up submit --data @file.json ...` | 提交上架 |

### 开发中

| 命令 | 说明 |
|------|------|
| `r2-cli report generate` | 经营日报/周报 |
| `r2-cli pricing analyze` | 价格分析建议 |
| `r2-cli inventory risk` | 风险管理 |

---

## 安全与风险提示

本工具可供 AI Agent 调用以自动化操作二手潮奢交易，Agent 将以您的用户身份在授权范围内执行操作，可能导致商品误上架、价格错误等风险，请谨慎操作。

建议：
- 上架前使用 `r2-cli goods up info` 确认商品详情
- Agent 提交前向用户确认关键参数（售价、类目）
- Token 存储在本地 `~/.r2-cli/config.json`，注意保护

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
| 命令数 | 30+ |
| AI Agent Skills | 3 |
| 数据源 | 通过 ERP 对接各电商平台、线下 POS、自营仓储 WMS |

---

Already used by merchants in production.

_Round2AI — 让潮奢循环交易没有摩擦。_

_Reduce friction in circular commerce._
