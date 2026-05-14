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

测试文件放在 `tests/` 目录，使用 Vitest：
```bash
npm test              # 全量
npm run test:watch    # 监听模式
```

## 架构概览

R2-CLI 是面向二手潮奢交易场景的 CLI 工具，将业务能力以 CLI 命令和 AI Agent Skill 两种形式开放。

**双模架构**：交互式命令（人类友好）+ `--json` 参数（Agent 友好），同一命令两种输出格式。

### 入口流程
1. `src/entrypoints/r2-cli.tsx` — CLI 入口，初始化 Commander、版本号读取（双路径 fallback）、异步更新检查、SIGINT/SIGTERM 优雅退出
2. `src/commands/setup.ts` — 注册所有域命令（auth、goods、uninstall）
3. `src/commands/goods/` — 商品管理命令组（shops / stocks / list / listing / up / down / price / edit / hang-up）
4. `src/commands/uninstall.ts` — 一键卸载：删除 `~/.r2-cli/` + `npm uninstall -g @round2ai/r2-cli`
5. 所有命令均已实现，无 stub 命令

### 服务层

**API 客户端** (`src/services/api/`)：
- `client.ts` — 基于 `fetch` 的 HTTP 客户端，处理响应信封 `{ success, status, data, msg }`。**默认启用认证**（自动从 storage 读取 token 注入 header，内存缓存 + 5 分钟过期安全边际），401 时清除凭证。只有 `qrcode-auth.ts` 传 `{ auth: false }` 禁用认证。所有请求均发送 `Content-Type: application/json`。超时使用 AbortController，AbortError 转换为友好提示。Base URL 来自 `process.env.SERVER_BASEURL`（构建时由 esbuild define 注入）。
- `modules/goods.ts` — 业务 API，导出函数：`getUserShopList` / `getUserStockList` / `getSelectGoodsList` / `listingUpXianyu` / `getListingInfo` / `listingDownXianyu` / `listingUpdatePrice` / `updateGoodsInfo` / `getListingList` / `listingHangUpXianyu` / `getXyCategories` / `getXyProps` / `getXyPropValues` / `uploadXyImages`。所有挂售 API 已合并至此（无独立的 `xianyu-hangup.ts`）。内部共享一个 `ApiClientService` 实例。
- `modules/xianyu-auth.ts` — 闲鱼店铺授权 API，导出 `getAuthUrl()` 和 `getAuthStatus(state)`。
- `modules/qrcode-auth.ts` — 二维码登录 API（**唯一**传 `{ auth: false }` 的模块），导出 `generateQRCode()` 和 `getQRCodeStatus()`。

**本地存储** (`src/services/storage/`)：
- `config-store.ts` — `ConfigStore`（单例），`~/.r2-cli/config.json`，原子写入（tmp + rename）。带内存缓存（`configLoaded` 标志）。
- `auth-storage.ts` — `AuthStorage`（单例），凭证存储。导出 `TOKEN_EXPIRY_MARGIN_MS`（5 分钟安全边际）。

**共享工具** (`src/utils/`)：
- `render.tsx` — `renderOnce()` + `renderComponent()`。React 组件展示 + chalk 简单提示。
- `polling.ts` — `poll()` 通用轮询工具，支持 AbortSignal 和超时。`callWithTimeout()` 单次请求超时保护。
- `version.ts` — `getVersion()` 版本号读取（双路径 fallback：`../package.json` → `../../package.json`）。
- `params.ts` — `toParams()` 对象转 URLSearchParams，过滤 null/undefined/空字符串。
- `image.ts` — `compressImageIfNeeded(filePath, maxBytes=2MB)` 图片压缩。用 sharp JPEG quality 渐进降低（100→30），PNG 自动转 JPEG，原文件不修改。

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
- `POST mms/goods/listing/update/goodsInfo` → `updateGoodsInfo()` — 修改商品信息（标题/描述/品牌/类目/图片/属性）
- `GET mms/goods/listing/list` → `getListingList()` — 查询上架列表

`goods up` 命令提交后自动轮询 `getListingInfo`（每 2 秒，最多 10 秒），返回 `{ submit, listing }` 包含提交和最终状态。`init` 状态视为"处理中"继续轮询。

