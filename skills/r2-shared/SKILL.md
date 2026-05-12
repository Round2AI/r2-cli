---
name: r2-shared
version: 1.1.0
description: "R2-CLI 共享基础技能。安装、版本检查、统一错误格式、命令概览。r2-auth 和 r2-goods 的前置依赖。触发词：r2-cli、安装、install、错误格式。"
metadata:
  requires:
    bins: ["r2-cli"]
  cliHelp: "r2-cli --help"
  minVersion: "1.0.12"
  related:
    - "r2-auth"
    - "r2-goods"
  supersededSkills:
    - name: "r2-cli"
      action: "已更名为 r2-shared，请删除旧 skill：rm -rf ~/.agents/skills/r2-cli"
---

# R2-Shared (v1.1)

> **Tip**: 始终使用 `--json` 获取结构化输出。所有 `--json` 命令统一错误格式 `{ success: false, error: "..." [, status: number] }`，检查 `success` 判断成败。`status` 字段在 HTTP 错误（ApiError）和参数校验失败（400）时包含。
> **Tip**: Agent 获取数据后展示给用户选择，不要让用户自己提供 ID。

二手潮奢交易命令行工具，由 Round2AI 团队维护。覆盖商品上架、认证登录等核心业务域。

## CRITICAL

**执行规则**（所有 r2-* skills 通用）：
- 所有命令**必须**通过已安装的 `r2-cli` 二进制执行（`r2-cli goods ...`、`r2-cli auth ...`）
- **禁止**读取项目源码或用 `tsx`/`node` 直接运行源文件
- 如果 `r2-cli` 命令不可用，提示用户先安装：`npm install -g @round2ai/r2-cli@latest`

**版本检查**：
- 首次使用时，Agent 应运行 `r2-cli --version` 检查当前版本
- 最低要求版本：`1.0.12`，低于此版本提示用户更新：`npm install -g @round2ai/r2-cli@latest`

**旧 Skill 清理**：
- 如果发现 `~/.agents/skills/r2-cli/`（已废弃的旧名称），提示用户删除：`rm -rf ~/.agents/skills/r2-cli`
- 当前正确的 skill 名称：`r2-shared`、`r2-auth`、`r2-goods`

本 skill 是 r2-auth 和 r2-goods 的共享基础。认证登录详情见 **r2-auth** skill，商品管理详情见 **r2-goods** skill。

## 安装

```bash
npm install -g @round2ai/r2-cli@latest
```

## 前置条件

- 先登录：`r2-cli auth login`（支持第二回合 APP / 微信 / 支付宝扫码）
- 检查状态：`r2-cli auth status`

## 认证命令（详见 r2-auth skill）

| 命令 | 说明 |
|------|------|
| `r2-cli auth login --json` | 扫码登录（Agent 推荐，一步完成） |
| `r2-cli auth xianyu --json` | 闲鱼店铺授权（Agent 推荐，一步完成） |
| `r2-cli auth status` | 查看登录状态 |
| `r2-cli auth logout` | 退出登录 |

## 商品管理命令（详见 r2-goods skill）

| 分类 | 命令 | 说明 |
|------|------|------|
| 查询 | `r2-cli goods shops [--json]` | 查看已授权店铺 |
| | `r2-cli goods stocks [--json]` | 查看仓库 |
| | `r2-cli goods list [--stock-id <id>] [--json]` | 查看选品商品 |
| | `r2-cli goods listing [--json]` | 查询上架列表 |
| 上架 | `r2-cli goods up --stock-goods-id <> --shop-id <> --price <> --json` | 普通上架（选品商品） |
| | `r2-cli goods down --id <id> [--json]` | 下架商品 |
| | `r2-cli goods price --id <id> --price <amount> [--json]` | 修改价格 |
| 修改 | `r2-cli goods edit --id <> --category-id <> --channel-cat-id <> ... --json` | 修改商品信息（定位推荐 `--id`） |
| 挂售 | `r2-cli goods hang-up categories [--json]` | 获取闲鱼类目 |
| | `r2-cli goods hang-up props --channel-cat-id <id> [--json]` | 获取属性列表 |
| | `r2-cli goods hang-up brands --channel-cat-id <> --prop-id <> --key <> [--json]` | 品牌搜索 |
| | `r2-cli goods hang-up upload-images --shop-id <> --files <> --json` | 上传图片 |
| | `r2-cli goods hang-up submit --shop-id <> --title <> ... --json` | 提交挂售上架 |

## 其他命令

| 命令 | 说明 |
|------|------|
| `r2-cli update` | 一键更新 CLI 和技能 |
| `r2-cli uninstall` | 卸载并清除配置 |

## Agent 上架路由（概要）

用户说"上架"时需要选择正确的方式：
- **用户明确指定方式或提供了图片** → 直接走对应流程
- **未指定方式** → **必须询问用户**："选品上架还是挂售上架？"
  - 选品上架 → `goods up`（店铺 → 仓库 → 选品商品 → 提交价格）
  - 挂售上架 → `goods hang-up`（上传图片 → AI 读图识别 → 类目/属性 → 提交）

> 详细决策规则和完整操作流程见 **r2-goods** skill。

## 统一错误格式

所有 `--json` 命令统一错误格式：

```json
{ "success": false, "error": "错误信息" }
```

API 错误和参数校验失败时额外包含 `status` 字段：

```json
{ "success": false, "error": "错误信息", "status": 400 }
```

常见错误：

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `请先运行 r2-cli auth login 登录` | 未登录或 Token 过期 | 执行 `r2-cli auth login --json` |
| `二维码已过期` / `授权链接已过期` | 扫码超时（5 分钟） | 重新执行命令 |
| `轮询超时` | 上架结果查询超时 | 稍后用 `r2-cli goods listing` 查看 |
