---
name: r2-cli
description: R2-CLI 二手潮奢交易 CLI 工具。用于认证登录、商品上架/下架/改价、查看店铺/仓库/选品商品/上架列表。Agent 获取数据后展示给用户选择，完成 4 步上架流程。触发词：r2-cli、登录、上架、下架、改价、商品、goods、auth、shops、stocks、listing。
---

# R2-CLI Skill

二手潮奢交易命令行工具，由 Round2AI 团队维护。覆盖商品上架、认证登录等核心业务域。

## 安装

```bash
npm install -g @round2ai/r2-cli@latest
```

## 命令前缀自动检测

首次使用时检测一次，后续所有命令使用检测到的前缀：

1. 项目目录有 `package.json`（name 含 r2-cli）→ `npm run dev --`
2. 存在 `dist/r2-cli.js` → `node dist/r2-cli.js`
3. `r2-cli --version` 成功 → `r2-cli`

> 部分平台 npm 会拦截 `--help` 等 flag，改用 `npx tsx src/entrypoints/r2-cli.tsx --help`。

## 前置条件

- 先登录：`r2-cli auth login`（支持第二回合 APP / 微信 / 支付宝扫码）
- 检查状态：`r2-cli auth status`

所有 `--json` 命令输出 `{ success: false, error: "..." }` 格式错误，检查 `success` 判断成败。

## 认证命令

| 命令 | 说明 |
|------|------|
| `r2-cli auth login` | 扫码登录（自动打开浏览器，人类使用） |
| `r2-cli auth login --json` | 扫码登录（自动打开浏览器 + JSON 输出，Agent 推荐） |
| `r2-cli auth login poll --token <>` | 手动轮询登录状态（备选方案，不推荐） |
| `r2-cli auth xianyu` | 闲鱼店铺授权（自动打开浏览器，人类使用） |
| `r2-cli auth xianyu --json` | 闲鱼店铺授权（自动打开浏览器 + JSON 输出，Agent 推荐） |
| `r2-cli auth xianyu poll --state <>` | 手动轮询授权状态（备选方案，不推荐） |
| `r2-cli auth status` | 查看登录状态 |
| `r2-cli auth logout` | 退出登录 |

> 认证登录的详细 Agent 操作流程见 **r2-auth** skill。

## 商品管理命令

| 命令 | 说明 |
|------|------|
| `r2-cli goods shops [--json]` | 查看所有已授权店铺（跨平台，`--json` 自动过滤敏感字段） |
| `r2-cli goods stocks [--json]` | 查看所有仓库 |
| `r2-cli goods list [--stock-id <id>] [--stock-goods-id <id>] [--json]` | 查看选品商品（两个过滤参数均为可选，支持 `--page` 和 `--size`） |
| `r2-cli goods listing [--json]` | 查询上架列表（支持 `--id` / `--shop-id` / `--stock-goods-id` / `--stock-id` / `--status` / `--platform` 过滤） |
| `r2-cli goods up` | 交互式上架（自动轮询上架结果） |
| `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` | Agent 直接上架（自动轮询上架结果） |
| `r2-cli goods down --id <id> [--json]` | 下架商品（也可用 `--stock-goods-id <id> --shop-id <id>`） |
| `r2-cli goods price --id <id> --price <amount> [--json]` | 修改上架价格（也可用 `--stock-goods-id <id> --shop-id <id>`） |
| `r2-cli goods hang-up categories [--json]` | 获取闲鱼类目列表（大分类 → 小分类） |
| `r2-cli goods hang-up props --channel-cat-id <id> [--json]` | 获取指定类目下的属性列表（含可选值） |
| `r2-cli goods hang-up brands --channel-cat-id <id> --prop-id <id> --key <keyword> [--json]` | 品牌搜索 |
| `r2-cli goods hang-up upload-images --shop-id <id> --files <paths> --json` | 批量上传图片到闲鱼（挂售前必须先上传） |
| `r2-cli goods hang-up --shop-id <id> --title <> --price <> --category-id <> --channel-cat-id <> --image-ids <> --stuff-status <> --json` | 闲鱼挂售上架（完整商品信息模式） |

## Agent 上架 4 步流程

**核心原则：Agent 获取数据后展示给用户选择，不要让用户自己提供 ID。**

1. `r2-cli goods shops --json` → 展示店铺（`shopId`、`shopName`、`platform`）→ 用户选择
2. `r2-cli goods stocks --json` → 展示仓库（`stockId`、`stockName`）→ 用户选择
3. `r2-cli goods list --stock-id <id> --json` → 展示商品（`stockGoodsId`、`goodsName`、`brand`、`size`、`salePrice`）→ 用户选择（也可用 `--stock-goods-id <id>` 查询单个商品）
4. `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` → 提交上架（自动轮询结果）

> 完整流程、参数说明和注意事项见 **r2-goods** skill。