**人类模式**：`r2-cli goods up` — 交互式选择店铺 → 仓库 → 商品 → 输入价格 → 确认 → 自动轮询结果
**Agent 模式**：`r2-cli goods up --stock-goods-id <id> --shop-id <id> --price <amount> --json`

### 挂售流程（hang-up）

挂售模式支持完整商品信息（图片、类目、属性、品牌），与普通上架（`goods up`）是不同流程。

**上架路由决策**：用户说"上架"未指定方式时，Agent **必须询问**"选品上架还是挂售上架？"。

挂售命令实现在 `src/commands/goods/hang-up.ts`，API 在 `src/services/api/modules/goods.ts`。

挂售 API 端点：
- `GET platform/xy/cat` → `getXyCategories()` — 获取类目
- `GET platform/xy/props` → `getXyProps()` — 获取属性（非品牌属性含 `propsValues`）
- `GET platform/xy/props/value` → `getXyPropValues()` — **仅**用于品牌搜索
- `POST platform/xy/media/upload` → `uploadXyImages()` — 上传图片
- `POST mms/goods/listing/hang/up/xianyu` → `listingHangUpXianyu()` — 提交挂售

**图片上传**：`uploadXyImages()` 使用 `Promise.allSettled` 并行上传，单张失败自动重试 1 次，返回 `{ images: [], failed: [] }` 结构支持局部失败。上传前自动调 `compressImageIfNeeded()`（sharp JPEG quality 渐进降低 100→30，PNG 自动转 JPEG）。

**attribute 传递**：`submit` 接口直接接收 `itemAttrList`。确保匹配属性时 propId/valueId 正确，参数对则属性正确写入，不对则 edit 也无法修复。

**413 处理**：`client.ts` 中单独处理 413 状态码，输出友好提示而非原始 nginx HTML。

**售后默认值**：`apiAfterSalesDo` 所有字段默认 `false`（卖家未开通的服务传 `true` 会导致 `ITEM_CONDITION_NOT_SUPPORT_SIGN` 错误）。

### 修改商品信息（edit）

修改已上架商品的标题、描述、品牌、类目、图片、属性等。命令实现在 `src/commands/goods/edit.ts`，API 是 `updateGoodsInfo()`。

**关键约束**：
- 定位商品优先使用 `--id <goodsListingId>`（推荐），也可用 `--stock-goods-id + --account`（备选）
- `--category-id` 和 `--channel-cat-id` 后端必填（复用挂售 DTO），即使不改类目也要传
- 挂售商品的 `stockGoodsId` 可能为 `0`，配合 `account`（shopId）使用

### UI 组件

`src/components/` — Ink（React for CLI）表格组件，通过 `renderOnce()` 渲染为终端输出：
- `ShopsTable.tsx`、`StocksTable.tsx`、`SelectGoodsTable.tsx`、`ListingTable.tsx`
- 统一风格：圆角边框 + 表头 + 分隔线 + 数据行，自适应终端宽度

### 认证流程

**扫码登录** (`auth login`)：
- **人类模式**：`r2-cli auth login` — 自动打开浏览器展示扫码页面，SSE 实时更新状态
- **Agent 模式**：`r2-cli auth login --json` — 自动打开浏览器 + JSON 输出（QR 信息 + 自动轮询登录结果）。备选：`auth login poll --token <>` 手动轮询

**闲鱼店铺授权** (`auth xianyu`)：
- **人类模式**：`r2-cli auth xianyu` — 自动打开浏览器展示授权页面
- **Agent 模式**：`r2-cli auth xianyu --json` — 自动打开浏览器 + JSON 输出（QR 信息 + 自动轮询授权结果）。备选：`auth xianyu poll --state <>` 手动轮询

**重要**：当用户在 Claude Code 会话中请求登录时，使用 `auth login --json` 一步完成（自动打开浏览器 + 自动轮询结果）。

### 错误处理与共享工具
- `src/errors/index.ts` — `R2Error` → `ApiError`/`AuthError`/`StorageError`/`PollingError`
- `src/commands/shared.ts`：
  - `handleCommandError()` — 交互式命令错误分发
  - `agentAction(fn)` — Agent 子命令包装器（用于 auth poll）。自动 catch 并格式化为 JSON 错误。被包装函数需自行 `console.log` 输出
  - `validationError(options, msg)` — 双模验证失败处理（JSON 模式 exit(1)，人类模式 chalk.yellow）
  - `jsonSuccess(options, data, successMsg?)` — 双模成功输出（JSON 模式 `{ success, data }`，人类模式 chalk.green）
  - `agentError(msg)` — 直接输出 `{ success: false, error }` + `process.exit(1)`
  - `notImplemented(name)` — 未实现命令提示
  - `sanitizeShops(shops)` — 过滤 `SENSITIVE_KEYS`（accessToken/refreshExpireIn）

