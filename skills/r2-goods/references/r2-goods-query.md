# R2-Goods 查询命令

> **Prerequisite:** 读取 [`../SKILL.md`](../SKILL.md) 了解路由决策和命令概览。

## 店铺（shops）

```bash
r2-cli goods shops --json
```

返回字段：

| 字段 | 说明 |
|------|------|
| `shopId` | 第三方店铺 ID（**上架参数取这个，不是 `id`**） |
| `shopName` | 店铺名称 |
| `platform` | 平台（xianyu / douyin 等） |

> `--json` 输出会自动过滤敏感字段（`accessToken`、`refreshExpireIn`），Agent 可直接展示。

**Agent 展示格式**：
```
店铺列表：
1. [shopName]（[platform]）— shopId: [shopId]
2. [shopName]（[platform]）— shopId: [shopId]
请选择店铺（输入编号）：
```

## 仓库（stocks）

```bash
r2-cli goods stocks --json
```

返回字段：`stockId`（仓库 ID）、`stockName`（仓库名称）

**Agent 展示格式**：
```
仓库列表：
1. [stockName]（stockId: [stockId]）
2. [stockName]（stockId: [stockId]）
请选择仓库（输入编号）：
```

## 选品商品（list）

```bash
# 按仓库过滤（推荐）
r2-cli goods list --stock-id <stockId> --json

# 按商品 ID 精确查询
r2-cli goods list --stock-goods-id <id> --json

# 翻页
r2-cli goods list --stock-id <stockId> --page 2 --size 50 --json
```

返回字段：

| 字段 | 说明 |
|------|------|
| `stockGoodsId` | 库存商品 ID（**上架参数取这个**） |
| `goodsName` | 商品名称 |
| `brand` | 品牌 |
| `size` | 尺码 |
| `salePrice` | 建议售价 |
| `cate1Name` / `cate2Name` / `cate3Name` | 分类 |

**Agent 展示格式**：
```
选品商品列表：
1. [goodsName] | [brand] | [size] | ¥[salePrice] | [cate3Name]（stockGoodsId: [id]）
2. [goodsName] | [brand] | [size] | ¥[salePrice] | [cate3Name]（stockGoodsId: [id]）
请选择商品（输入编号）：
```

## 上架列表（listing）

```bash
r2-cli goods listing --json
r2-cli goods listing --status up --json            # 只看已上架
r2-cli goods listing --status sold --json          # 只看已售出
r2-cli goods listing --shop-id <id> --json         # 按店铺过滤
r2-cli goods listing --stock-goods-id <id> --json  # 按商品过滤
r2-cli goods listing --id <id> --json              # 精确查询
r2-cli goods listing --page 2 --size 50 --json     # 翻页
```

过滤参数：`--id`、`--stock-goods-id`、`--shop-id`、`--stock-id`、`--status`（init/up/down/fail/sold）、`--platform`、`--page`（默认 1）、`--size`（默认 20，最大 50）

**Agent 展示格式**：
```
上架商品列表：
1. [goodsName] | [brandName] | ¥[price] | [status] | id: [id]
2. [goodsName] | [brandName] | ¥[price] | [status] | id: [id]
```
