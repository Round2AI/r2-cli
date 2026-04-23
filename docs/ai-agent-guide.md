# R2-CLI AI Agent 使用指南

R2-CLI 是二手潮奢交易命令行工具，提供商品管理（上架/下架/改价/列表）、认证登录、经营分析等能力。本文档帮助 AI Agent 正确调用 R2-CLI 完成任务。

## 命令前缀

首次使用时按以下顺序检测命令前缀，匹配第一个成功的即可：

| 优先级 | 检测方式 | 命令前缀 |
|--------|----------|----------|
| 1 | 当前目录有 `package.json`（name 含 `r2-cli`） | `npm run dev --` |
| 2 | 存在 `dist/cli.js` | `node dist/cli.js` |
| 3 | 全局安装 `r2 --version` 成功 | `r2` |

以下文档使用 `r2` 作为前缀，根据检测结果替换。

## 前置条件：登录

所有商品操作需要先登录。**Agent 不要直接运行 `r2 auth login`**（交互式命令，Agent 无法操作），应使用两步式流程：

### 第1步：生成二维码

```bash
r2 auth login qr
```

返回 JSON：
```json
{
  "qrToken": "xxx",
  "expireTimeMs": 300000,
  "pollIntervalMs": 800,
  "qrPath": "/path/to/qrcode.png",
  "unicodeQR": "█▀▀▀▀▀█ ..."
}
```

**必须**：将 `unicodeQR` 字段的值直接输出给用户（终端半块字符二维码），让用户用手机 APP 扫码。

### 第2步：立即轮询

输出二维码后，**不要等待用户回复**，立即后台启动轮询：

```bash
r2 auth login poll --token <qrToken> --expire <expireTimeMs> --interval <pollIntervalMs>
```

成功返回 `{"success": true, "userInfo": {...}, "token": "..."}` 。
失败返回 `{"success": false, "error": "..."}` ，需重新执行第1步。

### 其他认证命令

| 命令 | 说明 |
|------|------|
| `r2 auth status` | 查看登录状态 |
| `r2 auth logout` | 退出登录 |

## 商品管理

### 命令速查

| 命令 | 说明 |
|------|------|
| `r2 goods shops -p <xianyu\|douyin>` | 查看已授权店铺 |
| `r2 goods list --status <status>` | 商品列表 |
| `r2 goods up` | 交互式上架向导（人类用） |
| `r2 goods down <ids...>` | 下架商品（支持批量） |
| `r2 goods reup <ids...>` | 重新上架（支持批量） |
| `r2 goods price <id> --price <amount>` | 修改售价 |

### goods list 状态过滤

`--status` 可选值：`wait`（待上架）、`on`（已上架）、`sold`（已售）、`down`（已下架）

其他选项：`--keyword <keyword>`、`--page <n>`、`--size <n>`

## Agent 分步上架

Agent 无法操作交互式 `r2 goods up`，应使用以下原子子命令逐步执行：

```
1. r2 goods list --status wait           → 获取待上架商品列表
2. r2 goods up info <id>                 → 获取商品详情 + 店铺 + 地址 + 预填值
3. r2 goods up address ...               → 设置发货地址（仅地址为 null 时）
4. r2 goods up categories                → 获取分类树
5. r2 goods up props <channelCatId>      → 获取分类属性 + 品牌搜索
6. r2 goods up submit ...                → 提交上架
```

### 第1步：获取待上架商品

```bash
r2 goods list --status wait
# 表格输出：ID、名称、货号、规格、售价
```

### 第2步：获取商品详情

```bash
r2 goods up info <goodsInfoId>
# 返回: { shops, selectedShop, goodsDetail, prefill, address }
```

**prefill 字段**（建议值，可参考或调整）：

| 字段 | 说明 | 可选值 |
|------|------|--------|
| `stuffStatus` | 成色 | `"100"`全新、`"-1"`准新、`"99"`99新、`"95"`95新、`"90"`9新 |
| `reservePrice` | 建议售价 | 金额 |
| `desc` | 商品描述 | 文本 |
| `brandName` | 品牌名 | 用于品牌属性搜索 |
| `size` | 规格/尺码 | 用于尺码属性匹配 |

**address** 为 `null` 时需先执行地址设置。

选项：`--shop <shopId>`、`-p <xianyu|douyin>`

### 第3步：设置发货地址（如需要）

```bash
# 列出省份
r2 goods up address --provinces
# 列出城市
r2 goods up address --cities <省份名>
# 列出地区
r2 goods up address --areas <城市名> --province <省份名>
# 保存地址
r2 goods up address --save --province <省> --city <市> --area-code <code>
```

### 第4步：获取分类列表

```bash
r2 goods up categories
# 返回: [{ catId, catName, children: [{ channel, channelCatId }] }]
```

先选主类目（catId），再选子类目（channelCatId）。

### 第5步：获取分类属性

```bash
r2 goods up props <channelCatId> --brand <keyword>
# 返回: [{ propId, propName, propsValues: [{ valueId, valueName }], matched? }]
```

`--brand` 会返回 `matched` 匹配结果，Agent 应优先使用 `matched` 中的值。

### 第6步：提交上架

```bash
r2 goods up submit \
  --data @detail.json \
  --division-id <id> \
  --cat-id <catId> \
  --channel-cat-id <channelCatId> \
  --goods-no <货号> \
  --size <规格> \
  --attrs @attrs.json \
  --services @services.json
```

**必填参数**：`--data`、`--division-id`、`--cat-id`、`--channel-cat-id`

**可选覆盖参数**：`--price`、`--stuff`、`--desc`、`--goods-no`、`--size`、`--title`、`--attrs`、`--services`

## 约定

- **`@file.json` 语法**：参数值以 `@` 开头表示从文件读取 JSON（如 `--data @detail.json`）。Windows 下 JSON 参数必须用此方式，避免 shell 转义问题。
- **仅支持普通商品**：`itemBizType` 固定为 `"2"`，严选商品暂不支持。
- **售价**：使用 `reservePrice` 和 `originalPrice`，不使用原始 `price` 字段。
- **Token 存储**：`~/.r2-cli/config.json`，过期自动刷新。
- **缓存**：店铺和地址选择后自动缓存到同一文件。
