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
> **Tip**: `hang-up` 挂售流程：**先上传图片 → Agent 尝试识别图片自动填充信息（不能识别则询问用户）→ 匹配类目/属性 → 提交**。支持多模态的 Agent（Claude Code/Gemini）可自动识别，不支持的 Agent 走询问路径。

商品管理专家，指导 AI Agent 完成商品上架、下架、改价、挂售全流程。

## CRITICAL

安装、统一错误格式见 **r2-shared** skill。认证登录见 **r2-auth** skill。

## 上架路由决策

用户说"上架商品"时，按以下规则选择上架方式：

| 条件 | 上架方式 | 流程 |
|------|----------|------|
| 商品**在选品库**中（用户没提供图片、类目等详细信息） | `goods up`（普通上架） | 店铺 → 仓库 → 选品商品 → 输入价格 → 提交 |
| 用户**提供了图片**，或商品**不在选品库** | `goods hang-up`（挂售上架） | 上传图片 → AI 读图识别 → 类目/属性 → 提交 |

**判断方法**：
1. 用户只说"上架"没给细节 → 先查选品库（`goods list`），有商品就走 `goods up`，**选品库为空则自动走 `goods hang-up`，不需要再问用户**
2. 用户提供了图片文件 → 直接走 `goods hang-up`，Agent 会用 Read 工具查看图片自动识别商品信息
3. 不确定时 → 问用户："商品在选品库里吗？还是有图片需要挂售上架？"

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

**核心理念**：先上传图片，Agent 尝试识别图片内容自动填充商品信息；无法识别时向用户询问。

### Agent 挂售流程

**核心原则**：
- 缺少的必填信息（价格、商家编码）**在流程中尽早询问**，不要积攒到最后
- Agent 自动识别图片、匹配类目/属性、构建参数，**直接提交**，不需要用户确认
- 提交成功后展示上架结果（商品信息摘要），让用户知道上架了什么
- `item-attrs` 中 `propId` 和 `valueId` 是不同的值，构建时从 props 返回数据中取准确值

**图片识别降级策略**：

| Agent 能力 | 处理方式 |
|------------|----------|
| 能查看图片（多模态） | 用 Read 工具读图 → 自动识别品牌/成色/类目/描述 |
| 不能查看图片 | 跳过识别 → 向用户询问品牌、类目、成色、描述等信息 |

> 不同 Agent 能力不同（Claude Code / Gemini 支持读图，部分 Agent 不支持）。Agent 应自行判断是否能识别图片，不能则直接走询问路径。两条路径最终都走相同的 submit 提交。

#### 第 1 步：上传图片 + 识别商品信息（并行）

**上传图片**：

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

> 图片路径是用户本地文件路径。`--image-ids` 保持字符串，不要转数字（19 位 ID 会精度丢失）。

**同时尝试识别图片**：如果 Agent 支持多模态（如 Claude Code、Gemini），用 Read 工具查看用户图片文件，识别以下信息。不支持则跳过，改为向用户询问。

> **多图不一致处理**：如果多张图片显示不同商品（如不同款式、不同品牌），Agent 应识别后告知用户，只保留同一商品的图片。不要把不同商品混在一起提交。

| 识别内容 | 提取信息 | 用途 |
|----------|----------|------|
| 商品类型 | 鞋/包/衣服/配饰/数码等 | 匹配闲鱼类目 |
| 品牌 Logo/标签 | Nike/Gucci/LV 等 | `--brand-name` + brands 搜索 |
| 成色状态 | 全新/轻微使用/明显磨损 | `--stuff-status` |
| 颜色 | 白色/黑色/彩色等 | item-attrs 属性 |
| 款式/材质 | 低帮鞋/皮质/帆布等 | item-attrs 属性 |
| 尺码标签 | 42/EU40/M 等 | `--size` |
| 综合信息 | — | 生成 `--title` 和 `--desc` |

