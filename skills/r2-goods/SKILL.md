---
name: r2-goods
description: R2-CLI 商品管理专家。用于商品上架/下架/改价/挂售、查看店铺/仓库/选品商品/上架列表。Agent 获取数据后展示给用户选择，完成 4 步上架流程。触发词：上架、下架、改价、挂售、商品列表、goods、up、down、price、hang-up、shops、stocks、listing、list。
---

# R2-Goods Skill

商品管理专家，指导 AI Agent 完成商品上架、下架、改价全流程。

## 命令前缀

见 **r2-cli** skill 的"命令前缀自动检测"章节。

## 命令概览

| 命令 | 说明 |
|------|------|
| `r2-cli goods shops [--json]` | 查看所有已授权店铺（跨平台） |
| `r2-cli goods stocks [--json]` | 查看所有仓库 |
| `r2-cli goods list [--stock-id <id>] [--stock-goods-id <id>] [--json]` | 查看选品商品（两个过滤参数均为可选，支持 `--page <n>` 和 `--size <n>`） |
| `r2-cli goods listing [--json]` | 查询上架列表（支持多种过滤参数，见下方详细说明） |
| `r2-cli goods up` | 交互式上架（人类使用，自动轮询上架结果） |
| `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` | Agent 直接上架（自动轮询上架结果） |
| `r2-cli goods down --id <id> [--json]` | 下架商品（也可用 `--stock-goods-id <id> --shop-id <id>`） |
| `r2-cli goods price --id <id> --price <amount> [--json]` | 修改上架价格（也可用 `--stock-goods-id <id> --shop-id <id>`） |
| `r2-cli goods hang-up upload-images --shop-id <id> --files <paths> --json` | 批量上传图片到闲鱼（挂售前必须先上传） |
| `r2-cli goods hang-up --shop-id <id> --title <> --price <> ... --json` | 闲鱼挂售上架（完整商品信息模式） |

---

## Agent 上架流程（4 步）

**每一步 Agent 获取数据后，必须展示给用户让用户做选择。不要让用户自己提供 ID。**

### 第 1 步：获取店铺 → 用户选择

```bash
r2-cli goods shops --json
```

返回店铺列表，每个店铺包含：

| 字段 | 说明 |
|------|------|
| `shopId` | 第三方店铺 ID（**上架参数取这个，不是 `id`**） |
| `shopName` | 店铺名称 |
| `platform` | 平台（xianyu / douyin 等） |

展示给用户选择后记录 `shopId`。

> `--json` 输出会自动过滤敏感字段（`accessToken`、`refreshExpireIn`），Agent 可直接展示。

### 第 2 步：获取仓库 → 用户选择

```bash
r2-cli goods stocks --json
```

返回仓库列表，每个仓库包含：

| 字段 | 说明 |
|------|------|
| `stockId` | 仓库 ID（用于第 3 步过滤商品） |
| `stockName` | 仓库名称 |

### 第 3 步：获取选品商品 → 用户选择

```bash
# 按仓库过滤（推荐，展示该仓库下所有可选商品）
r2-cli goods list --stock-id <stockId> --json

# 按商品 ID 精确查询单个商品
r2-cli goods list --stock-goods-id <id> --json

# 翻页查看更多商品
r2-cli goods list --stock-id <stockId> --page 2 --size 20 --json
```

返回商品列表，每个商品包含：

| 字段 | 说明 |
|------|------|
| `stockGoodsId` | 库存商品 ID（**上架参数取这个**） |
| `goodsName` | 商品名称 |
| `brand` | 品牌 |
| `size` | 尺码 |
| `salePrice` | 建议售价 |
| `cate1Name` / `cate2Name` / `cate3Name` | 分类 |

### 第 4 步：提交上架

```bash
r2-cli goods up --stock-goods-id <stockGoodsId> --shop-id <shopId> --price <amount> --json
```

> Agent 模式下，三个必填参数（`--stock-goods-id`、`--shop-id`、`--price`）必须同时提供。缺少任何一个参数时命令返回 `{ "success": false, "error": "Agent 模式需要 --stock-goods-id, --shop-id, --price" }`，**不会**进入交互模式。

命令会自动轮询上架进度（每 2 秒查询一次，最多 10 秒），最终返回：

