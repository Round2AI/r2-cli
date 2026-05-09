# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 构建与开发命令

```bash
# 开发模式（tsx 直接运行，继承 TTY 支持交互式 prompt）
npm run dev
npm run dev -- goods up

# 构建（esbuild，输出到 dist/r2-cli.js）
npm run build          # 开发环境：读取 .env
npm run build:prod     # 生产环境：读取 .env.production，minified

# 运行构建产物
node dist/r2-cli.js --help
```

未配置测试框架。

## 架构概览

R2-CLI 是面向二手潮奢交易场景的 CLI 工具，将业务能力以 CLI 命令和 AI Agent Skill 两种形式开放。

**双模架构**：交互式命令（人类友好）+ `--json` 参数（Agent 友好），同一命令两种输出格式。

### 入口流程
1. `src/entrypoints/r2-cli.tsx` — CLI 入口，初始化 Commander、版本号读取（双路径 fallback）、异步更新检查、SIGINT/SIGTERM 优雅退出
2. `src/commands/setup.ts` — 注册所有域命令（auth、goods、uninstall）
3. `src/commands/goods/` — 商品管理命令组（shops / stocks / list / listing / up / down / price）
4. `src/commands/uninstall.ts` — 一键卸载：删除 `~/.r2-cli/` + `npm uninstall -g @round2ai/r2-cli`
5. 未实现的命令统一调用 `notImplemented(name)`（从 `shared.ts` 导入），禁止输出虚假功能信息。Stub 命令显示在 `--help` 中（不隐藏）

### 服务层

**API 客户端** (`src/services/api/`)：
- `client.ts` — 基于 `fetch` 的 HTTP 客户端，处理响应信封 `{ success, status, data, msg }`。**默认启用认证**（自动从 storage 读取 token 注入 header，内存缓存 + 5 分钟过期安全边际），401 时清除凭证。只有 `qrcode-auth.ts` 传 `{ auth: false }` 禁用认证。所有请求均发送 `Content-Type: application/json`。超时使用 AbortController，AbortError 转换为友好提示。Base URL 来自 `process.env.SERVER_BASEURL`（构建时由 esbuild define 注入）。
- `modules/xianyu.ts` — 业务 API，导出函数：`getUserShopList` / `getUserStockList` / `getSelectGoodsList` / `listingUpXianyu` / `getListingInfo` / `listingDownXianyu` / `listingUpdatePrice` / `getListingList`。内部共享一个 `ApiClientService` 实例。
- `modules/xianyu-auth.ts` — 闲鱼店铺授权 API，导出 `getAuthUrl()` 和 `getAuthStatus(state)`。
- `modules/qrcode-auth.ts` — 二维码登录 API（**唯一**传 `{ auth: false }` 的模块），导出 `generateQRCode()` 和 `getQRCodeStatus()`。

**本地存储** (`src/services/storage/`)：
- `config-store.ts` — `ConfigStore`（单例），`~/.r2-cli/config.json`，原子写入（tmp + rename）。带内存缓存（`configLoaded` 标志）。
- `auth-storage.ts` — `AuthStorage`（单例），凭证存储。导出 `TOKEN_EXPIRY_MARGIN_MS`（5 分钟安全边际）。
- `business-storage.ts` — `BusinessStorage`（单例），业务缓存。

**共享工具** (`src/utils/`)：
- `qrcode.ts` — `renderQRCode(content, filename)` — 共享二维码渲染（PNG Buffer + Unicode 半块字符 + `qrUrl` 本地 HTTP 链接）。`getQrServer()` 启动临时 HTTP 服务，通过 SSE 推送 `QrPageStatus`。QR 页面品牌色 `#06d290`。
- `render.tsx` — `renderOnce()` + `renderComponent()`。React 组件展示 + chalk 简单提示。
- `polling.ts` — `poll()` 通用轮询工具，支持 AbortSignal 和超时。

**认证服务** (`src/services/auth/`)：
- `login.ts` — `LoginService`（QR 生成 + 轮询 + 人类登录 + 状态/登出）。`pollPageStatus` 用于 Agent qr 子命令（不保存凭证）。
- `xianyu-auth.ts` — 闲鱼店铺授权（`generateAuthQR` / `waitForAuth` / `authorize` / `pollAuthPageStatus`）。

### 上架流程（4 步）

Agent 上架流程：获取数据 → 展示给用户 → 用户选择 → 提交上架 + 自动轮询结果。

数据来源 API：
- `mms/user/shop/list` → `getUserShopList()` — 获取用户店铺。`UserShop.shopId` 是第三方店铺 ID（上架参数 `--shop-id`），`UserShop.id` 是数据库自增 ID（不要用）。
- `mms/user/stock/list` → `getUserStockList()` — 获取用户仓库。`UserStock.stockId` 用于过滤选品商品。
- `mms/seller/goods/select/list` → `getSelectGoodsList({ stockId?, stockGoodsId? })` — 获取选品商品。`stockId` 和 `stockGoodsId` 均为可选过滤条件。`SelectGoodsItem.stockGoodsId` 是上架参数 `--stock-goods-id`。
- `POST mms/goods/listing/up/xianyu` → `listingUpXianyu()` — 提交上架
- `GET mms/goods/listing/get` → `getListingInfo()` — 查询上架进度
- `POST mms/goods/listing/down/xianyu` → `listingDownXianyu()` — 下架商品
- `POST mms/goods/listing/update/xyPrice` → `listingUpdatePrice()` — 修改上架价格
- `GET mms/goods/listing/list` → `getListingList()` — 查询上架列表

