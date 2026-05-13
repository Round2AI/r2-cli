---
name: r2-goods
version: 1.1.0
description: "R2-CLI 商品管理专家。用于商品上架/下架/改价/修改信息/挂售、查看店铺/仓库/选品商品/上架列表。Agent 获取数据后展示给用户选择，完成 4 步上架流程。触发词：上架、下架、改价、修改商品、挂售、商品列表、goods、up、down、price、edit、hang-up、shops、stocks、listing、list。"
metadata:
  requires:
    bins: ["r2-cli"]
  cliHelp: "r2-cli goods --help"
  minVersion: "1.0.12"
  related:
    - "r2-shared"
    - "r2-auth"
---

# R2-Goods (v1)

> **Tip**: Agent 获取数据后展示给用户选择，不要让用户自己提供 ID。
> **Tip**: 所有 `--json` 命令统一错误格式 `{ success: false, error: "..." }`，检查 `success` 判断成败。

商品管理专家，指导 AI Agent 完成商品上架、下架、改价、挂售全流程。

## CRITICAL

命令执行规则见 **r2-shared** skill 的「执行规则」。安装、统一错误格式见 **r2-shared** skill。认证登录见 **r2-auth** skill。

## 上架路由决策

用户说"上架"时，按以下规则选择上架方式：

| 条件 | 上架方式 | 流程 |
|------|----------|------|
| 用户明确说"选品上架"，或商品**在选品库**中 | `goods up`（普通上架） | 店铺 → 仓库 → 选品商品 → 输入价格 → 提交 |
| 用户明确说"挂售"，或用户**提供了图片** | `goods hang-up`（挂售上架） | 上传图片 → AI 读图识别 → 类目/属性 → 提交 |

**判断方法**：
1. 用户**明确指定**了上架方式 → 直接走对应流程
2. 用户提供了图片文件 → 直接走 `goods hang-up`，Agent 用 Read 工具查看图片自动识别商品信息
3. 用户只说"上架"未指定方式 → **必须询问用户**："选品上架还是挂售上架？"

## 命令概览

### 查询

| 命令 | 说明 | 详细文档 |
|------|------|----------|
| `r2-cli goods shops [--json]` | 查看已授权店铺 | [r2-goods-query](references/r2-goods-query.md) |
| `r2-cli goods stocks [--json]` | 查看仓库 | [r2-goods-query](references/r2-goods-query.md) |
| `r2-cli goods list [--stock-id <id>] [--json]` | 查看选品商品 | [r2-goods-query](references/r2-goods-query.md) |
| `r2-cli goods listing [--status <up/down/sold>] [--json]` | 查询上架列表 | [r2-goods-query](references/r2-goods-query.md) |

### 上架/下架/改价/修改

| 命令 | 说明 | 详细文档 |
|------|------|----------|
| `r2-cli goods up --stock-goods-id <> --shop-id <> --price <> --json` | 普通上架（选品商品） | [r2-goods-listing](references/r2-goods-listing.md) |
| `r2-cli goods down --id <id> [--json]` | 下架商品 | [r2-goods-listing](references/r2-goods-listing.md) |
| `r2-cli goods price --id <id> --price <amount> [--json]` | 修改价格 | [r2-goods-listing](references/r2-goods-listing.md) |
| `r2-cli goods edit --id <id> [--title ...] --json` | 修改商品信息 | [r2-goods-listing](references/r2-goods-listing.md) |

### 选品上架 4 步流程

1. `r2-cli goods shops --json` → 展示店铺 → 用户选择 `shopId`
2. `r2-cli goods stocks --json` → 展示仓库 → 用户选择 `stockId`
3. `r2-cli goods list --stock-id <id> --json` → 展示商品 → 用户选择 `stockGoodsId`
4. `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` → 提交

必填参数：`--stock-goods-id`、`--shop-id`（取 `shopId` 不是 `id`）、`--price`

### 修改商品信息（edit）

修改已上架商品的标题、描述、品牌、类目、图片、属性等。

**路由决策**：

| 用户意图 | 流程 |
|----------|------|
| 提供了图片文件 | 全自动：读图识别 → 上传图片 → 匹配类目/属性/品牌 → 展示变更 → 用户确认 → 提交 |
| 指定了具体字段（如"改标题为X"） | 直接修改指定字段，不动图片 |
| 说"修改/更新商品信息"但没给细节 | 提示：可以提供图片自动识别商品信息，也可以指定要修改的具体字段 |

**定位商品**：优先使用 `--id <goodsListingId>`（从上架列表获取 `id` 字段），也可用 `--stock-goods-id <id> --account <shopId>`。

**关键约束**：
- `--category-id` 和 `--channel-cat-id` 是**必填的**（后端复用挂售 DTO），即使不改类目也要传当前类目
- Agent 应自动查询类目并匹配，不需要用户手动提供
- AI 读图识别后填充的字段需展示给用户确认，不能静默覆盖已有信息
- `--image-ids` 接受已上传的图片 ID，用户给图片文件时需先调 `hang-up upload-images` 上传

