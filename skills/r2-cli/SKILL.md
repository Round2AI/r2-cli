---
name: r2-cli
description: R2-CLI 二手潮奢交易工具。用于商品管理（上架/下架/改价/列表）、认证登录、经营分析等。触发关键词：上架、下架、商品列表、改价、goods、r2。
triggers:
  - 上架
  - 下架
  - 商品列表
  - 改价
  - goods
  - r2
  - 寄售
  - r2-cli
role: specialist
scope: implementation
output-format: code
---

# R2-CLI Skill

R2-CLI 业务专家，理解二手潮奢交易全链路，能指导 AI Agent 正确调用 CLI 命令完成业务操作。

## 调用方式

```bash
# 开发模式（推荐，不需要构建）
npm run dev -- <command> [args]

# 构建后
node dist/cli.js <command> [args]
```

## 前置条件

- 必须先登录：`npm run dev -- auth login`（扫码登录）
- 检查登录状态：`npm run dev -- auth status`
- Token 过期会自动刷新，刷新失败才需要重新登录

## 已实现命令

### 认证 `r2 auth`

| 命令 | 说明 |
|------|------|
| `auth login` | 扫码登录（生成二维码 → 手机扫码 → 确认） |
| `auth logout` | 退出登录 |
| `auth status` | 查看登录状态和用户信息 |

### 商品管理 `r2 goods`

| 命令 | 说明 | 示例 |
|------|------|------|
| `goods shops` | 查看已授权店铺 | `npm run dev -- goods shops` |
| `goods list` | 寄售商品列表 | `npm run dev -- goods list --status wait` |
| `goods up` | 上架商品（交互式7步向导） | `npm run dev -- goods up` |
| `goods down <ids...>` | 下架商品（多ID空格分隔） | `npm run dev -- goods down abc123 def456` |
| `goods reup <ids...>` | 重新上架 | `npm run dev -- goods reup abc123` |
| `goods price <id> --price <amount>` | 修改售价 | `npm run dev -- goods price abc123 --price 299` |

### goods shops 选项

- `-p, --platform <platform>` — 平台：`xianyu`(闲鱼)、`douyin`(抖音)，默认 `xianyu`

### goods list 选项

- `--status <status>` — 状态过滤：`wait`(待上架)、`on`(已上架)、`sold`(已售)、`down`(已下架)
- `--keyword <keyword>` — 搜索关键词
- `--page <n>` — 页码（默认 1）
- `--size <n>` — 每页数量（默认 20）

### goods up 交互式选项

`goods up` 直接进入交互式向导，可预填部分参数跳过交互：

- `--shop <shopId>` — 指定店铺
- `--biz-type <type>` — 商品类型
- `--stuff <status>` — 成色等级
- `--desc <desc>` — 商品描述
- `--price <price>` — 售价
- `--cat-id <catId>` — 分类ID
- `--channel-cat-id <id>` — 渠道分类ID
- `--barcode <barcode>` — 扣码（严选商品必填）

## AI Agent 分步上架流程

AI Agent 无法操作交互式选择器，使用以下子命令逐步上架：

### 完整流程

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

**prefill 字段说明**（建议值，Agent 可参考或调整）：

| 字段 | 说明 | 可选值 |
|------|------|--------|
| `itemBizType` | 商品类型 | `"15"`=严选, `"2"`=普通 |
| `stuffStatus` | 成色 | `"100"`全新, `"-1"`准新, `"99"`99新, `"95"`95新, `"90"`9新 |
| `reservePrice` | 建议售价 | 金额字符串 |
| `desc` | 商品描述 | 文本 |
| `barcode` | 扣码 | 严选商品必填 |
| `brandName` | 品牌名 | 用于品牌属性搜索 |
| `size` | 规格/尺码 | 用于尺码属性匹配 |

**address 字段**：如果为 `null`，需先执行 `goods up address --set`。

选项：`--shop <shopId>` `-p, --platform <xianyu|douyin>`

### 第2步：设置发货地址（如需要）

```bash
npm run dev -- goods up address --set
# 交互选择省→市→区后返回: { saved: { divisionId, province, city, area } }

# 或查看当前缓存地址
npm run dev -- goods up address
# 返回: { address: { divisionId, province, city, area } } 或 { address: null }
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
  --attrs '[{"propId":"xxx","valueId":"yyy","valueName":"运动鞋"}]' \
  --services '{"supportFd24hsPolicy":true}'
# 返回: { success: true, result: "..." } 或 { success: false, error: "..." }
```

**必填参数**：`--goods-id`, `--account`, `--biz-type`, `--price`, `--stuff`, `--desc`, `--division-id`, `--cat-id`, `--channel-cat-id`

**可选参数**：
- `--barcode` — 严选商品（bizType=15）必填
- `--goods-no` — 货号
- `--size` — 规格
- `--title` — 标题
- `--attrs` — 属性列表 JSON
- `--services` — 服务保障 JSON，字段：`supportFd24hsPolicy`, `supportFd48hsPolicy`, `supportNfrPolicy`, `supportSdrPolicy`

## 交互式上架流程（7步）

`goods up` 直接进入交互式向导：

1. **店铺选择**（缓存优先）— 有缓存直接确认，无缓存则选平台+店铺，选中后缓存
2. **选择商品** — 从待同步列表中选择
3. **选择成色** — 商品类型 + 成色等级
4. **商品描述** — 输入描述文本
5. **选择类目** — 主类目 → 子类目
6. **售价** — 输入售价 + 扣码（严选商品）
7. **选择属性** — 品牌/尺码/成色自动匹配，其他手动选择
8. **服务保障 + 确认** — 选择服务（仅严选），展示摘要确认

## 店铺与地址缓存

- **店铺缓存**：首次选择后保存到 `~/.r2-cli/config.json`，下次自动使用
- **地址缓存**：首次选择后保存，交互式和 `address --set` 都会更新缓存
- Agent 调用 `info` 时自动使用缓存的店铺和地址

## 业务约束

- `goods up` 会排除商品原始 `price` 字段，只用用户确认的 `reservePrice` 和 `originalPrice`
- 严选商品（bizType=15）必须输入扣码
- 普通商品（bizType=2）不显示服务保障选项
- Token 存储在 `~/.r2-cli/config.json`，过期自动刷新

## 开发中命令

| 命令 | 说明 |
|------|------|
| `report generate` | 经营日报/周报 |
| `pricing analyze` | 价格分析建议 |
| `inventory risk` | 风险管理 |
