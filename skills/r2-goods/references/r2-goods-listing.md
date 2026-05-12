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

## 修改商品信息（edit）

修改已上架商品的标题、描述、品牌、类目、图片、属性等。

### 定位商品（二选一）

| 方式 | 参数 | 推荐度 |
|------|------|--------|
| 上架记录 ID | `--id <goodsListingId>` | 推荐，从 listing 的 id 字段取 |
| 库存商品 + 店铺 | `--stock-goods-id <id> --account <shopId>` | 备选，挂售商品 stockGoodsId 可能为 0 |

### 必填参数

| 参数 | 说明 |
|------|------|
| `--id <id>` 或 `--stock-goods-id + --account` | 定位商品（二选一） |
| `--category-id <id>` | 大分类 ID（**后端必填**，即使不改类目也要传当前值） |
| `--channel-cat-id <id>` | 小分类 ID（**后端必填**，即使不改类目也要传当前值） |

> 后端复用了挂售 DTO，缺少 `category-id` 会报 `getCategoryId() is null` 错误。

### 可修改字段（全部可选）

| 参数 | 说明 |
|------|------|
| `--title <title>` | 商品标题 |
| `--desc <desc>` | 商品描述 |
| `--image-ids <ids>` | 图片 ID（逗号分隔，需先上传） |
| `--item-attrs <json>` | 属性列表 JSON |
| `--brand-name <name>` | 品牌名称 |
| `--stuff-status <n>` | 成色：100=全新 -1=准新 99=99新 95=95新 90=9新 |
| `--goods-no <no>` | 货号 |
| `--original-price <n>` | 原价（元） |
| `--size <size>` | 尺码 |

### 带图片修改的全自动流程

用户提供了图片文件时，**Agent 自动完成所有步骤，用户只需确认**：

1. **展示列表**：`r2-cli goods listing --json` → 展示给用户选择要修改的商品（获取 stockGoodsId、shopId）
2. **上传图片**：`r2-cli goods hang-up upload-images --shop-id <shopId> --files <paths> --json`
3. **AI 读图识别**：Agent 用 Read 工具查看图片，识别品牌/类目/成色/描述/材质等
4. **自动匹配类目**：`r2-cli goods hang-up categories --json` → 根据识别结果匹配 catId + channelCatId（如"运动夹克" → 男士服装>夹克）
5. **自动查询属性**：`r2-cli goods hang-up props --channel-cat-id <id> --json` → 根据识别结果自动匹配：
   - 成色（全新/99新/95新等） → 查找对应 valueId
   - 尺码（XL/L/M 等） → 查找对应 valueId
   - 适用季节 → 查找对应 valueId
   - 其他属性 → 根据识别结果匹配
6. **自动搜索品牌**：`r2-cli goods hang-up brands --channel-cat-id <> --prop-id <> --key <品牌名> --json` → 获取品牌 valueId
7. **汇总确认**：展示「当前值 vs 变更值」对比表，用户确认
8. **提交修改**：

```bash
r2-cli goods edit \
  --id <goodsListingId> \
  --category-id <catId> --channel-cat-id <channelCatId> \
  --image-ids "id1,id2,id3" \
  --item-attrs '[{...品牌...},{...成色...},{...尺码...},{...季节...}]' \
  --brand-name "Louis Vuitton/路易威登" \
  --json
```

### 只改文字字段（无图片）

```bash
# 改标题
r2-cli goods goods edit --id 5 \
  --category-id 50106003 --channel-cat-id "f4718bbb04d7ed1facde29f76907b07f" \
  --title "新标题" --json

# 改品牌+描述
r2-cli goods edit --id 5 \
  --category-id 50106003 --channel-cat-id "f4718bbb04d7ed1facde29f76907b07f" \
  --brand-name "Nike" --desc "全新描述" --json
```
