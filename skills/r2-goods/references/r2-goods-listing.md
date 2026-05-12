# R2-Goods 普通上架/下架/改价

> **Prerequisite:** 读取 [`../SKILL.md`](../SKILL.md) 了解路由决策和命令概览。

## Agent 上架 4 步流程

**每一步 Agent 获取数据后，必须展示给用户让用户做选择。**

1. `r2-cli goods shops --json` → 展示店铺 → 用户选择 `shopId`
2. `r2-cli goods stocks --json` → 展示仓库 → 用户选择 `stockId`
3. `r2-cli goods list --stock-id <stockId> --json` → 展示商品 → 用户选择 `stockGoodsId`
4. `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` → 提交上架

命令自动轮询上架进度（每 2 秒，最多 10 秒），返回：

```json
{
  "success": true,
  "data": {
    "submit": { "...提交结果..." },
    "listing": { "id": "上架记录ID", "status": "up", "goodsName": "...", "price": 299 }
  }
}
```

状态值：`init`（处理中）、`up`（已上架）、`down`（已下架）、`fail`（失败，查看 `errorMsg`）

## 上架参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--stock-goods-id <id>` | 是 | 库存商品 ID（来自 `stockGoodsId`） |
| `--shop-id <id>` | 是 | 第三方店铺 ID（来自 `shopId`，**不是 `id`**） |
| `--price <amount>` | 是 | 上架价格 |
| `--json` | 否 | JSON 输出（Agent 推荐） |

> 缺少必填参数时返回 `{ "success": false, "error": "Agent 模式需要 --stock-goods-id, --shop-id, --price" }`，不会进入交互模式。

## 下架（down）

**Agent 必须先向用户确认后再执行下架。**

```bash
# 方式 1：上架记录 ID
r2-cli goods down --id <goodsListingId> --json

# 方式 2：库存商品 ID + 店铺 ID
r2-cli goods down --stock-goods-id <id> --shop-id <id> --json
```

## 改价（price）

**Agent 必须先询问用户新价格，不能自行决定。**

```bash
# 方式 1：上架记录 ID
r2-cli goods price --id <goodsListingId> --price <新价格> --json

# 方式 2：库存商品 ID + 店铺 ID
r2-cli goods price --stock-goods-id <id> --shop-id <id> --price <新价格> --json
```
