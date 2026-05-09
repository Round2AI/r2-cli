---
name: r2-goods
description: R2-CLI 商品管理专家。用于商品上架/下架/改价、查看店铺/仓库/选品商品/上架列表。Agent 获取数据后展示给用户选择，完成 4 步上架流程。触发词：上架、下架、改价、商品列表、goods、up、down、price、shops、stocks、listing、list。
---

# R2-Goods Skill

商品管理专家，指导 AI Agent 完成商品上架、下架、改价全流程。

## 命令前缀

见 **r2-cli** skill 的"命令前缀自动检测"章节。

## 命令概览

| 命令 | 说明 |
|------|------|
| `r2-cli goods shops [--json]` | 查看所有已授权店铺 |
| `r2-cli goods stocks [--json]` | 查看所有仓库 |
| `r2-cli goods list --stock-id <id> [--json]` | 查看仓库中的选品商品 |
| `r2-cli goods listing [--json]` | 查询上架列表（支持 --id/--shop-id/--status 过滤） |
| `r2-cli goods up` | 交互式上架 |
| `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` | Agent 直接上架（自动轮询结果） |
| `r2-cli goods down --id <id> [--json]` | 下架商品（**必须先确认**） |
| `r2-cli goods price --id <id> --price <amount> [--json]` | 修改上架价格（**必须先询问用户新价格**） |

---

## Agent 上架流程（4 步）

**每一步 Agent 获取数据后，必须展示给用户让用户做选择。** 不要让用户自己提供 ID。

### 第 1 步：获取店铺 → 用户选择

```bash
r2-cli goods shops --json
```

展示 `shopId`（第三方店铺 ID，**上架参数取这个，不是 `id`**）、`shopName`、`platform`。

### 第 2 步：获取仓库 → 用户选择

```bash
r2-cli goods stocks --json
```

展示 `stockId`、`stockName`。`stockId` 用于第 3 步过滤商品。

### 第 3 步：获取选品商品 → 用户选择

```bash
r2-cli goods list --stock-id <stockId> --json
```

展示 `stockGoodsId`（**上架参数取这个**）、`goodsName`、`brand`、`size`、`salePrice`。支持翻页（`--page 2`）。

### 第 4 步：提交上架

```bash
r2-cli goods up --stock-goods-id <stockGoodsId> --shop-id <shopId> --price <amount> --json
```

命令自动轮询上架进度（每 2 秒，最多 10 秒），返回 `{ success, data: { submit, listing } }`。检查 `data.listing.status` 判断最终状态（init/up/down/fail）。

### 上架参数

| 参数 | 必填 | 来源 |
|------|------|------|
| `--stock-goods-id <id>` | 是 | 第 3 步 `stockGoodsId` |
| `--shop-id <id>` | 是 | 第 1 步 `shopId`（不是 `id`） |
| `--price <amount>` | 是 | 用户输入 |
| `-p, --platform` | 否 | 默认 xianyu |
| `--json` | 否 | Agent 推荐 |

---

## 下架商品

**Agent 必须先向用户确认后再下架。**

```bash
r2-cli goods down --id <goodsListingId> --json
# 或 --stock-goods-id <id> --shop-id <id>
```

## 修改价格

**Agent 必须先询问用户新价格，不能自行决定。** 用户说"修改价格"时，先问"要改成多少？"。

```bash
r2-cli goods price --id <goodsListingId> --price <新价格> --json
# 或 --stock-goods-id <id> --shop-id <id>
```

## 查询上架列表

```bash
r2-cli goods listing --json
# 支持 --id / --shop-id / --stock-goods-id / --status <init|up|down|fail> / --platform 过滤
```

---

## 错误处理

所有命令统一格式：`{ "success": false, "error": "错误信息" }`。检查 `success` 判断成败。
