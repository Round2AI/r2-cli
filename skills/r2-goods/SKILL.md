---
name: r2-goods
version: 1.0.0
description: "R2-CLI 商品管理专家。用于商品上架/下架/改价/挂售、查看店铺/仓库/选品商品/上架列表。Agent 获取数据后展示给用户选择，完成 4 步上架流程。触发词：上架、下架、改价、挂售、商品列表、goods、up、down、price、hang-up、shops、stocks、listing、list。"
metadata:
  requires:
    bins: ["r2-cli"]
  cliHelp: "r2-cli goods --help"
  related:
    - "r2-shared"
    - "r2-auth"
---

# R2-Goods (v1)

> **Tip**: Agent 获取数据后展示给用户选择，不要让用户自己提供 ID。这是核心原则。
> **Tip**: `goods up` 自动轮询上架结果（每 2 秒，最多 10 秒），无需手动查询。
> **Tip**: `hang-up` 挂售是独立流程（类目→属性→图片→提交），与普通上架（`goods up`）不同。

商品管理专家，指导 AI Agent 完成商品上架、下架、改价、挂售全流程。

## CRITICAL

安装、统一错误格式见 **r2-shared** skill。认证登录见 **r2-auth** skill。

## 命令概览

| 分类 | 命令 | 说明 |
|------|------|------|
| 查询 | `r2-cli goods shops [--json]` | 查看已授权店铺 |
| | `r2-cli goods stocks [--json]` | 查看仓库 |
| | `r2-cli goods list [--stock-id <id>] [--json]` | 查看选品商品 |
| | `r2-cli goods listing [--json]` | 查询上架列表 |
| 上架 | `r2-cli goods up --stock-goods-id <> --shop-id <> --price <> --json` | 普通上架（选品商品） |
| | `r2-cli goods down --id <id> [--json]` | 下架商品 |
| | `r2-cli goods price --id <id> --price <amount> [--json]` | 修改价格 |
| 挂售 | `r2-cli goods hang-up categories [--json]` | 获取闲鱼类目 |
| | `r2-cli goods hang-up props --channel-cat-id <id> [--json]` | 获取属性列表 |
| | `r2-cli goods hang-up brands --channel-cat-id <> --prop-id <> --key <> [--json]` | 品牌搜索 |
| | `r2-cli goods hang-up upload-images --shop-id <> --files <> --json` | 上传图片 |
| | `r2-cli goods hang-up submit --shop-id <> --title <> ... --json` | 提交挂售上架 |

---

## 一、查询命令

### 店铺（shops）

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

### 仓库（stocks）

```bash
r2-cli goods stocks --json
```

返回字段：`stockId`（仓库 ID）、`stockName`（仓库名称）

### 选品商品（list）

```bash
# 按仓库过滤（推荐）
r2-cli goods list --stock-id <stockId> --json

# 按商品 ID 精确查询
r2-cli goods list --stock-goods-id <id> --json

# 翻页
r2-cli goods list --stock-id <stockId> --page 2 --size 20 --json
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

### 上架列表（listing）

```bash
r2-cli goods listing --json
r2-cli goods listing --status up --json           # 只看已上架
r2-cli goods listing --shop-id <id> --json         # 按店铺过滤
r2-cli goods listing --stock-goods-id <id> --json  # 按商品过滤
r2-cli goods listing --id <id> --json              # 精确查询
```

过滤参数：`--id`、`--stock-goods-id`、`--shop-id`、`--stock-id`、`--status`（init/up/down/fail）、`--platform`

---

## 二、上架/下架

### Agent 上架 4 步流程

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

### 上架参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--stock-goods-id <id>` | 是 | 库存商品 ID（来自 `stockGoodsId`） |
| `--shop-id <id>` | 是 | 第三方店铺 ID（来自 `shopId`，**不是 `id`**） |
| `--price <amount>` | 是 | 上架价格 |
| `--json` | 否 | JSON 输出（Agent 推荐） |

> 缺少必填参数时返回 `{ "success": false, "error": "Agent 模式需要 --stock-goods-id, --shop-id, --price" }`，不会进入交互模式。

### 下架（down）

**Agent 必须先向用户确认后再执行下架。**

```bash
# 方式 1：上架记录 ID
r2-cli goods down --id <goodsListingId> --json

# 方式 2：库存商品 ID + 店铺 ID
r2-cli goods down --stock-goods-id <id> --shop-id <id> --json
```

### 改价（price）

**Agent 必须先询问用户新价格，不能自行决定。**

```bash
# 方式 1：上架记录 ID
r2-cli goods price --id <goodsListingId> --price <新价格> --json

# 方式 2：库存商品 ID + 店铺 ID
r2-cli goods price --stock-goods-id <id> --shop-id <id> --price <新价格> --json
```