### 构建系统
- `scripts/build.js` — esbuild。通过 dotenv 读取 `.env` / `.env.production`。`process.env.SERVER_BASEURL` 构建时通过 esbuild `define` 注入。所有运行时依赖 externalize（包括 `sharp` 等 native 模块）。`cleanDist()` 有 Windows EBUSY fallback。
- `scripts/dev.js` — 用 `stdio: 'inherit'` 启动 `tsx`，保证交互式 prompt 可用
- 版本号读取：已提取到 `src/utils/version.ts`，入口和 update 命令共用
- sharp v0.34.5 是唯一的 native 模块依赖，build 时 externalize，需要 `node_modules` 中存在

### 关键类型
- `src/types/auth.ts` — `UserInfo`、`QRCodeStatus`、`GenerateQRCodeData`、`QRCodeStatusData`、`XianyuAuthUrlData`（字段名是 `state` 不是 `stats`）、`XianyuAuthStatusData`
- `src/types/goods.ts` — `XyShop`、`ListingUpParams`（stockGoodsId/shopId/price/platform）、`ListingGetParams`、`ListingInfo`、`UserShop`（注意 `shopId` 是第三方 ID，`id` 是数据库 ID）、`UserStock`、`SelectGoodsItem`/`SelectGoodsListParams`/`SelectGoodsListResult`、`ListingListResult`（注意字段是 `items` 不是 `list`）、`UpdateGoodsInfoParams`、`HangUpParams`、`AfterSales`（售后配置）、`UploadImagesResult`、`XyItemAttr`（5 字段：valueName/valueId/propId/propName/channelCatId）

### Skill 体系

`skills/` 目录下的 Skill 随 npm 包发布：
- `skills/r2-shared/SKILL.md` — 共享基础（执行规则、安装、错误格式、命令概览、路由决策概要）
- `skills/r2-auth/SKILL.md` — 一步式扫码登录（`--json` + 自动打开浏览器 + 自动轮询）
- `skills/r2-goods/SKILL.md` — 商品管理概览（路由决策 + 命令表格 + references 链接）
- `skills/r2-goods/references/` — 详细操作指南（r2-goods-query / r2-goods-listing / r2-goods-hangup）

安装时 `postinstall` 脚本（`scripts/install-skills.js`）自动将技能复制到 `~/.agents/skills/`，支持 `references/` 子目录递归复制和清理。本地（Claude Code 用户设置）也安装到 `~/.claude/skills/`。

### 环境配置
- `.env` — `SERVER_BASEURL='https://api.qiuxietang.com'`（开发）
- `.env.production` — `SERVER_BASEURL='https://api.puresnake.com'`（生产）
- `ALIBABA_API_KEY` — AI 服务密钥（仅环境变量，不可硬编码）

### 命令模式

所有命令统一注册模式（`src/commands/`）：
```typescript
// 双模命令标准结构
program
  .command("xxx")
  .option("--json", "JSON 输出")
  .action((options) => {
    if (options.json) {
      // Agent 模式：JSON 输出
    } else {
      // 人类模式：交互式 / chalk 输出
    }
  });
```
- 查询类命令（shops/stocks/list/listing）：`options.json === true` 时 `JSON.stringify` 原始数据，否则 `renderOnce(TableComponent)`
- 变更类命令（up/down/price/edit/hang-up）：`options.json === true` 时 `JSON.stringify({ success, data })`，人类模式 `chalk.green`
- 验证失败用 `validationError(options, msg)`，成功用 `jsonSuccess(options, data)`

### tsconfig
- `module: "nodenext"`、`strict: true`、`jsx: "react-jsx"`、`verbatimModuleSyntax: true`、`exactOptionalPropertyTypes: true`
- 所有 import 必须使用 `.js` 扩展名以支持 ESM 解析
- `exactOptionalPropertyTypes` 要求可选参数类型显式包含 `| undefined`（如 `id?: string | undefined`）
