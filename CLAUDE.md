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
3. `src/commands/goods/` — 商品管理命令组（shops / stocks / list / listing / up / down / price / hang-up）
4. `src/commands/uninstall.ts` — 一键卸载：删除 `~/.r2-cli/` + `npm uninstall -g @round2ai/r2-cli`
5. 所有命令均已实现，无 stub 命令

### 服务层

**API 客户端** (`src/services/api/`)：
- `client.ts` — 基于 `fetch` 的 HTTP 客户端，处理响应信封 `{ success, status, data, msg }`。**默认启用认证**（自动从 storage 读取 token 注入 header，内存缓存 + 5 分钟过期安全边际），401 时清除凭证。只有 `qrcode-auth.ts` 传 `{ auth: false }` 禁用认证。所有请求均发送 `Content-Type: application/json`。超时使用 AbortController，AbortError 转换为友好提示。Base URL 来自 `process.env.SERVER_BASEURL`（构建时由 esbuild define 注入）。
- `modules/goods.ts` — 业务 API（原 xianyu.ts 已重命名），导出函数：`getUserShopList` / `getUserStockList` / `getSelectGoodsList` / `listingUpXianyu` / `getListingInfo` / `listingDownXianyu` / `listingUpdatePrice` / `getListingList`。内部共享一个 `ApiClientService` 实例。
- `modules/xianyu-hangup.ts` — 挂售 API，导出类目/属性/品牌/图片上传/提交等函数。
- `modules/xianyu-auth.ts` — 闲鱼店铺授权 API，导出 `getAuthUrl()` 和 `getAuthStatus(state)`。
- `modules/qrcode-auth.ts` — 二维码登录 API（**唯一**传 `{ auth: false }` 的模块），导出 `generateQRCode()` 和 `getQRCodeStatus()`。

**本地存储** (`src/services/storage/`)：
- `config-store.ts` — `ConfigStore`（单例），`~/.r2-cli/config.json`，原子写入（tmp + rename）。带内存缓存（`configLoaded` 标志）。
- `auth-storage.ts` — `AuthStorage`（单例），凭证存储。导出 `TOKEN_EXPIRY_MARGIN_MS`（5 分钟安全边际）。

**共享工具** (`src/utils/`)：
- `render.tsx` — `renderOnce()` + `renderComponent()`。React 组件展示 + chalk 简单提示。
- `polling.ts` — `poll()` 通用轮询工具，支持 AbortSignal 和超时。`callWithTimeout()` 单次请求超时保护。

**QR 服务** (`src/qr-server/`)：
- `render.ts` — `renderLoginQR()` / `renderXianyuAuthQR()` 生成 QR 页面（PNG Buffer），内部共享 `renderQRPage()` 函数。`openUrl()` 自动打开浏览器。
- `server.ts` — `QrServer`（单例），本地 HTTP 服务，通过 SSE 推送 `QrPageStatus`。带 idle timeout（10 秒无 SSE 客户端自动关闭）和 stdin 轮询（3 秒间隔，检测父进程断开，Windows 安全清理）。QR 页面品牌色 `#06d290`。
- `pages/` — 静态 HTML 页面（login.html / xianyu-auth.html），品牌化扫码页面。

**认证服务** (`src/services/auth/`)：
- `login.ts` — `LoginService`（QR 生成 + 轮询 + 人类登录 + 状态/登出）。
- `xianyu-auth.ts` — 闲鱼店铺授权（`generateAuthQR` / `waitForAuth` / `authorize`）。

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

### 挂售流程（hang-up）

挂售模式支持完整商品信息（图片、类目、属性、品牌），与普通上架（`goods up`）是不同流程。

**上架路由决策**：用户说"上架"未指定方式时，Agent **必须询问**"选品上架还是挂售上架？"。

挂售命令实现在 `src/commands/goods/hang-up.ts`，API 在 `src/services/api/modules/xianyu-hangup.ts`。

挂售 API 端点：
- `GET platform/xy/categories` → `getHangUpCategories()` — 获取类目
- `GET platform/xy/props` → `getHangUpProps()` — 获取属性（非品牌属性含 `propsValues`）
- `GET platform/xy/props/value` → `getHangUpBrands()` — **仅**用于品牌搜索
- `POST platform/xy/upload/images` → `uploadImages()` — 上传图片
- `POST platform/xy/submit` → `submitHangUp()` — 提交挂售

**售后默认值**：`apiAfterSalesDo` 所有字段默认 `false`（卖家未开通的服务传 `true` 会导致 `ITEM_CONDITION_NOT_SUPPORT_SIGN` 错误）。

### 认证流程

