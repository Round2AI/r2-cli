# R2-CLI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@round2ai/r2-cli.svg)](https://www.npmjs.com/package/@round2ai/r2-cli)

R2-CLI — 二手潮奢交易命令行工具，由 [Round2AI](https://github.com/Round2AI) 团队维护 — 让人类和 AI Agent 都能在终端中完成商品上架等交易操作。

覆盖商品上架、挂售、商品信息修改、认证登录等核心业务域，提供 16 个命令及 3 个 AI Agent [Skills](./skills/)。

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
| 商品管理 | 商品上架（4 步流程：获取店铺 → 获取仓库 → 获取选品商品 → 提交上架 + 自动轮询上架结果）、商品信息修改（AI 读图识别 → 自动匹配类目/属性 → 提交修改）、店铺查看、仓库查看、选品商品查看、上架列表查询、下架、改价 |
| 闲鱼挂售 | 图片上传（自动压缩大图、并行上传、失败重试）→ AI 读图识别商品信息 → 自动匹配类目/属性 → 提交挂售（自动补属性） |

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
| `r2-shared` | 共享基础：安装、统一错误格式、命令概览 |
| `r2-auth` | 认证登录：一步式扫码登录（生成二维码 + 自动轮询，支持第二回合 APP / 微信 / 支付宝）、闲鱼店铺授权、状态查询、登出 |
| `r2-goods` | 商品管理：4 步上架流程、挂售流程、商品信息修改（AI 读图识别 → 自动匹配类目/属性 → 提交）、下架、改价、店铺/仓库/商品/上架列表查看 |

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

### 商品查询

| 命令 | 说明 |
|------|------|
| `r2-cli goods shops [--json]` | 查看所有已授权店铺（跨平台） |
| `r2-cli goods stocks [--json]` | 查看所有仓库 |
| `r2-cli goods list [--stock-id <id>] [--stock-goods-id <id>] [--json]` | 查看选品商品（可按仓库或商品 ID 过滤，支持 `--page` 和 `--size`，最大 50） |
| `r2-cli goods listing [--json]` | 查询上架列表（支持 `--id` / `--shop-id` / `--stock-goods-id` / `--stock-id` / `--status <init|up|down|fail|sold>` / `--platform` 过滤，支持 `--page` / `--size` 分页） |

### 商品上架/下架/改价

| 命令 | 说明 |
|------|------|
| `r2-cli goods up` | 交互式上架（自动轮询上架结果） |
| `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` | Agent 直接上架（自动轮询上架结果） |
| `r2-cli goods down --id <id> [--json]` | 下架商品（也可用 `--stock-goods-id <id> --shop-id <id>`） |
| `r2-cli goods price --id <id> --price <amount> [--json]` | 修改上架价格（也可用 `--stock-goods-id <id> --shop-id <id>`） |

### 修改商品信息

修改已上架商品的标题、描述、品牌、类目、图片、属性等。Agent 可自动读图识别并填充商品信息。

| 命令 | 说明 |
|------|------|
| `r2-cli goods edit --id <id> --category-id <id> --channel-cat-id <id> --json` | 修改商品信息（必填：定位参数 + 类目） |
| `r2-cli goods edit --id <id> --category-id <id> --channel-cat-id <id> --image-ids <ids> --item-attrs <json> --brand-name <name> --json` | 带图片和属性修改 |

**定位商品**：优先使用 `--id <goodsListingId>`（从上架列表 `id` 字段获取），也可用 `--stock-goods-id <id> --account <shopId>`。**必填参数**：定位参数（二选一）+ `--category-id` + `--channel-cat-id`（后端必填）

**可选参数**：`--title`、`--desc`、`--image-ids`（需先通过 `hang-up upload-images` 上传）、`--item-attrs`（JSON）、`--brand-name`、`--stuff-status`、`--goods-no`、`--original-price`、`--size`

### 闲鱼挂售（完整商品信息模式）

挂售模式支持完整的商品信息：图片、类目、属性、品牌等。Agent 可自动识别图片内容填充商品信息，流程：上传图片 → AI 识别 → 匹配类目/属性 → 提交。

| 命令 | 说明 |
|------|------|
| `r2-cli goods hang-up categories [--json]` | 获取闲鱼类目列表（大分类 → 小分类） |
| `r2-cli goods hang-up props --channel-cat-id <id> [--json]` | 获取指定类目下的属性列表（含可选值） |
| `r2-cli goods hang-up brands --channel-cat-id <id> --prop-id <id> --key <keyword> [--json]` | 品牌搜索 |
| `r2-cli goods hang-up upload-images --shop-id <id> --files <paths> --json` | 批量上传图片到闲鱼（挂售前必须先上传） |
| `r2-cli goods hang-up submit --shop-id <id> --title <> --price <> --category-id <> --channel-cat-id <> --image-ids <> --stuff-status <> --desc <> --out-item-no <> --json` | 提交挂售上架 |

**挂售必填参数**：`--shop-id`、`--title`、`--price`、`--category-id`（大分类 ID）、`--channel-cat-id`（小分类 ID）、`--image-ids`（图片 ID，逗号分隔）、`--stuff-status`（成色：100 全新 / -1 准新 / 99 99新 / 95 95新 / 90 9新）、`--desc`（商品描述）、`--out-item-no`（商家编码，同店铺唯一）

**挂售可选参数**：`--brand-name`、`--size`、`--goods-no`、`--original-price`、`--item-attrs`（属性列表 JSON）、`--trade-type`（默认 0 仅在线）、`--transport-fee`（默认 0 包邮）、`--yhb`（验货宝）、`--division-id`（默认 330100 杭州）

**售后服务**（默认关闭）：提交时自动附带售后服务配置，默认全部关闭。卖家需在闲鱼 APP 开通对应服务后才能开启（我的 → 设置 → 卖家服务 → 保障服务）。

### 其他命令

| 命令 | 说明 |
|------|------|
| `r2-cli update` | 一键更新 CLI 和技能 |
| `r2-cli uninstall` | 卸载 R2-CLI 并清除所有配置 |

---

## 安全与风险提示

本工具可供 AI Agent 调用以自动化操作二手潮奢交易，Agent 将以您的用户身份在授权范围内执行操作，可能导致商品误上架、价格错误等风险，请谨慎操作。

建议：
- Agent 收到"上架"指令时，若用户未明确指定方式（选品上架/挂售上架），**必须询问用户**选择哪种上架方式
- Agent 自动识别图片并填充商品信息，售价必问用户；商家编码优先让用户自定义，不填则自动生成推荐
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
