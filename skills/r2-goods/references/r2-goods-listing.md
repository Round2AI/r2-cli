# R2-Goods 普通上架/下架/改价

> **Prerequisite:** 读取 [`../SKILL.md`](../SKILL.md) 了解路由决策和命令概览。

## Agent 上架 4 步流程

**每一步 Agent 获取数据后，必须展示给用户让用户做选择。**

1. `r2-cli goods shops --json` → 展示店铺 → 用户选择 `shopId`
2. `r2-cli goods stocks --json` → 展示仓库 → 用户选择 `stockId`
3. `r2-cli goods list --stock-id <stockId> --json` → 展示商品 → 用户选择 `stockGoodsId`
4. `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` → 提交上架

命令自动轮询上架进度（每 2 秒，最多 10 秒），返回 `{ success, data: { submit, listing } }`。

**提交成功展示模板**：
```
上架成功！
- 商品：[goodsName]
- 店铺：[shopName]
- 价格：¥[price]
- 上架 ID：[listing.id]（用于后续改价/下架）
```

```json
{
  "success": true,
  "data": {
    "submit": { "...提交结果..." },
    "listing": { "id": "上架记录ID", "status": "up", "goodsName": "...", "price": 299 }
  }
}
```

状态值：`init`（处理中）、`up`（已上架）、`down`（已下架）、`fail`（失败，查看 `errorMsg`）、`sold`（已售出）、`sold`（已售出）

## 上架列表返回字段

| 字段 | 说明 |
|------|------|
| `id` | 上架记录 ID（edit/down/price 的 `--id` 取这个值） |
| `stockGoodsId` | 库存商品 ID（挂售商品可能为 0） |
| `shopId` | 店铺 ID |
| `goodsName` | 商品名称 |
| `brandName` | 品牌 |
| `price` | 上架价格 |
| `status` | 状态：`init`/`up`/`down`/`fail`/`sold`（已售出） |
| `thirdItemNo` | 平台商品 ID |
| `outItemNo` | 商家编码 |
| `spec` | 规格（尺码） |
| `platform` | 平台（xianyu） |
| `gmtCreate` / `gmtModified` | 创建/修改时间戳 |

### 友好输出指引

上架响应 JSON 示例：
```json
{
  "success": true,
  "data": {
    "submit": { "id": 12345, "status": "init" },
    "listing": { "id": 12345, "goodsName": "Nike 运动鞋", "price": 299, "shopName": "店铺A", "status": "up" }
  }
}
```

Agent 提取展示：
```
上架成功！
- 商品：Nike 运动鞋
- 店铺：店铺A
- 价格：¥299
- 上架 ID：12345（用于后续改价/下架）
```

> **`data.listing` 中的字段**：`id`（上架记录 ID）、`goodsName`（商品名）、`price`（价格）、`shopName`（店铺名）、`status`（状态）。Agent 提取这些字段展示给用户。

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

**确认模板**：
```
确认下架？
商品：[goodsName] | [brandName] | ¥[price]
店铺：[shopName]
输入 yes 确认，其他取消
```

```bash
# 方式 1：上架记录 ID
r2-cli goods down --id <goodsListingId> --json

# 方式 2：库存商品 ID + 店铺 ID
r2-cli goods down --stock-goods-id <id> --shop-id <id> --json
```

### 友好输出指引

下架响应 `{ "success": true, "data": "下架成功" }`。Agent 提取展示：
```
下架成功！
- 商品：[goodsName]
- 店铺：[shopName]
- 上架 ID：[id]
```

## 改价（price）

**Agent 必须先询问用户新价格，不能自行决定。**

```bash
# 方式 1：上架记录 ID
r2-cli goods price --id <goodsListingId> --price <新价格> --json

# 方式 2：库存商品 ID + 店铺 ID
r2-cli goods price --stock-goods-id <id> --shop-id <id> --price <新价格> --json
```

### 友好输出指引

改价响应 `{ "success": true, "data": "修改成功" }`。Agent 提取展示：
```
改价成功！
- 商品：[goodsName]
- 原价：¥[原价] → ¥[新价格]
```

## 修改商品信息（edit）

修改已上架商品的标题、描述、品牌、类目、图片、属性等。

> **注意**：`goods edit` 不支持修改价格。改价需单独使用 `r2-cli goods price --id <id> --price <amount>`。

### 定位商品（二选一）

| 方式 | 参数 | 推荐度 |
|------|------|--------|
| 上架记录 ID | `--id <goodsListingId>` | 推荐，从 listing 的 id 字段取 |
| 库存商品 + 店铺 | `--stock-goods-id <id> --account <shopId>` | 备选，挂售商品 stockGoodsId 可能为 0 |

### Agent 注意事项

- **`--image-ids` 保持字符串**：图片 ID 是 19 位数字，`Number()` 会精度丢失
- **`--item-attrs` 传 JSON 字符串**：必须是 `JSON.stringify()` 后的结果，不能直接传对象
- **即使不改类目也要传 `--category-id` 和 `--channel-cat-id`**：后端必填，缺少会报 `getCategoryId() is null`
- **`--item-attrs` 必须包含 props 中所有属性，不只是修改的那一个**：后端替换整个属性列表，漏传的属性会被清除。从 `goods hang-up props --channel-cat-id <id> --json` 获取全部属性后，修改目标属性的值，其他属性保持原样一并传入

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

### 带图片修改

用户提供了图片文件时，参见场景指南：[../scenes/r2-scene-edit-with-images.md](../scenes/r2-scene-edit-with-images.md)

### 只改文字字段（无图片）

> 只改标题/描述等文字字段时，不需要传 `--item-attrs`。**但一旦传了 `--item-attrs`，必须包含 props 中所有属性**，不能只传修改的那一项。

```bash
# 改标题
r2-cli goods edit --id 5 \
  --category-id 50106003 --channel-cat-id "f4718bbb04d7ed1facde29f76907b07f" \
  --title "新标题" --json

# 改品牌+描述
r2-cli goods edit --id 5 \
  --category-id 50106003 --channel-cat-id "f4718bbb04d7ed1facde29f76907b07f" \
  --brand-name "Nike" --desc "全新描述" --json
```

> **注意**：改品牌时建议同时传 `--item-attrs`（含所有属性，品牌项用最新 valueId），因为只传 `--brand-name` 可能不会更新属性列表中的品牌值。

### 友好输出指引

edit 响应 `{ "success": true, "data": "修改成功" }`。Agent 提取展示修改摘要：
```
修改成功！
商品：[goodsName]
┌──────────┬──────────────────┐
│ 修改项    │ 新值              │
├──────────┼──────────────────┤
│ 标题      │ [新标题]           │
│ 品牌      │ [新品牌]           │
│ 描述      │ [新描述摘要]        │
└──────────┴──────────────────┘
```

> 只展示**实际修改的字段**，未修改的字段不展示。`--item-attrs` 中如有多个属性修改，只列属性名+新值。
