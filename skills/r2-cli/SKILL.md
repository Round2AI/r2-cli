---
name: r2-cli
description: R2-CLI 二手潮奢交易工具。用于认证登录、基本操作（登录、login、auth、商品、goods）。安装后 AI Agent 可直接调用全部交易能力。
---

# R2-CLI Skill

R2-CLI 是二手潮奢交易命令行工具，支持商品管理（上架/下架/改价/列表）、认证登录等。

## 安装

```bash
npm install -g @round2ai/r2-cli@latest
```

## 命令前缀自动检测

首次使用时检测一次，后续所有命令使用检测到的前缀：

1. 项目目录有 `package.json`（name 含 r2-cli）→ `npm run dev --`
2. 存在 `dist/r2-cli.js` → `node dist/r2-cli.js`
3. `r2-cli --version` 成功 → `r2-cli`

以下文档使用 `r2-cli` 作为前缀，根据检测结果替换。

> **注意**：部分平台 npm 会拦截 `--help`/`-h` 等 flag，若 `npm run dev -- --help` 显示的是 npm 帮助，改用 `npx tsx src/entrypoints/r2-cli.tsx --help`。

## 前置条件

- 必须先登录：`r2-cli auth login`（扫码登录）
- 检查登录状态：`r2-cli auth status`
- Token 过期后需重新登录（内存缓存带过期检查，不会无限使用过期 token）
- Token 存储在 `~/.r2-cli/config.json`（原子写入，防止中断导致丢失）

## 错误格式

Agent 子命令（`goods up info/submit/categories/props/address`）统一错误格式：

```json
{ "success": false, "error": "错误信息" }
```

Agent 应检查 `success` 字段判断成败。验证错误（如参数缺失、查找失败）也使用相同格式。

## 进程信号

- SIGINT（Ctrl+C）和 SIGTERM 均触发优雅退出，输出"操作已取消"并 exit(130)

## 认证命令 `r2-cli auth`

| 命令 | 说明 |
|------|------|
| `r2-cli auth login` | 扫码登录（生成二维码 → 手机扫码 → 确认） |
| `r2-cli auth xianyu` | 闲鱼店铺授权（扫码或复制链接授权） |
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
