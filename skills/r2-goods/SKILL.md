---
name: r2-goods
description: R2-CLI 商品管理专家。用于商品上架/下架/改价、查看店铺/仓库/选品商品/上架列表。Agent 获取数据后展示给用户选择，完成 4 步上架流程。触发词：上架、下架、改价、商品列表、goods、up、down、price、shops、stocks、listing、list。
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

## 错误处理

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
