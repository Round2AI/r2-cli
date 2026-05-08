# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 构建与开发命令

```bash
# 开发模式（tsx 直接运行，继承 TTY 支持交互式 prompt）
npm run dev
npm run dev -- goods list

# 构建（esbuild，输出到 dist/r2-cli.js）
npm run build          # 开发环境：读取 .env
npm run build:prod     # 生产环境：读取 .env.production，minified

# 运行构建产物
node dist/r2-cli.js --help
```

未配置测试框架。

## 架构概览

R2-CLI 是面向二手潮奢交易场景的 CLI 工具，将业务能力以 CLI 命令和 AI Agent Skill 两种形式开放。

**双模架构**：每个交互式流程都有一组对应的 JSON 输出子命令供 AI Agent 调用。例如 `goods up`（7 步交互向导）对应 `goods up info`/`categories`/`props`/`submit`（JSON 原子操作）。

### 入口流程
1. `src/entrypoints/r2-cli.tsx` — CLI 入口，初始化 Commander、版本号读取（双路径 fallback）、异步更新检查、SIGINT/SIGTERM 优雅退出
2. `src/commands/setup.ts` — 注册所有域命令（auth、goods、shops、stocks、uninstall）
3. `src/commands/*/` 各目录下的命令工厂函数返回 `Command` 实例
4. `src/commands/shops.ts` — 跨平台店铺汇总（`r2-cli shops`）
5. `src/commands/stocks.ts` — 仓库列表（`r2-cli stocks`）
6. `src/commands/uninstall.ts` — 一键卸载：删除 `~/.r2-cli/` + `npm uninstall -g @round2ai/r2-cli`
5. 未实现的命令统一调用 `notImplemented(name)`（从 `shared.ts` 导入），禁止输出虚假功能信息。Stub 命令显示在 `--help` 中（不隐藏）

### 服务层

**API 客户端** (`src/services/api/`)：
- `client.ts` — 基于 `fetch` 的 HTTP 客户端，处理响应信封 `{ success, status, data, msg }`。**默认启用认证**（自动从 storage 读取 token 注入 header，内存缓存 + 5 分钟过期安全边际），401 时清除凭证。只有 `qrcode-auth.ts` 传 `{ auth: false }` 禁用认证。所有请求均发送 `Content-Type: application/json`（服务端要求，GET 也不例外）。超时使用 AbortController，AbortError 转换为友好提示。Base URL 来自 `process.env.SERVER_BASEURL`（构建时由 esbuild define 注入）。Debug 日志输出到 stderr。
- `client.interface.ts` — `ApiConfig`（含 `auth?: boolean`）、`RequestConfig`、`ApiResponse<T>`
- `modules/xianyu.ts` — 闲鱼业务 API，直接导出函数（`getShops`/`getSellerGoodsList`/`upGoods`/`getUserShopList`/`getUserStockList`/`getSelectGoodsList` 等），内部共享一个 `ApiClientService` 实例。消费方式：`import * as xianyuApi from "..."` 或按需导入。
- `modules/xianyu-auth.ts` — 闲鱼店铺授权 API，导出 `getAuthUrl()` 和 `getAuthStatus(state)` 两个函数。
- `modules/qrcode-auth.ts` — 二维码登录 API（**唯一**传 `{ auth: false }` 的模块），导出 `generateQRCode()` 和 `getQRCodeStatus()` 两个函数。

**本地存储** (`src/services/storage/`)：
- `config-store.ts` — `ConfigStore`（`getConfigStore()` 单例），共享文件 I/O。`~/.r2-cli/config.json`，原子写入（tmp + rename）。带内存缓存。
- `auth-storage.ts` — `AuthStorage`（`getAuthStorage()` 单例），认证凭证存储。导出 `TOKEN_EXPIRY_MARGIN_MS` 常量（5 分钟安全边际）。
- `business-storage.ts` — `BusinessStorage`（`getBusinessStorage()` 单例），业务缓存。`getShop`/`saveShop`/`getAddress`/`saveAddress`。
- `index.ts` — barrel export