---

## 三、闲鱼挂售（hang-up）

挂售模式支持完整商品信息：图片、类目、属性等。与普通上架（`goods up`）是不同流程。

### Agent 挂售 4 步流程

#### 第 1 步：获取类目 → 用户选择

```bash
r2-cli goods hang-up categories --json
```

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

| 字段 | 说明 |
|------|------|
| `propId` | 属性 ID |
| `propName` | 属性名称（品牌、成色、尺码等） |
| `propsValues` | 可选值列表（`valueId` + `valueName`） |

**品牌属性特殊处理**：品牌的 `propsValues` 通常为空，需用 brands 搜索：

```bash
r2-cli goods hang-up brands --channel-cat-id <id> --prop-id <品牌propId> --key "Nike" --json
```

用户选择属性值后，Agent 构建属性列表：

```json
[
  { "propId": "xx", "valueId": "yy", "valueName": "Nike" },
  { "propId": "zz", "valueId": "ww", "valueName": "99新" }
]
```

#### 第 3 步：上传图片

```bash
r2-cli goods hang-up upload-images --shop-id <shopId> --files /path/img1.jpg,/path/img2.jpg --json
```

返回：

```json
{
  "success": true,
  "images": [
    { "value": "1086608743767730915" },
    { "value": "1086608743823622409" }
  ]
}
```

> 图片路径是用户本地文件路径，Agent 需要向用户获取。`--image-ids` 保持字符串，不要转数字（19 位 ID 会精度丢失）。

#### 第 4 步：提交挂售

```bash
r2-cli goods hang-up submit \
  --shop-id <shopId> \
  --title "商品标题" \
  --price 599 \
  --category-id <catId> \
  --channel-cat-id <channelCatId> \
  --image-ids "id1,id2" \
  --stuff-status 95 \
  --desc "商品描述" \
  --out-item-no "商家编码" \
  --brand-name "Nike" \
  --size "42" \
  --item-attrs '[{"propId":"xx","valueId":"yy","valueName":"Nike"}]' \
  --json
```

成功返回：

```json
{ "success": true, "data": "上架成功" }
```

### 必填参数

| 参数 | 说明 |
|------|------|
| `--shop-id <id>` | 店铺 ID（即闲鱼用户名 account） |
| `--title <title>` | 商品标题 |
| `--price <amount>` | 售价 |
| `--category-id <id>` | 大分类 ID（从 categories 获取） |
| `--channel-cat-id <id>` | 小分类 ID（从 categories 获取） |
| `--image-ids <ids>` | 图片 ID 列表，逗号分隔（保持字符串） |
| `--stuff-status <n>` | 成色等级 |
| `--desc <desc>` | 商品描述 |
| `--out-item-no <no>` | 商家编码（同店铺唯一，用户自定义） |

### 成色等级

| 值 | 含义 |
|----|------|
| `100` | 全新 |
| `-1` | 准新 |
| `99` | 99新 |
| `95` | 95新 |
| `90` | 9新 |

### 可选参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--brand-name <name>` | — | 品牌名称 |
| `--size <size>` | — | 尺码 |
| `--goods-no <no>` | — | 货号 |
| `--original-price <amount>` | — | 原价 |
| `--trade-type <n>` | `0` | 交易方式：0 仅在线 / 1 仅线下 / 2 线上或线下 |
| `--transport-fee <amount>` | `0` | 运费（0 = 包邮） |
| `--division-id <id>` | `330100` | 行政区划 ID（市级，默认杭州） |
| `--item-attrs <json>` | — | 商品属性列表 JSON（来自 props/brands） |
| `--yhb` | `false` | 是否开启验货宝 |

> 内部默认值：`itemBizType=2`（普通商品）、`spBizType="16"`（奢品）

---

## 错误处理

所有 `--json` 命令统一错误格式：`{ "success": false, "error": "错误信息" }`

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `请先运行 r2-cli auth login 登录` | 未登录或 Token 过期 | 执行 `r2-cli auth login --json` |
| `Agent 模式需要 --stock-goods-id, --shop-id, --price` | `goods up --json` 缺少必填参数 | 补齐三个参数 |
| `请指定下架条件：--id 或 --stock-goods-id + --shop-id` | 下架缺少定位参数 | 补充参数 |
| `--price <amount> 为必填参数` | 改价未提供价格 | 询问用户新价格 |
| `请提供至少一张图片` | upload-images 无图片 | 提供本地图片路径 |
| `请填写有效的商品叶子类目` | category-id 或 channel-cat-id 错误 | 重新查询 categories |
| `找不到传入的某些图片` | 图片 ID 无效或过期 | 重新上传图片 |
| `轮询超时` | 上架结果查询超时 | 稍后用 `goods listing` 查看 |
