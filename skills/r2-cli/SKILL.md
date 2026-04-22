---
name: r2-cli
description: R2-CLI 二手潮奢交易工具。用于认证登录、基本操作。触发关键词：r2、登录、login、auth。
triggers:
  - r2
  - r2-cli
  - 登录
  - login
  - auth
role: specialist
scope: implementation
output-format: code
---

# R2-CLI Skill

R2-CLI 是二手潮奢交易命令行工具，支持商品管理（上架/下架/改价/列表）、认证登录、经营分析等。

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
- Token 存储在 `~/.r2-cli/config.json`

## 认证命令 `r2 auth`

| 命令 | 说明 |
|------|------|
| `auth login` | 扫码登录（生成二维码 → 手机扫码 → 确认） |
| `auth logout` | 退出登录 |
| `auth status` | 查看登录状态和用户信息 |

## 商品管理命令 `r2 goods`

| 命令 | 说明 |
|------|------|
| `goods shops` | 查看已授权店铺（`-p xianyu/douyin`） |
| `goods list` | 寄售商品列表（`--status wait/on/sold/down`） |
| `goods up` | 上架商品（交互式7步向导） |
| `goods down <ids...>` | 下架商品（支持批量） |
| `goods reup <ids...>` | 重新上架（支持批量） |
| `goods price <id> --price <amount>` | 修改售价 |

> 商品管理的详细用法（交互式向导、AI Agent 分步上架）见 **r2-goods** skill。

## 开发中命令

| 命令 | 说明 |
|------|------|
| `report generate` | 经营日报/周报 |
| `pricing analyze` | 价格分析建议 |
| `inventory risk` | 风险管理 |