**带图片的全自动流程**（Agent 自动完成，用户只需提供图片并确认）：

1. **展示列表**：`goods listing --json` → 用户选择要修改的商品
2. **上传图片**：`hang-up upload-images --shop-id <shopId> --files <paths> --json`
3. **AI 读图识别**：Agent 用 Read 工具查看图片，识别品牌/类目/成色/描述等
4. **自动匹配类目**：`hang-up categories --json` → 根据识别结果匹配 catId + channelCatId
5. **自动查询属性**：`hang-up props --channel-cat-id <id> --json` → 根据识别结果匹配成色/尺码/季节等
6. **自动搜索品牌**：`hang-up brands --channel-cat-id <> --prop-id <> --key <品牌名> --json` → 获取品牌 valueId
7. **汇总展示**：当前值 vs 变更值，让用户确认
8. **提交**：`goods edit --id <goodsListingId> --category-id <> --channel-cat-id <> --image-ids <> --item-attrs <> --brand-name <> --json`

**核心原则**：用户只需提供图片 + 确认。类目匹配、属性填充、品牌搜索全部由 Agent 自动完成。

### 挂售（hang-up）

| 命令 | 说明 | 详细文档 |
|------|------|----------|
| `r2-cli goods hang-up categories [--json]` | 获取闲鱼类目 | [r2-goods-hangup](references/r2-goods-hangup.md) |
| `r2-cli goods hang-up props --channel-cat-id <id> [--json]` | 获取属性列表 | [r2-goods-hangup](references/r2-goods-hangup.md) |
| `r2-cli goods hang-up brands --channel-cat-id <> --prop-id <> --key <> [--json]` | 品牌搜索 | [r2-goods-hangup](references/r2-goods-hangup.md) |
| `r2-cli goods hang-up upload-images --shop-id <> --files <> --json` | 上传图片 | [r2-goods-hangup](references/r2-goods-hangup.md) |
| `r2-cli goods hang-up submit --shop-id <> --title <> ... --json` | 提交挂售上架 | [r2-goods-hangup](references/r2-goods-hangup.md) |

### 挂售上架流程

1. **上传图片**：`hang-up upload-images --shop-id <> --files <paths> --json`
2. **识别商品**：Agent 用 Read 工具查看图片，自动识别品牌/成色/类目/描述。不支持读图的 Agent 走询问路径
3. **匹配类目**：`hang-up categories --json` → 自动匹配
4. **匹配属性**：`hang-up props --channel-cat-id <id> --json` → 自动填充。品牌需调 `hang-up brands` 搜索
5. **汇总展示**：自动填充的字段标 ✅，缺失字段标 ❓ 让用户补充。**运费默认包邮（`--transport-fee` 默认 0），需告知用户可修改**
6. **提交**：`hang-up submit` — 必填：`shop-id`、`title`、`price`、`category-id`、`channel-cat-id`、`image-ids`、`stuff-status`、`desc`、`out-item-no`

**核心原则**：**图片里能看到的，就别问用户**。只问价格和商家编码（优先用户自定义，不填则推荐自动生成），其他全部从图片自动提取。

**关键注意事项**：
- **品牌必须双传**：`--brand-name` + itemAttrs 中的一项（含 propId/valueId/valueName），缺一不可
- **描述自动生成**：品牌+款式+颜色+材质+货号自动组合，不要标记为"需要补充"
- **季节自动推断**：夹克→春秋季，羽绒服→秋冬季，T恤→夏季等，不需要问用户
- **尺码/货号从标签读取**：图片中有标签时自动提取，读不到才问用户
- **标题自动组合**：品牌+款式+颜色+尺码+成色

> Agent 执行具体操作时，用 Read 工具读取对应的 reference 文件获取完整参数和流程说明。

## 错误处理

所有 `--json` 命令统一错误格式：`{ "success": false, "error": "错误信息" }`

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `请先运行 r2-cli auth login 登录` | 未登录或 Token 过期 | 执行 `r2-cli auth login --json` |
| `Agent 模式需要 --stock-goods-id, --shop-id, --price` | `goods up --json` 缺少必填参数 | 补齐三个参数 |
| `请指定下架条件：--id 或 --stock-goods-id + --shop-id` | 下架缺少定位参数 | 补充参数 |
| `--price <amount> 为必填参数` | 改价未提供价格 | 询问用户新价格 |
| `请提供至少一张图片` | 挂售缺少图片 | 提供本地图片路径 |
| `商品不存在` | edit 用了无效的 `--id` 或商品已被删除 | 确认 listing 列表中的 id 值 |
| `getCategoryId() is null` | edit 缺少 `--category-id` | 必须传 `--category-id` 和 `--channel-cat-id` |
| `商家编码重复` | out-item-no 同店铺已存在 | 更换唯一编码 |
| `ITEM_CONDITION_NOT_SUPPORT_SIGN` | 售后服务未开通或品类不支持 | 默认关闭售后 |
| `轮询超时` | 上架结果查询超时 | 稍后用 `goods listing` 查看 |