**共享工具** (`src/utils/`)：
- `qrcode.ts` — `renderQRCode(content, filename)` — 共享二维码渲染（PNG 文件 + Unicode 半块字符 + `qrUrl` 本地 HTTP 链接 + `qrImageBase64` base64 图片数据），被 `login.ts` 和 `xianyu-auth.ts` 共用。`startQrServer` 启动临时 HTTP 服务，通过 SSE（`/events` 端点）推送 `QrPageStatus`（waiting/scanning/success/expired）实现页面实时状态更新。`setStatus` 回调由调用方在轮询中调用，HTML 页面自动切换显示。`closeServer` 在操作完成后关闭服务器。QR 页面采用第二回合品牌色 `#06d290`（CSS 变量体系），展示品牌标识和三种扫码方式（第二回合 APP / 微信 / 支付宝）。
- `render.tsx` — `renderOnce()` + `renderComponent()`。`renderComponent` 封装 `React.createElement` + `renderOnce`，用于结构化数据展示组件；简单状态提示保持 chalk。组件实现在 `src/components/`（ShopsTable、StocksTable、SelectGoodsTable、GoodsTable 等）。
- `polling.ts` — `poll()` 通用轮询工具，支持 AbortSignal 和超时。

**交互式上架流程** (`src/commands/goods/up-flow/`)：
- `index.ts` 导出 `UpFlowService`，使用 `@inquirer/prompts`。自动匹配品牌/尺码/成色。
- 各步骤函数拆分在 `select-shop.ts`、`select-goods.ts`、`select-category.ts`、`select-props.ts`、`summary.ts`。

**认证服务** (`src/services/auth/`)：
- `login.ts` — `LoginService`（QR 生成 + 轮询 + 人类登录 + 状态/登出）。`QRCodeResult` 是 `QRCodeOutput & { qrData }` 类型别名。`pollPageStatus` 方法用于 Agent qr 子命令的后台页面状态更新（不打印日志、不保存凭证）。人类模式的 `login()` 在 finally 块中调用 `closeServer()`。
- `xianyu-auth.ts` — 闲鱼店铺授权，导出函数（`generateAuthQR`/`waitForAuth`/`authorize`/`pollAuthPageStatus`）。`authorize()` 在 finally 中关闭服务器。
- `index.ts` — 仅导出函数和类（不导出类型）

**更新检查** (`src/services/update-check/index.ts`)：
- `checkForUpdate(currentVersion)` — 每次启动异步检查，先 npmmirror 后 npmjs，5s 超时静默失败。

**AI 服务** (`src/services/ai/`)：
- `alibaba.ts` — 阿里百炼 AI，支持 SSE 流式。
- `index.ts` — `MultiAIService` 门面，导出单例 `aiService`

### 认证流程

**扫码登录** (`auth login`)：
- **人类模式**：`r2-cli auth login` — 同时显示 unicode 二维码和浏览器链接，页面通过 SSE 实时更新状态（等待→已扫码→登录成功），成功后 finally 块关闭服务器
- **Agent 模式**：`r2-cli auth login qr` → `r2-cli auth login poll --token <> --expire <> --interval <>`。qr 子命令后台启动 `pollPageStatus` 更新页面状态，成功后 3 秒自动关闭服务器

**闲鱼店铺授权** (`auth xianyu`)：
- **人类模式**：`r2-cli auth xianyu` — 同登录流程，同时显示 unicode + 链接，实时更新状态
- **Agent 模式**：`r2-cli auth xianyu qr` → `r2-cli auth xianyu poll --state <> --expire <> --interval <>`。qr 子命令后台启动 `pollAuthPageStatus`，成功后自动关闭
- API 端点：`mms/xianyu/auth/url`（返回 `url` + `state`）和 `mms/xianyu/auth/status?state=`（`waiting`/`success`/`expired`）

**重要**：当用户在 Claude Code 会话中请求登录时，必须按 `skills/r2-auth/SKILL.md` 的两步式流程执行。

