---
name: r2-goods
description: R2-CLI 商品管理专家。用于商品上架（goods up）、查看店铺、仓库、选品商品。Agent 获取数据后展示给用户选择，完成 4 步上架流程。
---

# R2-Goods Skill

商品管理专家，指导 AI Agent 完成商品上架全流程。

## 安装

```bash
npm install -g @round2ai/r2-cli@latest
```

## 命令前缀

见 **r2-cli** skill 的"命令前缀自动检测"章节。以下文档使用 `r2-cli` 作为前缀，根据检测结果替换。

## 命令概览

| 命令 | 说明 |
|------|------|
| `r2-cli goods shops [--json]` | 查看所有已授权店铺 |
| `r2-cli goods stocks [--json]` | 查看所有仓库 |
| `r2-cli goods list --stock-id <id> [--json]` | 查看仓库中的选品商品 |
| `r2-cli goods listing --stock-goods-id <id> --shop-id <id> [--json]` | 查询上架信息 |
| `r2-cli goods up` | 交互式上架 |
| `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` | Agent 直接上架（自动轮询结果） |

---

## Agent 上架流程（4 步）

Agent 必须按以下 4 步完成上架。**每一步 Agent 获取数据后，必须把关键信息展示给用户，让用户做选择。** 不要让用户自己提供 ID——用户看不到数据，需要 Agent 展示。

### 第 1 步：获取店铺 → 用户选择

```bash
r2-cli goods shops --json
```

返回 `UserShop[]`，Agent **必须展示以下信息让用户选择**：

| 展示字段 | 说明 |
|----------|------|
| `shopId` | 第三方店铺 ID — **这是上架接口的 `--shop-id` 参数**（注意：不是 `id` 字段） |
| `shopName` | 店铺名称 |
| `platform` | 平台 |

**Agent 行为**：用列表或表格展示所有店铺，让用户选择目标店铺。用户选择后，取 `shopId` 字段值用于第 4 步。

### 第 2 步：获取仓库 → 用户选择

```bash
r2-cli goods stocks --json
```

返回 `UserStock[]`，Agent **必须展示以下信息让用户选择**：

| 展示字段 | 说明 |
|----------|------|
| `stockId` | 仓库 ID — 用于第 3 步过滤商品 |
| `stockName` | 仓库名称 |

**Agent 行为**：展示所有仓库让用户选择，取 `stockId` 值用于第 3 步。

### 第 3 步：获取选品商品 → 用户选择

```bash
r2-cli goods list --stock-id <stockId> --json
```

返回 `SelectGoodsListResult`（含 `items` 数组、`total`、`page`），Agent **必须展示以下信息让用户选择**：

| 展示字段 | 说明 |
|----------|------|
| `stockGoodsId` | 库存商品 ID — **这是上架接口的 `--stock-goods-id` 参数** |
| `goodsName` | 商品名称 |
| `brand` | 品牌 |
| `size` | 尺码 |
| `salePrice` | 建议售价 |

**Agent 行为**：展示商品列表（名称、品牌、尺码、价格、stockGoodsId），让用户选择要上架的商品。如果商品较多（每页 20 件），支持翻页（`--page 2`）。

### 第 4 步：提交上架

确认用户选择了商品和价格后，提交上架：

```bash
r2-cli goods up --stock-goods-id <stockGoodsId> --shop-id <shopId> --price <amount> --json
```

**提交后命令会自动轮询上架进度**（每 3 秒查询一次，最多 60 秒），返回最终结果：

```json
{
  "success": true,
  "data": {
    "submit": { "goodsListingId": "2", "stockGoodsId": "12345", "msg": "正在处理中" },
    "listing": { "id": "2", "status": "init", "goodsName": "...", "price": 299 }
  }
}
```

Agent 应检查 `data.listing.status` 判断上架最终状态。

### 上架参数说明

| 参数 | 必填 | 来源 | 说明 |
|------|------|------|------|
| `--stock-goods-id <id>` | 是 | 第 3 步，用户从商品列表中选择 | 库存商品 ID |
| `--shop-id <id>` | 是 | 第 1 步，用户从店铺列表中选择 | 第三方店铺 ID（取 `shopId` 字段，不是 `id`） |
| `--price <amount>` | 是 | 用户输入 | 上架价格（正数） |
| `-p, --platform <platform>` | 否 | 默认 `xianyu` | 平台 |
| `--json` | 否 | — | JSON 输出（Agent 推荐） |

### 完整示例

```
# 第 1 步：获取店铺，展示给用户选择
r2-cli goods shops --json
# → 展示：shopId=2947300866, shopName=我的闲鱼店, platform=xianyu
# → 用户选择：我的闲鱼店

# 第 2 步：获取仓库，展示给用户选择
r2-cli goods stocks --json
# → 展示：stockId=2703, stockName=北京仓
# → 用户选择：北京仓

# 第 3 步：获取选品商品，展示给用户选择
r2-cli goods list --stock-id 2703 --json
# → 展示：stockGoodsId=12345, goodsName=Nike Air Jordan, brand=Nike, size=42, salePrice=999
# → 用户选择：Nike Air Jordan，价格 599

# 第 4 步：提交上架（自动轮询结果）
r2-cli goods up --stock-goods-id 12345 --shop-id 2947300866 --price 599 --json
# → { "success": true, "data": { "submit": {...}, "listing": { "status": "init", ... } } }
```

---

## 查询上架信息

如需单独查询上架状态：

```bash
r2-cli goods listing --stock-goods-id <id> --shop-id <id> --json
# 或通过上架记录 ID
r2-cli goods listing --id <goodsListingId> --json
```

---

## 交互式上架

`r2-cli goods up` 直接进入交互式向导（人类使用）：

1. 选择店铺 → 2. 选择仓库 → 3. 选择商品 → 4. 输入价格 → 5. 确认提交 → 6. 自动轮询结果

---

## 错误处理

所有命令统一错误格式：

```json
{ "success": false, "error": "错误信息" }
```

Agent 应检查 `success` 字段判断成败。
