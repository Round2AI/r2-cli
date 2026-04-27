---
name: r2-cli
description: R2-CLI 二手潮奢交易工具。用于认证登录、基本操作（r2、登录、login、auth、商品、goods）。安装后 AI Agent 可直接调用全部交易能力。
---

# R2-CLI Skill

R2-CLI 是二手潮奢交易命令行工具，支持商品管理（上架/下架/改价/列表）、认证登录、经营分析等。

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

## 前置条件

- 必须先登录：`r2-cli auth login`（扫码登录）
- 检查登录状态：`r2-cli auth status`
- Token 过期会自动刷新，刷新失败才需要重新登录
- Token 存储在 `~/.r2-cli/config.json`

## 认证命令 `r2-cli auth`

| 命令 | 说明 |
|------|------|
| `r2-cli auth login` | 扫码登录（生成二维码 → 手机扫码 → 确认） |
| `r2-cli auth logout` | 退出登录 |
| `r2-cli auth status` | 查看登录状态和用户信息 |

## 商品管理命令 `r2-cli goods`

| 命令 | 说明 |
|------|------|
| `r2-cli goods shops` | 查看已授权店铺（`-p xianyu/douyin`） |
| `r2-cli goods list` | 寄售商品列表（`--status wait/on/sold/down`） |
| `r2-cli goods up` | 上架商品（交互式7步向导） |
| `r2-cli goods down <ids...>` | 下架商品（支持批量） |
| `r2-cli goods reup <ids...>` | 重新上架（支持批量） |
| `r2-cli goods price <id> --price <amount>` | 修改售价 |

> 商品管理的详细用法（交互式向导、AI Agent 分步上架）见 **r2-goods** skill。
> 认证登录的 Agent 两步式流程见 **r2-auth** skill。

## 开发中命令

| 命令 | 说明 |
|------|------|
| `r2-cli report generate` | 经营日报/周报 |
| `r2-cli pricing analyze` | 价格分析建议 |
| `r2-cli inventory risk` | 风险管理 |