### 错误处理
- `src/errors/index.ts` — `R2Error` → `ApiError`/`AuthError`/`StorageError`/`PollingError`/`CliError`
- `src/commands/shared.ts`：
  - `handleCommandError()` — 交互式命令错误分发
  - `agentAction<T>(fn)` — Agent 子命令包装器，自动 catch 并格式化为 JSON 错误
  - `agentError(msg)` — 直接输出 `{ success: false, error }` + `process.exit(1)`
  - `notImplemented(name)` — 未实现命令提示
  - `sanitizeShops(shops)` — 过滤 `SENSITIVE_KEYS`（accessToken/refreshExpireIn），用于 `--json` 输出
- Agent 子命令使用 `agentAction` 包装或直接调用 `agentError`，不使用 `handleCommandError`
- 交互式流程（`up-flow/`）禁止使用 `process.exit()`，必须 `throw new CliError()` 让上层捕获

### 构建系统
- `scripts/build.js` — esbuild。通过 dotenv 读取 `.env` / `.env.production`。`process.env.SERVER_BASEURL` 构建时通过 esbuild `define` 注入。所有运行时依赖 externalize。`cleanDist()` 有 Windows EBUSY fallback。
- `scripts/dev.js` — 用 `stdio: 'inherit'` 启动 `tsx`，保证交互式 prompt 可用
- 版本号读取：优先 `../package.json`（npm 安装后），其次 `../../package.json`（开发模式），最后 fallback `dist/package.json`

### 关键类型
- `src/types/auth.ts` — `UserInfo`、`QRCodeStatus`、`GenerateQRCodeData`、`QRCodeStatusData`、`XianyuAuthUrlData`（字段名是 `state` 不是 `stats`）、`XianyuAuthStatusData`
- `src/types/xianyu.ts` — `XyShop`、`SellerGoodsItem`、`XyGoodsDetail`、`XyGoodsUpParams`、`ItemAttr`、`StuffLevel`、`ITEM_BIZ_TYPES`、`STUFF_LABELS`、`DEFAULT_SP_BIZ_TYPE`（默认类目业务类型=16）。用户级类型：`UserShop`（跨平台店铺）、`UserStock`（仓库）、`SelectGoodsItem`/`SelectGoodsListParams`/`SelectGoodsListResult`（选品商品）。

### Skill 体系

`skills/` 目录下的 Skill 随 npm 包发布：
- `skills/r2-auth/SKILL.md` — 两步式扫码登录
- `skills/r2-cli/SKILL.md` — 核心概览
- `skills/r2-goods/SKILL.md` — 商品管理全流程

### 环境配置
- `.env` — `SERVER_BASEURL='https://api.qiuxietang.com'`（开发）
- `.env.production` — `SERVER_BASEURL='https://api.puresnake.com'`（生产）
- `ALIBABA_API_KEY` — AI 服务密钥（仅环境变量，不可硬编码）

### tsconfig
- `module: "nodenext"`、`strict: true`、`jsx: "react-jsx"`、`verbatimModuleSyntax: true`
- 所有 import 必须使用 `.js` 扩展名以支持 ESM 解析
- JSON 导入使用 `import ... from "..." with { type: "json" }`（esbuild 内联打包）

### 业务约束

- 从 `XyGoodsDetail` 构建 `XyGoodsUpParams` 时，必须排除 `price` 字段（使用解构 `const { price, ...rest } = detail`）—— 只发送 `reservePrice` 和 `originalPrice`，均设为用户确认的售价。
- 目前仅支持普通商品（`itemBizType=2`），严选商品暂不支持。
- 类目业务类型使用 `DEFAULT_SP_BIZ_TYPE` 常量（值=16），不要硬编码数字。
- `submit` 子命令使用 `--data @file.json` 语法传递 goodsDetail；`@` 前缀表示从文件读取（避免 Windows 下 shell 转义问题）。
- `submit` 中 `apiAfterSalesDo` 需要提供完整默认值再与 detail 合并（`?? {}` 兜底），因为 raw data 可能不含此字段。