**识别后自动生成**：
- `--title`：根据品牌+品类+关键特征生成简洁标题（如 "Nike Air Force 1 白色 42码 95新"）
- `--desc`：综合图片信息生成商品描述

**成色判断映射**：

| 图片中商品状态 | `--stuff-status` 值 |
|----------------|---------------------|
| 带吊牌/未拆封 | `100`（全新） |
| 几乎无使用痕迹 | `-1`（准新）或 `99`（99新） |
| 轻微使用痕迹 | `95`（95新） |
| 明显使用痕迹 | `90`（9新） |

**如果用户没提供价格和商家编码，此时询问**（不要留到最后）。

#### 第 2 步：匹配类目 + 属性（串行）

**获取类目并自动匹配**：

```bash
r2-cli goods hang-up categories --json
```

Agent 根据图片识别结果自动匹配类目。常见匹配：

| 识别结果 | 推荐匹配 |
|----------|----------|
| 运动鞋/板鞋 | 鞋靴 → 男鞋/女鞋 → 低帮鞋 |
| 手提包/斜挎包 | 箱包 → 女士包/男士包 |
| T恤/卫衣/外套 | 服装 → 男装/女装 |
| 手表 | 腕表/饰品 |

**获取属性并自动匹配**：

```bash
r2-cli goods hang-up props --channel-cat-id <channelCatId> --json
```

> props 响应可能很大（几十 KB），Agent 应直接搜索关键属性名，用 Grep 提取 propId 和匹配的 valueId/valueName。

**属性匹配优先级**（按重要性排序）：

| 优先级 | 属性 | 说明 |
|--------|------|------|
| 1 | 品牌 | 用 brands 搜索确认，**必须精确匹配，忽略近似名称** |
| 2 | 款式 | 运动鞋/休闲鞋/皮鞋等，从识别结果匹配 |
| 3 | 鞋码/尺码 | 42/43/M/L 等，从用户输入或图片识别 |
| 4 | 成色 | 全新/几乎全新/轻微穿着痕迹/明显穿着痕迹 |
| 5 | 其他 | 颜色、材质等，能匹配则填，不能则跳过 |

**品牌精确匹配规则**：
- brands 搜索会返回近似名称（如搜 Nike 会返回 BACHNIKE、NIKE 7 等），Agent 必须选择**完全匹配**的官方品牌名称
- 例如搜 "Nike" → 只选 `Nike/耐克`，忽略 `BACHNIKE`、`NIKE 7/妮刻柒号` 等

```bash
r2-cli goods hang-up brands --channel-cat-id <id> --prop-id <品牌propId> --key "Nike" --json
```

最终构建 `--item-attrs`（**注意 propId 和 valueId 是不同字段**）：

```json
[
  { "propId": "1d6d7611...", "valueId": "af8266ea...", "valueName": "运动鞋" },
  { "propId": "30dc3038...", "valueId": "d64b3e52...", "valueName": "42" }
]
```

#### 第 3 步：提交挂售

**所有参数就绪后直接提交，不需要用户确认**：

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

**提交后展示上架结果摘要**（让用户知道上架了什么）：

```
上架成功！
- 标题：Nike 低帮运动鞋 白色 42码
- 价格：¥99999
- 品牌：Nike/耐克
- 类目：男士鞋靴 → 低帮鞋
- 成色：全新
- 店铺：xxx
```

### 必填字段处理

缺少时**在流程中尽早询问用户**，不要等所有信息都收集完再问：

| 缺失字段 | 何时询问 | 询问方式 |
|----------|----------|----------|
| `--price`（售价） | 上传图片时 | "这个商品上架价格是多少？" |
| `--out-item-no`（商家编码） | 上传图片时 | "商家编码是什么？（同店铺唯一标识）" |
| `--shop-id`（店铺） | 流程开始时 | 展示店铺列表让用户选择 |
| `--title`（标题） | 图片识别无法生成时 | "商品标题用什么？" |
| `--desc`（描述） | 图片识别无法生成时 | "商品描述？" |

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