```json
{
  "success": true,
  "data": {
    "submit": { "...提交结果..." },
    "listing": {
      "id": "上架记录ID",
      "status": "up",
      "goodsName": "...",
      "price": 299,
      "...": "..."
    }
  }
}
```

检查 `data.listing.status` 判断最终状态：

| status | 含义 |
|--------|------|
| `init` | 待上架（处理中，正常不应出现在最终结果） |
| `up` | 已上架成功 |
| `down` | 已下架 |
| `fail` | 上架失败，查看 `errorMsg` 了解原因 |

### 上架参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| `--stock-goods-id <id>` | 是 | 库存商品 ID（来自第 3 步的 `stockGoodsId`） |
| `--shop-id <id>` | 是 | 第三方店铺 ID（来自第 1 步的 `shopId`，**不是 `id`**） |
| `--price <amount>` | 是 | 上架价格（正数） |
| `-p, --platform <platform>` | 否 | 平台，默认 xianyu |
| `--json` | 否 | JSON 输出（Agent 推荐使用） |

---

## 下架商品

**Agent 必须先向用户确认后再执行下架操作。**

支持两种方式指定商品（二选一）：

```bash
# 方式 1：通过上架记录 ID（来自 listing 列表的 id 字段）
r2-cli goods down --id <goodsListingId> --json

# 方式 2：通过库存商品 ID + 店铺 ID
r2-cli goods down --stock-goods-id <id> --shop-id <id> --json
```

参数校验：必须提供 `--id` 或同时提供 `--stock-goods-id` 和 `--shop-id`，否则返回错误。

---

## 修改价格

**Agent 必须先询问用户新价格，不能自行决定价格。** 用户说"修改价格"时，先问"要改成多少？"。

```bash
# 方式 1：通过上架记录 ID
r2-cli goods price --id <goodsListingId> --price <新价格> --json

# 方式 2：通过库存商品 ID + 店铺 ID
r2-cli goods price --stock-goods-id <id> --shop-id <id> --price <新价格> --json
```

`--price` 为必填参数。同样需要提供 `--id` 或 `--stock-goods-id + --shop-id`。

---

## 查询上架列表

```bash
# 查看所有上架记录
r2-cli goods listing --json

# 过滤查询
r2-cli goods listing --status up --json                    # 只看已上架
r2-cli goods listing --shop-id <id> --json                  # 按店铺过滤
r2-cli goods listing --stock-goods-id <id> --json           # 按商品过滤
r2-cli goods listing --id <id> --json                       # 精确查询
```

支持的过滤参数：

| 参数 | 说明 |
|------|------|
| `--id <id>` | 上架记录 ID |
| `--stock-goods-id <id>` | 库存商品 ID |
| `--shop-id <id>` | 店铺 ID |
| `--stock-id <id>` | 仓库 ID |
| `-s, --status <status>` | 状态过滤：`init` / `up` / `down` / `fail` |
| `-p, --platform <platform>` | 平台，默认 xianyu |

---

## 闲鱼挂售上架（hang-up）

挂售模式支持完整的商品信息：图片、类目、属性、售后服务等。

**核心流程：查询类目/属性 → 上传图片 → 提交挂售**

### Agent 操作流程（4 步）

#### 第 1 步：获取类目 → 用户选择

```bash
r2-cli goods hang-up categories --json
```

返回类目列表，每个类目包含：

| 字段 | 说明 |
|------|------|
| `catId` | 大分类 ID（**--category-id 取这个**） |
| `catName` | 大分类名称 |
| `channel` | 小分类名称 |
| `channelCatId` | 小分类 ID（**--channel-cat-id 取这个**） |

展示给用户选择后记录 `catId` 和 `channelCatId`。

#### 第 2 步：获取属性 → 用户选择

```bash
r2-cli goods hang-up props --channel-cat-id <channelCatId> --json
```

返回属性列表，每个属性包含：

| 字段 | 说明 |
|------|------|
| `propId` | 属性 ID |
| `propName` | 属性名称（品牌、成色、尺码等） |
| `propsValues` | 可选值列表（`valueId` + `valueName`） |

**特殊处理 — 品牌属性**：品牌的 `propsValues` 通常为空，需要用 brands 子命令搜索：

```bash
r2-cli goods hang-up brands --channel-cat-id <id> --prop-id <品牌propId> --key "Nike" --json
```

