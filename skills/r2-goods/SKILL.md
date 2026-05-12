---
name: r2-goods
version: 1.0.0
description: "R2-CLI 商品管理专家。用于商品上架/下架/改价/挂售、查看店铺/仓库/选品商品/上架列表。Agent 获取数据后展示给用户选择，完成 4 步上架流程。触发词：上架、下架、改价、挂售、商品列表、goods、up、down、price、hang-up、shops、stocks、listing、list。"
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
| `r2-cli goods listing [--json]` | 查询上架列表 | [r2-goods-query](references/r2-goods-query.md) |

### 上架/下架/改价

| 命令 | 说明 | 详细文档 |
|------|------|----------|
| `r2-cli goods up --stock-goods-id <> --shop-id <> --price <> --json` | 普通上架（选品商品） | [r2-goods-listing](references/r2-goods-listing.md) |
| `r2-cli goods down --id <id> [--json]` | 下架商品 | [r2-goods-listing](references/r2-goods-listing.md) |
| `r2-cli goods price --id <id> --price <amount> [--json]` | 修改价格 | [r2-goods-listing](references/r2-goods-listing.md) |

### 挂售（hang-up）

| 命令 | 说明 | 详细文档 |
|------|------|----------|
| `r2-cli goods hang-up categories [--json]` | 获取闲鱼类目 | [r2-goods-hangup](references/r2-goods-hangup.md) |
| `r2-cli goods hang-up props --channel-cat-id <id> [--json]` | 获取属性列表 | [r2-goods-hangup](references/r2-goods-hangup.md) |
| `r2-cli goods hang-up brands --channel-cat-id <> --prop-id <> --key <> [--json]` | 品牌搜索 | [r2-goods-hangup](references/r2-goods-hangup.md) |
| `r2-cli goods hang-up upload-images --shop-id <> --files <> --json` | 上传图片 | [r2-goods-hangup](references/r2-goods-hangup.md) |
| `r2-cli goods hang-up submit --shop-id <> --title <> ... --json` | 提交挂售上架 | [r2-goods-hangup](references/r2-goods-hangup.md) |

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
| `商家编码重复` | out-item-no 同店铺已存在 | 更换唯一编码 |
| `ITEM_CONDITION_NOT_SUPPORT_SIGN` | 售后服务未开通或品类不支持 | 默认关闭售后 |
| `轮询超时` | 上架结果查询超时 | 稍后用 `goods listing` 查看 |
