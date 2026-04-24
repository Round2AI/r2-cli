---
name: r2-goods
description: R2-CLI 商品管理专家。用于商品上架、下架、改价、列表等操作，支持交互式向导和 AI Agent 分步执行（上架、下架、商品列表、改价、goods、商品、寄售）。
---

# R2-Goods Skill

商品管理专家，理解闲鱼/抖音商品上架全流程，能指导 AI Agent 正确调用 CLI 命令完成商品操作。

## 安装与调用方式

全局安装：
```bash
npm install -g @round2ai/r2-cli@latest
```

自动检测命令前缀（首次使用时执行一次）：
1. 项目目录有 `package.json`（name 含 r2-cli）→ 使用 `npm run dev --`
2. 存在 `dist/r2-cli.js` → 使用 `node dist/r2-cli.js`
3. `r2-cli --version` 成功 → 使用 `r2-cli`

以下文档使用 `r2-cli` 作为前缀，根据检测结果替换。

## 命令概览

| 命令 | 说明 |
|------|------|
| `r2-cli goods shops` | 查看已授权店铺（`-p xianyu/douyin`） |
| `r2-cli goods list` | 寄售商品列表（`--status wait/on/sold/down`） |
| `r2-cli goods up` | 交互式上架向导（7步） |
| `r2-cli goods down <ids...>` | 下架商品（支持批量） |
| `r2-cli goods reup <ids...>` | 重新上架（支持批量） |
| `r2-cli goods price <id> --price <amount>` | 修改售价 |

## goods list 选项

- `--status <status>` — `wait`(待上架)、`on`(已上架)、`sold`(已售)、`down`(已下架)
- `--keyword <keyword>` — 搜索关键词
- `--page <n>` / `--size <n>` — 分页

## 交互式上架（7步）

`r2-cli goods up` 直接进入交互式向导：

1. **店铺选择**（缓存优先）— 有缓存直接确认，无缓存则选平台+店铺
2. **选择商品** — 从待同步列表中选择
3. **选择成色** — 成色等级（商品类型固定为普通商品）
4. **商品描述** — 输入描述
5. **选择类目** — 主类目 → 子类目
6. **售价** — 输入售价
7. **选择属性** — 品牌/尺码/成色自动匹配
8. **确认提交** — 展示摘要确认

> 目前仅支持普通商品（bizType=2），严选商品暂不支持。

## AI Agent 分步上架流程

Agent 无法操作交互式选择器，使用子命令逐步执行：

```
1. r2-cli goods list --status wait     → 获取待上架商品列表
2. r2-cli goods up info <id>           → 获取商品详情 + 店铺 + 地址 + 预填值
3. r2-cli goods up address ...         → （仅地址为 null 时）设置发货地址
4. r2-cli goods up categories          → 获取分类树
5. r2-cli goods up props <catId>       → 获取分类属性 + 品牌搜索
6. r2-cli goods up submit ...          → 提交上架
```

### 第1步：获取待上架商品列表

```bash
r2-cli goods list --status wait
# 表格输出：ID、名称、货号、规格、售价
```

### 第2步：获取商品详情

```bash
r2-cli goods up info <goodsInfoId>
# 返回: { shops, selectedShop, goodsDetail(含goodsInfoId), prefill, address }
```

**prefill 字段**（建议值，Agent 可参考或调整）：

| 字段 | 说明 | 可选值 |
|------|------|--------|
| `stuffStatus` | 成色 | `"100"`全新, `"-1"`准新, `"99"`99新, `"95"`95新, `"90"`9新 |
| `reservePrice` | 建议售价 | 金额 |
| `desc` | 商品描述 | 文本 |
| `brandName` | 品牌名 | 用于品牌属性搜索 |
| `size` | 规格/尺码 | 用于尺码属性匹配 |

**address**：为 `null` 时需先执行 `r2-cli goods up address --save`。

选项：`--shop <shopId>` `-p, --platform <xianyu|douyin>`

### 第3步：设置发货地址（如需要）

非交互式（Agent 推荐）：

```bash
# 列出省份
r2-cli goods up address --provinces
# 列出城市
r2-cli goods up address --cities <省份名>
# 列出地区
r2-cli goods up address --areas <城市名> --province <省份名>
# 保存地址
r2-cli goods up address --save --province <省> --city <市> --area-code <code>
```

交互式（人类使用）：

```bash
r2-cli goods up address --set
```

查看当前地址：

```bash
r2-cli goods up address
```

### 第4步：获取分类列表

```bash
r2-cli goods up categories
# 返回: [{ catId, catName, children: [{ channel, channelCatId }] }]
```

先选主类目（catId），再选子类目（channelCatId）。

### 第5步：获取分类属性

```bash
r2-cli goods up props <channelCatId> --brand <keyword>
# 返回: [{ propId, propName, propsValues: [{ valueId, valueName }], matched? }]
```

- 品牌属性传 `--brand` 会返回 `matched` 匹配结果
- Agent 应优先使用 `matched` 中的值

### 第6步：提交上架

```bash
# 1. 保存 goodsDetail 到文件（从 info 输出中提取 goodsDetail 字段）
# 2. 保存属性列表到文件
# 3. 调用 submit

r2-cli goods up submit \
  --data @detail.json \
  --division-id <id> \
  --cat-id <catId> \
  --channel-cat-id <channelCatId> \
  --goods-no <货号> \
  --size <规格> \
  --attrs @attrs.json \
  --services @services.json
```

**`--data`**：goodsDetail JSON（`@file.json` 从文件读取，或直接传 JSON 字符串）。goodsDetail 中已包含 `goodsInfoId`、`account`、`imageList`、`spBizType` 等全量字段，会透传给上架接口。

**必填参数**：`--data`、`--division-id`、`--cat-id`、`--channel-cat-id`

**可选覆盖参数**：
- `--price <amount>` — 覆盖售价
- `--stuff <status>` — 覆盖成色
- `--desc <desc>` — 覆盖描述
- `--goods-no <no>` — 货号
- `--size <size>` — 规格
- `--title <title>` — 标题
- `--attrs <json>` — 属性列表 JSON（`@file.json` 从文件读取）
- `--services <json>` — 服务保障 JSON（`@file.json` 从文件读取）

**attrs 格式**：
```json
[
  { "propId": "xxx", "valueId": "yyy", "valueName": "JORDAN" }
]
```

## 缓存

- **店铺**：首次选择后缓存到 `~/.r2-cli/config.json`，下次自动使用
- **地址**：`address --save` 或交互式设置后缓存

## 业务约束

- 排除商品原始 `price`，只用用户确认的 `reservePrice` 和 `originalPrice`
- 目前仅支持普通商品（itemBizType=2）
- Windows 下 JSON 参数建议用 `@file.json` 方式传