用户选择每个属性的值后，Agent 构建属性列表：

```json
[
  { "propId": "xx", "valueId": "yy", "valueName": "Nike" },
  { "propId": "zz", "valueId": "ww", "valueName": "99新" }
]
```

#### 第 3 步：上传图片

```bash
r2-cli goods hang-up upload-images --shop-id <shopId> --files /path/to/img1.jpg,/path/to/img2.jpg --json
```

返回：

```json
{
  "success": true,
  "images": [
    { "imageId": 12345, "width": 800, "height": 600 },
    { "imageId": 67890, "width": 1024, "height": 768 }
  ]
}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `--shop-id <id>` | 是 | 店铺 ID |
| `--files <paths>` | 是 | 本地图片路径，逗号分隔（最多 9 张） |
| `--json` | 否 | JSON 输出（Agent 推荐） |

> 图片路径是用户本地文件路径，Agent 需要向用户获取。

#### 第 4 步：提交挂售

```bash
r2-cli goods hang-up \
  --shop-id <shopId> \
  --title "Nike Air Force 1 白色 42码" \
  --price 599 \
  --category-id 123 \
  --channel-cat-id "456" \
  --image-ids 12345,67890 \
  --stuff-status 99 \
  --brand-name "Nike" \
  --size "42" \
  --item-attrs '[{"propId":"xx","valueId":"yy","valueName":"Nike"}]' \
  --json
```

成功返回：

```json
{ "success": true, "data": { "...挂售结果..." } }
```

### 必填参数

| 参数 | 说明 |
|------|------|
| `--shop-id <id>` | 店铺 ID（即闲鱼用户名 account） |
| `--title <title>` | 商品标题 |
| `--price <amount>` | 售价 |
| `--category-id <id>` | 大分类 ID（手机、数码等） |
| `--channel-cat-id <id>` | 小分类 ID（手机、平板电脑、笔记本电脑等） |
| `--image-ids <ids>` | 图片 ID 列表，逗号分隔（来自 upload-images） |
| `--stuff-status <n>` | 成色等级（见下表） |

### 成色等级对照表

| 值 | 含义 |
|----|------|
| `100` | 全新 |
| `-1` | 准新 |
| `99` | 99新 |
| `95` | 95新 |
| `90` | 9新 |

### 可选参数（有默认值）

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--brand-name <name>` | — | 品牌名称 |
| `--desc <desc>` | — | 商品描述 |
| `--size <size>` | — | 尺码 |
| `--goods-no <no>` | — | 货号 |
| `--original-price <amount>` | — | 原价 |
| `--out-item-no <no>` | — | 商家编码（同店铺唯一） |
| `--trade-type <n>` | `0` | 交易方式：0 仅在线 / 1 仅线下 / 2 线上或线下 |
| `--transport-fee <amount>` | `0` | 运费（0 = 包邮） |
| `--item-attrs <json>` | — | 商品属性列表 JSON（来自 props/brands 选择结果） |
| `--yhb` | `false` | 是否开启验货宝 |

> 默认值：`itemBizType=2`（普通商品）、`spBizType="16"`（奢品）、`tradeType=0`（仅在线交易）、`transportFee=0`（包邮）、`yhb=false`

---

所有 `--json` 命令统一错误格式：

```json
{ "success": false, "error": "错误信息" }
```

检查 `success` 字段判断成败。常见错误：

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `请先运行 r2-cli auth login 登录` | 未登录或 Token 过期 | 执行 `r2-cli auth login --json` |
| `请指定下架条件：--id 或 --stock-goods-id + --shop-id` | 缺少必要参数 | 补充参数 |
| `--price <amount> 为必填参数` | 改价时未提供价格 | 询问用户新价格后传入 |
| `轮询超时` | 上架结果查询超时 | 建议用户稍后用 `goods listing` 查看 |
| `Agent 模式需要 --stock-goods-id, --shop-id, --price` | `goods up --json` 缺少必填参数 | 补齐三个参数后重试 |
| `缺少必填参数：--xxx, --yyy` | `goods hang-up --json` 缺少必填参数 | 补齐参数后重试 |
| `请提供至少一张图片` | `upload-images` 未提供图片路径 | 提供本地图片路径 |