`goods up` 命令提交后自动轮询 `getListingInfo`（每 2 秒，最多 10 秒），返回 `{ submit, listing }` 包含提交和最终状态。`init` 状态视为"处理中"继续轮询。

**人类模式**：`r2-cli goods up` — 交互式选择店铺 → 仓库 → 商品 → 输入价格 → 确认 → 自动轮询结果
**Agent 模式**：`r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json`

### 认证流程

**扫码登录** (`auth login`)：
- **人类模式**：`r2-cli auth login` — 同时显示 unicode 二维码和浏览器链接，SSE 实时更新状态
- **Agent 模式**：`r2-cli auth login qr` → `r2-cli auth login poll --token <> --expire <> --interval <>`。qr 子命令后台启动 `pollPageStatus`，成功后 3 秒关闭服务器

**闲鱼店铺授权** (`auth xianyu`)：
- **人类模式**：`r2-cli auth xianyu`
- **Agent 模式**：`r2-cli auth xianyu qr` → `r2-cli auth xianyu poll --state <> --expire <> --interval <>`

**重要**：当用户在 Claude Code 会话中请求登录时，必须按 `skills/r2-auth/SKILL.md` 的两步式流程执行。

### 错误处理
- `src/errors/index.ts` — `R2Error` → `ApiError`/`AuthError`/`StorageError`/`PollingError`/`CliError`
- `src/commands/shared.ts`：
  - `handleCommandError()` — 交互式命令错误分发
  - `agentAction(fn)` — Agent 子命令包装器，用于 auth 命令。自动 catch 并格式化为 JSON 错误。**注意**：被包装的函数需要自己 `console.log` 输出结果，`agentAction` 不处理返回值。
  - goods 命令（list/listing/down/price）使用 inline try/catch 而非 `agentAction`，以便做参数验证和自定义错误提示
  - `agentError(msg)` — 直接输出 `{ success: false, error }` + `process.exit(1)`
  - `notImplemented(name)` — 未实现命令提示
  - `sanitizeShops(shops)` — 过滤 `SENSITIVE_KEYS`（accessToken/refreshExpireIn）

### 构建系统
- `scripts/build.js` — esbuild。通过 dotenv 读取 `.env` / `.env.production`。`process.env.SERVER_BASEURL` 构建时通过 esbuild `define` 注入。所有运行时依赖 externalize。`cleanDist()` 有 Windows EBUSY fallback。
- `scripts/dev.js` — 用 `stdio: 'inherit'` 启动 `tsx`，保证交互式 prompt 可用
- 版本号读取：优先 `../package.json`（npm 安装后），其次 `../../package.json`（开发模式），最后 fallback `dist/package.json`

### 关键类型
- `src/types/auth.ts` — `UserInfo`、`QRCodeStatus`、`GenerateQRCodeData`、`QRCodeStatusData`、`XianyuAuthUrlData`（字段名是 `state` 不是 `stats`）、`XianyuAuthStatusData`
- `src/types/xianyu.ts` — `XyShop`、`ListingUpParams`（stockGoodsId/shopId/price/platform）、`ListingGetParams`、`ListingInfo`、`UserShop`（注意 `shopId` 是第三方 ID，`id` 是数据库 ID）、`UserStock`、`SelectGoodsItem`/`SelectGoodsListParams`/`SelectGoodsListResult`

### Skill 体系

`skills/` 目录下的 Skill 随 npm 包发布：
- `skills/r2-auth/SKILL.md` — 两步式扫码登录
- `skills/r2-cli/SKILL.md` — 核心概览
- `skills/r2-goods/SKILL.md` — 商品管理全流程（4 步上架：获取数据 → 展示给用户选择 → 提交上架）

安装时 `postinstall` 脚本（`scripts/install-skills.js`）自动将技能复制到 `~/.agents/skills/` 并在 `~/.claude/skills/` 创建符号链接。

### 环境配置
- `.env` — `SERVER_BASEURL='https://api.qiuxietang.com'`（开发）
- `.env.production` — `SERVER_BASEURL='https://api.puresnake.com'`（生产）
- `ALIBABA_API_KEY` — AI 服务密钥（仅环境变量，不可硬编码）

### tsconfig
- `module: "nodenext"`、`strict: true`、`jsx: "react-jsx"`、`verbatimModuleSyntax: true`、`exactOptionalPropertyTypes: true`
- 所有 import 必须使用 `.js` 扩展名以支持 ESM 解析
- `exactOptionalPropertyTypes` 要求可选参数类型显式包含 `| undefined`（如 `id?: string | undefined`）