**扫码登录** (`auth login`)：
- **人类模式**：`r2-cli auth login` — 自动打开浏览器展示扫码页面，SSE 实时更新状态
- **Agent 模式**：`r2-cli auth login --json` — 自动打开浏览器 + JSON 输出（QR 信息 + 自动轮询登录结果）。备选：`auth login poll --token <>` 手动轮询

**闲鱼店铺授权** (`auth xianyu`)：
- **人类模式**：`r2-cli auth xianyu` — 自动打开浏览器展示授权页面
- **Agent 模式**：`r2-cli auth xianyu --json` — 自动打开浏览器 + JSON 输出（QR 信息 + 自动轮询授权结果）。备选：`auth xianyu poll --state <>` 手动轮询

**重要**：当用户在 Claude Code 会话中请求登录时，使用 `auth login --json` 一步完成（自动打开浏览器 + 自动轮询结果）。

### 错误处理
- `src/errors/index.ts` — `R2Error` → `ApiError`/`AuthError`/`StorageError`/`PollingError`/`CliError`
- `src/commands/shared.ts`：
  - `handleCommandError()` — 交互式命令错误分发
  - `agentAction(fn)` — Agent 子命令包装器，用于 auth poll 子命令。自动 catch 并格式化为 JSON 错误。**注意**：被包装的函数需要自己 `console.log` 输出结果，`agentAction` 不处理返回值。
  - auth 命令（login/xianyu）使用 `--json` option + inline try/catch（非 `agentAction`），在 action 内根据 `options.json` 分支输出
  - goods 命令（shops/stocks/list/listing/down/price/up）统一使用 inline try/catch + `if (options.json)` 在 catch 中输出 JSON 错误。`up` 命令额外在交互模式前验证 agent 参数完整性
  - `agentError(msg)` — 直接输出 `{ success: false, error }` + `process.exit(1)`
  - `notImplemented(name)` — 未实现命令提示
  - `sanitizeShops(shops)` — 过滤 `SENSITIVE_KEYS`（accessToken/refreshExpireIn）

### 构建系统
- `scripts/build.js` — esbuild。通过 dotenv 读取 `.env` / `.env.production`。`process.env.SERVER_BASEURL` 构建时通过 esbuild `define` 注入。所有运行时依赖 externalize。`cleanDist()` 有 Windows EBUSY fallback。
- `scripts/dev.js` — 用 `stdio: 'inherit'` 启动 `tsx`，保证交互式 prompt 可用
- 版本号读取：优先 `../package.json`（npm 安装后），其次 `../../package.json`（开发模式），最后 fallback `dist/package.json`

### 关键类型
- `src/types/auth.ts` — `UserInfo`、`QRCodeStatus`、`GenerateQRCodeData`、`QRCodeStatusData`、`XianyuAuthUrlData`（字段名是 `state` 不是 `stats`）、`XianyuAuthStatusData`
- `src/types/goods.ts`（原 xianyu.ts 已重命名） — `XyShop`、`ListingUpParams`（stockGoodsId/shopId/price/platform）、`ListingGetParams`、`ListingInfo`、`UserShop`（注意 `shopId` 是第三方 ID，`id` 是数据库 ID）、`UserStock`、`SelectGoodsItem`/`SelectGoodsListParams`/`SelectGoodsListResult`、`HangUpParams`（挂售提交参数）、`AfterSales`（售后配置）、`XyItemAttr`（属性键值对）

### Skill 体系

`skills/` 目录下的 Skill 随 npm 包发布：
- `skills/r2-shared/SKILL.md` — 共享基础（执行规则、安装、错误格式、命令概览、路由决策概要）
- `skills/r2-auth/SKILL.md` — 一步式扫码登录（`--json` + 自动打开浏览器 + 自动轮询）
- `skills/r2-goods/SKILL.md` — 商品管理概览（路由决策 + 命令表格 + references 链接）
- `skills/r2-goods/references/` — 详细操作指南（r2-goods-query / r2-goods-listing / r2-goods-hangup）

安装时 `postinstall` 脚本（`scripts/install-skills.js`）自动将技能复制到 `~/.agents/skills/`，支持 `references/` 子目录递归复制和清理。

### 环境配置
- `.env` — `SERVER_BASEURL='https://api.qiuxietang.com'`（开发）
- `.env.production` — `SERVER_BASEURL='https://api.puresnake.com'`（生产）
- `ALIBABA_API_KEY` — AI 服务密钥（仅环境变量，不可硬编码）

### tsconfig
- `module: "nodenext"`、`strict: true`、`jsx: "react-jsx"`、`verbatimModuleSyntax: true`、`exactOptionalPropertyTypes: true`
- 所有 import 必须使用 `.js` 扩展名以支持 ESM 解析
- `exactOptionalPropertyTypes` 要求可选参数类型显式包含 `| undefined`（如 `id?: string | undefined`）
