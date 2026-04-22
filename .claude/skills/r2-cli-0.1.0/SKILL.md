---
name: r2-cli
description: R2-CLI 二手潮奢交易工具。用于闲鱼商品管理（上架/下架/改价/列表）、认证登录、经营分析等。触发关键词：闲鱼、上架、下架、商品列表、改价、xy、r2。
triggers:
  - 闲鱼
  - 上架
  - 下架
  - 商品列表
  - 改价
  - xy
  - r2
  - 寄售
  - xianyu
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

### 闲鱼管理 `r2 xy`

| 命令 | 说明 | 示例 |
|------|------|------|
| `xy shops` | 查看已授权店铺 | `npm run dev -- xy shops` |
| `xy list` | 寄售商品列表 | `npm run dev -- xy list --status wait` |
| `xy up [id]` | 上架到闲鱼（交互式5步向导） | `npm run dev -- xy up` |
| `xy down <ids...>` | 下架商品（多ID空格分隔） | `npm run dev -- xy down abc123 def456` |
| `xy reup <ids...>` | 重新上架 | `npm run dev -- xy reup abc123` |
| `xy price <id> --price <amount>` | 修改售价 | `npm run dev -- xy price abc123 --price 299` |

### xy list 选项

- `--status <status>` — 状态过滤：`wait`(待上架)、`on`(已上架)、`sold`(已售)、`down`(已下架)
- `--keyword <keyword>` — 搜索关键词
- `--page <n>` — 页码（默认 1）
- `--size <n>` — 每页数量（默认 20）

### xy up 选项

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

## 上架流程（交互式5步）

`xy up` 是一个交互式向导，步骤：

1. **选择商品** — 从待同步列表中选择（支持分页加载）
2. **选择店铺** — 显示已授权店铺，过期店铺会标注
3. **填写信息** — 商品类型、成色、描述、售价、发货地址（地址会缓存到 `~/.r2-cli/config.json`）
4. **分类与属性** — 选择类目，系统会自动匹配品牌/尺码/成色并高亮提示
5. **确认提交** — 展示摘要确认

## 业务约束

- `xy up` 会排除商品原始 `price` 字段，只用用户确认的 `reservePrice` 和 `originalPrice`
- 发货地址缓存后下次直接展示确认，不同意可重新选择
- 严选商品（bizType=2）不显示服务保障选项
- 严选商品（bizType=15）必须输入扣码

## 开发中命令

| 命令 | 说明 |
|------|------|
| `report generate` | 经营日报/周报 |
| `pricing analyze` | 价格分析建议 |
| `inventory risk` | 风险管理 |
