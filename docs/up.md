# 闲鱼商品上架流程文档

## 概述

通过 `r2 xy up` 命令将寄售商品上架到闲鱼平台，支持交互式向导和纯参数两种模式。

## 命令

```bash
# 交互式向导（推荐）：自动加载未同步商品列表，一步步引导
r2 xy up

# 指定商品 ID：跳过商品选择步骤
r2 xy up <goodsInfoId>

# 纯参数模式：跳过所有交互，直接提交
r2 xy up <goodsInfoId> --shop <shopId> --biz-type 15 --stuff 99 --price 899 --cat-id 12 --channel-cat-id 345
```

### 参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| `goodsInfoId` | 否 | 商品 ID，不传则从列表选择 |
| `--shop` | 否 | 闲鱼店铺 ID（thirdUserId） |
| `--biz-type` | 否 | 商品类型：`15`=闲鱼严选，`2`=普通商品 |
| `--stuff` | 否 | 成色等级：`100`全新 / `-1`准新 / `99`99新 / `95`95新 / `90`9新 |
| `--price` | 否 | 售价 |
| `--desc` | 否 | 商品描述 |
| `--cat-id` | 否 | 主类目 ID |
| `--channel-cat-id` | 否 | 子类目 ID |
| `--barcode` | 否 | 商品扣码（严选商品必填） |

---

## 上架流程（5 步）

### 步骤 1/5：选择商品

从寄售商品列表中选取待同步的商品。

**API**: `GET /v3/mms/seller/goods/info/list?status=wait`

> `status` 过滤值：`wait`=未同步 / `on`=在售 / `sold`=已售出 / `down`=已下架

展示商品列表后通过 inquirer 选择，显示信息：商品名称、ID、货号、规格、售价。

### 步骤 2/5：选择店铺

选择已授权的闲鱼店铺。

**API**: `GET /v3/platform/xy/shop/list`

选择时自动检查授权状态（`expiresIn`），过期店铺标红提示。选中后获取商品详情：

**API**: `GET /v3/mms/seller/xy/goods/info?goodsInfoId={id}&xyShopId={shopId}`

响应中包含预填信息：`itemBizType`、`stuffStatus`、`reservePrice`、`desc`、`barcode`、`brandName`、`size` 等。

### 步骤 3/5：填写上架信息

| 字段 | 来源优先级 | 说明 |
|------|-----------|------|
| 商品类型 `itemBizType` | 命令行参数 → API 返回 → 交互选择 | 严选=15 / 普通=2 |
| 成色 `stuffStatus` | 命令行参数 → API 返回 → 交互选择 | 100/-1/99/95/90 |
| 描述 `desc` | 命令行参数 → API 返回 → 交互输入 | |
| 售价 `reservePrice` | 命令行参数 → API 返回 → 交互输入 | |
| 扣码 `barcode` | 命令行参数 → API 返回 → 交互输入 | 仅严选商品 (`bizType=15`) 必填 |

### 步骤 4/5：分类与属性

**4.1 选择类目**

**API**: `GET /v3/platform/xy/cat?spBizType=16`

类目为二级结构：主类目（catId/catName）→ 子类目（channelCatId/channel）。先选主类目，再选子类目。

**4.2 选择属性**

选定子类目后加载属性列表：

**API**: `GET /v3/platform/xy/props?channelCatId={id}`

属性自动匹配规则：
- **品牌**：先用 API 返回的 `brandName` 自动搜索 `platform/xy/props/value`，匹配失败则手动输入关键词搜索
- **尺码/鞋码**：用 API 返回的 `size` 自动匹配，匹配成功直接跳过
- **成色**：用 `stuffStatus` 映射（100→全新、99→几乎全新、95→轻微穿着痕迹、90→明显穿着痕迹）自动匹配
- **其他属性**：从列表手动选择

品牌搜索 API：`GET /v3/platform/xy/props/value?channelCatId={id}&propId={propId}&key={keyword}`

属性提交格式：
```json
{
  "itemAttrList": [
    { "propId": "xxx", "valueId": "yyy", "valueName": "Nike" },
    { "propId": "zzz", "valueId": "www", "valueName": "42" }
  ]
}
```

**4.3 服务保障**（仅严选商品 `bizType=15`）

| 服务项 | 字段 |
|--------|------|
| 24小时发货 | `supportFd24hsPolicy` |
| 48小时发货 | `supportFd48hsPolicy` |
| 描述不符包退 | `supportNfrPolicy` |
| 七天无理由 | `supportSdrPolicy` |

> 普通商品 (`bizType=2`) 自动跳过，所有服务置为 `false`。

### 步骤 5/5：确认提交

展示完整上架摘要（店铺、类型、成色、售价、描述、分类、属性、服务保障），确认后提交。

**API**: `POST /v3/mms/seller/xy/goods/up`

请求体（关键字段）：

```json
{
  "goodsInfoId": "商品ID",
  "account": "闲鱼用户thirdUserId",
  "itemBizType": "15",
  "reservePrice": "899",
  "originalPrice": "899",
  "stuffStatus": "99",
  "desc": "商品描述",
  "categoryId": "主类目ID",
  "channelCatId": "子类目ID",
  "itemAttrList": [
    { "propId": "xxx", "valueId": "yyy", "valueName": "Nike" }
  ],
  "apiAfterSalesDo": {
    "supportFd24hsPolicy": true,
    "supportFd48hsPolicy": false,
    "supportNfrPolicy": true,
    "supportSdrPolicy": false
  },
  "barcode": "扣码（严选商品）"
}
```

> 该接口超时 3 分钟，提交后等待返回结果。

---

## 其他命令

```bash
r2 xy shops                          # 查看授权店铺列表
r2 xy list [--status on] [--keyword Nike]  # 寄售商品列表
r2 xy down <id> [id2...]             # 下架商品（支持批量）
r2 xy reup <id> [id2...]             # 重新上架（支持批量）
r2 xy price <id> --price <amount>    # 修改售价
```

## 认证

所有闲鱼命令需要先登录：

```bash
r2 auth login    # 扫码登录
r2 auth status   # 查看登录状态
```

Token 存储在 `~/.r2-cli/config.json`，过期或无效时自动提示重新登录。

## 相关 API 端点汇总

| 端点 | 方法 | 用途 |
|------|------|------|
| `/v3/platform/xy/shop/list` | GET | 闲鱼授权店铺列表 |
| `/v3/mms/seller/goods/info/list` | GET | 寄售商品列表 |
| `/v3/mms/seller/xy/goods/info` | GET | 获取上架商品详情 |
| `/v3/platform/xy/cat` | GET | 闲鱼类目 |
| `/v3/platform/xy/props` | GET | 类目属性 |
| `/v3/platform/xy/props/value` | GET | 属性值（品牌搜索） |
| `/v3/mms/seller/xy/goods/up` | POST | 提交上架 |
| `/v3/mms/seller/xy/goods/batch/down` | GET | 批量下架 |
| `/v3/mms/seller/xy/goods/reUp` | GET | 批量重新上架 |
| `/v3/mms/seller/xy/goods/update/price` | POST | 修改售价 |
