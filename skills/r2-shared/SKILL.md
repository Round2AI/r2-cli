---
name: r2-shared
version: 1.0.0
description: "R2-CLI 共享基础技能。安装、统一错误格式、命令概览。r2-auth 和 r2-goods 的前置依赖。触发词：r2-cli、安装、install、错误格式。"
metadata:
  requires:
    bins: ["r2-cli"]
  cliHelp: "r2-cli --help"
  related:
    - "r2-auth"
    - "r2-goods"
---

# R2-Shared (v1)

> **Tip**: 始终使用 `--json` 获取结构化输出。所有 `--json` 命令统一错误格式 `{ success: false, error: "..." }`，检查 `success` 判断成败。
> **Tip**: Agent 获取数据后展示给用户选择，不要让用户自己提供 ID。

二手潮奢交易命令行工具，由 Round2AI 团队维护。覆盖商品上架、认证登录等核心业务域。

## CRITICAL

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
| 挂售 | `r2-cli goods hang-up categories [--json]` | 获取闲鱼类目 |
| | `r2-cli goods hang-up props --channel-cat-id <id> [--json]` | 获取属性列表 |
| | `r2-cli goods hang-up brands --channel-cat-id <> --prop-id <> --key <> [--json]` | 品牌搜索 |
| | `r2-cli goods hang-up upload-images --shop-id <> --files <> --json` | 上传图片 |
| | `r2-cli goods hang-up submit --shop-id <> --title <> ... --json` | 提交挂售上架 |

## Agent 上架路由（概要）

用户说"上架商品"时需要选择正确的方式：
- **商品在选品库** → `goods up`（店铺 → 仓库 → 选品商品 → 提交价格）
- **用户提供了图片** → `goods hang-up`（上传图片 → AI 读图识别 → 类目/属性 → 提交）
- **不确定** → 问用户

> 详细决策规则见 **r2-goods** skill「上架路由决策」章节。

## Agent 上架 4 步流程（概要）

1. `r2-cli goods shops --json` → 展示店铺 → 用户选择
2. `r2-cli goods stocks --json` → 展示仓库 → 用户选择
3. `r2-cli goods list --stock-id <id> --json` → 展示商品 → 用户选择
4. `r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json` → 提交上架

> 完整参数说明、挂售流程、错误处理见 **r2-goods** skill。

## 统一错误格式

所有 `--json` 命令统一错误格式：

```json
{ "success": false, "error": "错误信息" }
```

常见错误：

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `请先运行 r2-cli auth login 登录` | 未登录或 Token 过期 | 执行 `r2-cli auth login --json` |
| `二维码已过期` / `授权链接已过期` | 扫码超时（5 分钟） | 重新执行命令 |
| `轮询超时` | 上架结果查询超时 | 稍后用 `r2-cli goods listing` 查看 |
