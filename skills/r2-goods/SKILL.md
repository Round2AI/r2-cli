---
name: r2-goods
description: R2-CLI 商品管理专家。用于商品上架、下架、改价、列表等操作，支持交互式向导和 AI Agent 分步执行。触发关键词：上架、下架、商品列表、改价、goods、商品。
triggers:
  - 上架
  - 下架
  - 商品列表
  - 改价
  - goods
  - 商品
  - 寄售
  - 上架商品
role: specialist
scope: implementation
output-format: code
---

# R2-Goods Skill

商品管理专家，理解闲鱼/抖音商品上架全流程，能指导 AI Agent 正确调用 CLI 命令完成商品操作。

## 命令概览

| 命令 | 说明 |
|------|------|
| `goods shops` | 查看已授权店铺（`-p xianyu/douyin`） |
| `goods list` | 寄售商品列表（`--status wait/on/sold/down`） |
| `goods up` | 交互式上架向导（7步） |
| `goods down <ids...>` | 下架商品（支持批量） |
| `goods reup <ids...>` | 重新上架（支持批量） |
| `goods price <id> --price <amount>` | 修改售价 |

## goods list 选项

- `--status <status>` — `wait`(待上架)、`on`(已上架)、`sold`(已售)、`down`(已下架)
- `--keyword <keyword>` — 搜索关键词
- `--page <n>` / `--size <n>` — 分页

## 交互式上架（7步）

`goods up` 直接进入交互式向导：

1. **店铺选择**（缓存优先）— 有缓存直接确认，无缓存则选平台+店铺
2. **选择商品** — 从待同步列表中选择
3. **选择成色** — 商品类型 + 成色等级
4. **商品描述** — 输入描述
5. **选择类目** — 主类目 → 子类目
6. **售价** — 输入售价 + 扣码（严选商品）
7. **选择属性** — 品牌/尺码/成色自动匹配
8. **服务保障 + 确认** — 选择服务（仅严选），展示摘要确认

## AI Agent 分步上架流程

Agent 无法操作交互式选择器，使用子命令逐步执行：

```
1. goods up info [id]        → 获取商品列表/详情 + 店铺 + 地址 + 预填值
2. goods up address --set    → （仅地址为 null 时）设置发货地址
3. goods up categories       → 获取分类树
4. goods up props <catId>    → 获取分类属性 + 品牌搜索
5. goods up submit ...       → 提交上架
```

### 第1步：获取商品详情

```bash
# 列出待上架商品
npm run dev -- goods up info
# 返回: { goods: [{ id, name, image, goodsNo, size, price, status }], total }

# 获取指定商品详情
npm run dev -- goods up info <goodsInfoId>
# 返回: { shops, selectedShop, goodsDetail, prefill, address }
```

**prefill 字段**（建议值，Agent 可参考或调整）：

| 字段 | 说明 | 可选值 |
|------|------|--------|
| `itemBizType` | 商品类型 | `"15"`=严选, `"2"`=普通 |
| `stuffStatus` | 成色 | `"100"`全新, `"-1"`准新, `"99"`99新, `"95"`95新, `"90"`9新 |
| `reservePrice` | 建议售价 | 金额字符串 |
| `desc` | 商品描述 | 文本 |
| `barcode` | 扣码 | 严选商品必填 |
| `brandName` | 品牌名 | 用于品牌属性搜索 |
| `size` | 规格/尺码 | 用于尺码属性匹配 |

**address**：为 `null` 时需先执行 `goods up address --set`。

选项：`--shop <shopId>` `-p, --platform <xianyu|douyin>`

### 第2步：设置发货地址（如需要）

```bash
npm run dev -- goods up address --set
# 交互选择省→市→区，返回: { saved: { divisionId, province, city, area } }

npm run dev -- goods up address
# 查看: { address: { divisionId, ... } } 或 { address: null }
```

### 第3步：获取分类列表

```bash
npm run dev -- goods up categories
# 返回: [{ catId, catName, children: [{ channel, channelCatId }] }]
```

先选主类目（catId），再选子类目（channelCatId）。

### 第4步：获取分类属性

```bash
npm run dev -- goods up props <channelCatId> --brand <keyword>
# 返回: [{ propId, propName, propsValues: [{ valueId, valueName }], matched? }]
```

- 品牌属性传 `--brand` 会返回 `matched` 匹配结果
- Agent 应优先使用 `matched` 中的值

### 第5步：提交上架

```bash
npm run dev -- goods up submit \
  --goods-id <id> \
  --account <shopThirdUserId> \
  --biz-type <15|2> \
  --price <amount> \
  --stuff <100|99|95|90|-1> \
  --desc <desc> \
  --division-id <id> \
  --cat-id <catId> \
  --channel-cat-id <channelCatId> \
  --attrs-file <path> \
  --services-file <path>
```

**必填参数**：`--goods-id`, `--account`, `--biz-type`, `--price`, `--stuff`, `--desc`, `--division-id`, `--cat-id`, `--channel-cat-id`

**可选参数**：
- `--barcode` — 严选商品（bizType=15）必填
- `--goods-no` — 货号
- `--size` — 规格
- `--title` — 标题
- `--attrs` / `--attrs-file` — 属性列表 JSON（文件优先）
- `--services` / `--services-file` — 服务保障 JSON（文件优先）

**services 字段**：`supportFd24hsPolicy`, `supportFd48hsPolicy`, `supportNfrPolicy`, `supportSdrPolicy`

## 缓存

- **店铺**：首次选择后缓存到 `~/.r2-cli/config.json`，下次自动使用
- **地址**：`address --set` 或交互式设置后缓存

## 业务约束

- 排除商品原始 `price`，只用用户确认的 `reservePrice` 和 `originalPrice`
- 严选商品（bizType=15）必须输入扣码
- 普通商品（bizType=2）不显示服务保障选项
- Windows 下 `--desc` 含空格会被 shell 拆分，建议用文件方式传 JSON
