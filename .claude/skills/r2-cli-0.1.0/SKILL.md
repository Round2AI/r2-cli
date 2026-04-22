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
| `goods up [id]` | 上架商品（交互式5步向导） | `npm run dev -- goods up` |
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

### goods up 选项

不传商品 ID 时会加载待上架列表让你选择。

- `[goodsInfoId]` — 商品ID（可选，不传则交互选择）
- `--shop <shopId>` — 指定店铺
- `--biz-type <type>` — 商品类型
- `--stuff <status>` — 成色等级
- `--desc <desc>` — 商品描述
- `--price <price>` — 售价
- `--cat-id <catId>` — 分类ID
- `--channel-cat-id <id>` — 渠道分类ID
- `--barcode <barcode>` — 扣码（严选商品必填）

### goods up 分步执行（AI Agent 模式）

AI Agent 无法操作交互式选择器，使用以下子命令逐步上架：

#### 第1步：获取商品详情
```bash
npm run dev -- goods up info <goodsInfoId>
# 返回 JSON：商品详情 + 店铺信息 + 缓存地址
# 选项：--shop <shopId>  -p, --platform <xianyu|douyin>
```

#### 第2步：获取分类列表
```bash
npm run dev -- goods up categories
# 返回 JSON：分类树（catId → children → channelCatId）
```

#### 第3步：获取分类属性
```bash
npm run dev -- goods up props <channelCatId> --brand <keyword>
# 返回 JSON：属性列表 + 值列表，品牌属性会返回 matched 匹配结果
```

#### 第4步：提交上架
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
  --channel-cat-id <id> \
  --barcode <barcode> \
  --attrs '[{"propId":"xxx","valueId":"yyy","valueName":"运动鞋"}]'
# 返回 JSON：{ success: true, result: "..." } 或 { success: false, error: "..." }
```

## 上架流程（交互式5步）

`goods up` 是一个交互式向导，步骤：

1. **选择商品** — 从待同步列表中选择（支持分页加载）
2. **选择平台与店铺** — 先选平台（闲鱼/抖音），再选店铺
3. **填写信息** — 商品类型、成色、描述、售价、发货地址（地址会缓存到 `~/.r2-cli/config.json`）
4. **分类与属性** — 选择类目，系统会自动匹配品牌/尺码/成色并高亮提示
5. **确认提交** — 展示摘要确认

## 业务约束

- `goods up` 会排除商品原始 `price` 字段，只用用户确认的 `reservePrice` 和 `originalPrice`
- 发货地址缓存后下次直接展示确认，不同意可重新选择
- 严选商品（bizType=2）不显示服务保障选项
- 严选商品（bizType=15）必须输入扣码

## 开发中命令

| 命令 | 说明 |
|------|------|
| `report generate` | 经营日报/周报 |
| `pricing analyze` | 价格分析建议 |
| `inventory risk` | 风险管理 |
