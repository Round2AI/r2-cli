# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 构建与开发命令

```bash
# 开发模式（tsx 直接运行，继承 TTY 支持交互式 prompt）
npm run dev
npm run dev -- goods list

# 构建（esbuild，输出到 dist/cli.js）
npm run build          # 开发环境：读取 .env
npm run build:prod     # 生产环境：读取 .env.production，minified

# 运行构建产物
node dist/cli.js --help
```

未配置测试框架。

## 架构概览

R2-CLI 是面向二手潮奢交易场景的 CLI 工具，将业务能力以 CLI 命令和 AI Agent Skill 两种形式开放。

**双模架构**：每个交互式流程都有一组对应的 JSON 输出子命令供 AI Agent 调用。例如 `goods up`（7 步交互向导）对应 `goods up info`/`categories`/`props`/`submit`（JSON 原子操作）。

### 入口流程
1. `src/entrypoints/cli.tsx` — CLI 入口，初始化 Commander、SIGINT 处理
2. `src/commands/setup.ts` — 注册所有域命令（auth、goods、business、inventory、ai）
3. `src/commands/*/` 各目录下的命令工厂函数返回 `Command` 实例

### 服务层

**API 客户端** (`src/services/api/`)：
- `api-client.service.ts` — 基于 `fetch` 的 HTTP 客户端，处理响应信封 `{ success, status, data, msg }`。Base URL 来自 `process.env.R2_API_URL`（构建时由 esbuild define 注入）。含 `refreshToken()` 调用 `user/refresh` 端点。
- `authenticated-client.service.ts` — 包装 `ApiClientService`。自动从 Storage 加载 token，401 时调用 `refreshToken` → 保存新 token → 重试原请求。刷新也失败才清除凭证并提示重新登录。
- `api-client.interface.ts` — `IApiClient`、`IQRCodeAuthApi`、`ApiConfig`、`ApiResponse<T>`

**本地存储** (`src/services/storage/`)：
- `index.ts` — `StorageService`，文件存储位于 `~/.r2-cli/config.json`。管理凭证（token + userInfo + expire）、缓存地址（province/city/area/divisionId）、缓存店铺（thirdUserId + name + platform）。
- `storage-service.interface.ts` — `StoredCredentials`（含可选 `expire`）、`StoredAddress`、`StoredShop`、`LocalConfig`

**领域服务** (`src/services/xy/`)：
- `xianyu-api.service.ts` — 闲鱼 API 封装，`getXianyuApi()` 单例。使用 `AuthenticatedApiClient`。
- `up-flow.service.ts` — 7 步交互式上架向导，使用 `@inquirer/prompts`。自动匹配品牌/尺码/成色。

**AI 服务** (`src/services/ai/`)：
- `alibaba.ts` — 阿里百炼 AI，支持 SSE 流式
- `index.ts` — `MultiAIService` 门面，导出单例 `aiService`

### 认证流程

`src/commands/auth/login.ts` → `LoginService`：

- **人类模式**：`auth login` — 生成二维码、终端显示 unicode、轮询直到确认
- **Agent 模式**：`auth login qr`（第 1 步：生成二维码 → JSON 输出）然后 `auth login poll --token <> --expire <> --interval <>`（第 2 步：轮询直到确认 → JSON 输出）

### 错误处理
- `src/errors/index.ts` — `R2Error` → `ApiError`（含 `status`、`response`）、`AuthError`、`StorageError`、`PollingError`、`CliError`
- `src/commands/goods/shared.ts` — `handleCommandError()` 按错误类型分发：AuthError → 登录提示，ApiError → 消息 + 状态码，其他 → 通用处理

### 构建系统
- `scripts/build.js` — esbuild。通过 dotenv 读取 `.env` / `.env.production`。用 `cross-env NODE_ENV` 选择环境。`process.env.R2_API_URL` 构建时注入。所有运行时依赖（commander、chalk、@inquirer/*、ora、react、ink 等）externalize。
- `scripts/dev.js` — 用 `stdio: 'inherit'` 启动 `tsx src/entrypoints/cli.tsx`，保证交互式 prompt 可用

### 关键类型
- `src/types/auth.ts` — `UserInfo`、`QRCodeStatus`、`GenerateQRCodeData`、`QRCodeStatusData`
- `src/types/xianyu.ts` — `XyShop`、`SellerGoodsItem`、`XyGoodsDetail`、`XyGoodsUpParams`、`ItemAttr`、`StuffLevel`、`ITEM_BIZ_TYPES`、`STUFF_LABELS`

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
- `submit` 子命令使用 `--data @file.json` 语法传递 goodsDetail；`@` 前缀表示从文件读取（避免 Windows 下 shell 转义问题）。
