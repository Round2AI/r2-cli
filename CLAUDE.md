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
2. `src/commands/setup.ts` — 注册所有域命令（auth、goods、uninstall）
3. `src/commands/*/` 各目录下的命令工厂函数返回 `Command` 实例
4. `src/commands/uninstall.ts` — 一键卸载：删除 `~/.r2-cli/` + `npm uninstall -g @round2ai/r2-cli`
5. 未实现的命令统一调用 `notImplemented(name)`（从 `shared.ts` 导入），禁止输出虚假功能信息

### 服务层

**API 客户端** (`src/services/api/`)：
- `client.ts` — 基于 `fetch` 的 HTTP 客户端，处理响应信封 `{ success, status, data, msg }`。Base URL 来自 `process.env.R2_API_URL`（构建时由 esbuild define 注入）。Debug 日志输出到 stderr（`console.error`），不污染 stdout。
- `auth-client.ts` — 包装 `ApiClientService`。内存缓存 token 带过期时间追踪（5 分钟安全边际），过期自动从 storage 重新读取。401 时清除凭证并提示重新登录。
- `modules/qrcode-auth.ts` — `QRCodeAuthApiService`，二维码认证 API 实现。
- `modules/xianyu.ts` — 闲鱼 API 封装，`getXianyuApi()` 单例。使用 `AuthenticatedApiClient`。
- `client.interface.ts` — `IApiClient`、`IQRCodeAuthApi`、`ApiConfig`、`ApiResponse<T>`

**本地存储** (`src/services/storage/`)：
- `index.ts` — `StorageService`（`createStorageService()` 单例），文件存储位于 `~/.r2-cli/config.json`。原子写入（tmp 文件 + rename 防中断丢失）。带内存缓存（`configLoaded` 标记，避免每次操作重复 I/O）+ 目录创建缓存（`dirEnsured`）。`isLoggedIn()`/`getToken()`/`getCredentials()` 自动检查 token 过期（`expire` 字段，5 分钟安全边际），过期返回 null/false。
- `types.ts` — `StoredCredentials`（含可选 `expire`）、`StoredAddress`、`StoredShop`、`LocalConfig`、`IStorageService`

**交互式上架流程** (`src/commands/goods/up-flow/`)：
- `index.ts` 导出 `UpFlowService`，使用 `@inquirer/prompts`。自动匹配品牌/尺码/成色。
- 各步骤函数拆分在 `select-shop.ts`、`select-goods.ts`、`select-category.ts`、`select-props.ts`、`summary.ts`。

**认证服务** (`src/services/auth/`)：
- `login.ts` — `LoginService`（QR 生成 + 轮询 + 人类登录 + 状态/登出）
- `index.ts` — 重导出

**更新检查** (`src/services/update-check/index.ts`)：
- `checkForUpdate(currentVersion)` — 每次启动异步检查，先 npmmirror 后 npmjs，5s 超时静默失败。有新版本输出到 stderr。
- 在 `r2-cli.tsx` 中立即启动（不 await），`program.parse()` 之后 `.catch(() => {})` 确保不阻塞。

**AI 服务** (`src/services/ai/`)：
- `alibaba.ts` — 阿里百炼 AI，支持 SSE 流式。fetch 调用有 30s 超时，SSE 读取循环有 120s 无数据超时。构造函数验证 `ALIBABA_API_KEY` 非空。`callApi()` 检查 `response.ok`。
- `index.ts` — `MultiAIService` 门面，导出单例 `aiService`

### 认证流程

`src/services/auth/login.ts` → `LoginService`：

- **人类模式**：`r2-cli auth login` — 生成二维码、终端显示 unicode、轮询直到确认
- **Agent 模式**：`r2-cli auth login qr`（第 1 步：生成二维码 → JSON 输出）然后 `r2-cli auth login poll --token <> --expire <> --interval <>`（第 2 步：轮询直到确认 → JSON 输出）

**重要**：当用户在 Claude Code 会话中请求登录时，必须按 `skills/r2-auth/SKILL.md` 的两步式流程执行（生成二维码 → 将 unicodeQR 输出到聊天窗口 → 后台启动轮询），不要直接使用 `r2-cli auth login` 交互式命令。

### 错误处理
- `src/errors/index.ts` — `R2Error` → `ApiError`（含 `status`、`response`）、`AuthError`、`StorageError`、`PollingError`、`CliError`
- `src/commands/shared.ts` — `handleCommandError()` 按错误类型分发（交互式命令用）；`agentError(msg)` 统一 Agent 子命令 JSON 错误输出 `{ success: false, error }` + `process.exit(1)`；`notImplemented(name)` 统一未实现命令提示。
- `src/commands/goods/up/` — 上架命令拆分为 `index.ts`（父命令+交互向导）+ `info.ts`/`categories.ts`/`props.ts`/`submit.ts`/`address.ts`（Agent 子命令）
- Agent 子命令错误统一使用 `agentError(msg)`（输出 `{ success: false, error: msg }` + `process.exit(1)`），不使用 `handleCommandError`（后者输出人类可读文本到 stderr）
- 交互式流程（`up-flow/`）禁止使用 `process.exit()`，必须 `throw new CliError()` 让上层捕获

### 构建系统
- `scripts/build.js` — esbuild。通过 dotenv 读取 `.env` / `.env.production`。用 `cross-env NODE_ENV` 选择环境。`process.env.R2_API_URL` 构建时注入。所有运行时依赖（commander、chalk、@inquirer/*、ora、react、ink 等）externalize。输出 `dist/r2-cli.js`，同时复制 `package.json` 和 `README.md`。
- `scripts/dev.js` — 用 `stdio: 'inherit'` 启动 `tsx src/entrypoints/r2-cli.tsx`，保证交互式 prompt 可用
- 版本号读取：优先 `../package.json`（npm 安装后指向包根目录），其次 `../../package.json`（开发模式指向项目根目录），最后 fallback `dist/package.json`

### 关键类型
- `src/types/auth.ts` — `UserInfo`、`QRCodeStatus`、`GenerateQRCodeData`、`QRCodeStatusData`
- `src/types/xianyu.ts` — `XyShop`、`SellerGoodsItem`、`XyGoodsDetail`、`XyGoodsUpParams`、`ItemAttr`、`StuffLevel`、`ITEM_BIZ_TYPES`、`STUFF_LABELS`、`DEFAULT_SP_BIZ_TYPE`（默认类目业务类型=16）

### 终端 UI 组件 (`src/components/`)
- `GoodsTable.tsx` — 商品列表表格（Ink + React）
- `ShopsTable.tsx` — 店铺列表表格
- `UserInfoCard.tsx` — 用户信息卡片
- 使用 `renderOnce(React.createElement(...))` 挂载（render + immediate unmount），仅在结构化数据展示时使用；简单状态提示保持 chalk。
- `renderOnce` 定义在 `src/utils/render.tsx`（从 `utils/index.ts` 拆分，避免 React/Ink 顶层导入破坏惰性加载）。Writable buffer + chalk.level=3 truecolor + try/finally 安全恢复。
- `index.ts` — barrel export 所有组件

### Skill 体系

`skills/` 目录下的 Skill 是面向 Claude Code 的能力描述文件，随 npm 包发布：
- `skills/r2-auth/SKILL.md` — 两步式扫码登录，供 Agent 使用
- `skills/r2-cli/SKILL.md` — 核心概览：认证 + 基本操作
- `skills/r2-goods/SKILL.md` — 商品管理全流程，含 Agent 分步上架

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
