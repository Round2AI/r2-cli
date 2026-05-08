# R2-CLI 系统架构文档

> 版本 2.0.0 | 更新于 2026-05-07

## 项目概述

R2-CLI 是 Round2AI 面向 AI Agent 开发者的命令行工具，将二手潮奢交易全链路能力以 CLI 命令和 Skill 形式开放。基于 TypeScript + ESM 开发，使用 Commander.js 管理命令、@inquirer/prompts 处理交互、esbuild 打包。

核心设计理念是**双模架构**：同一套业务逻辑同时服务人类用户（交互式向导）和 AI Agent（JSON 输出的原子操作子命令）。

## 目录结构

```
r2-cli/
├── src/
│   ├── entrypoints/
│   │   └── r2-cli.tsx           # CLI 入口：Commander + 版本号 + 更新检查 + 优雅退出
│   ├── commands/                 # 命令层（每个域一个目录）
│   │   ├── setup.ts              # 中央命令注册
│   │   ├── shared.ts             # handleCommandError / agentAction / agentError / notImplemented
│   │   ├── stubs.ts              # 未实现命令占位
│   │   ├── uninstall.ts          # 一键卸载
│   │   ├── auth/
│   │   │   ├── index.ts          # auth 命令组注册
│   │   │   ├── login.ts          # auth login（交互式 + qr/poll 子命令）
│   │   │   ├── logout.ts         # auth logout
│   │   │   ├── status.ts         # auth status
│   │   │   └── xianyu.ts         # auth xianyu（交互式 + qr/poll 子命令）
│   │   ├── goods/
│   │   │   ├── index.ts          # goods 命令组注册
│   │   │   ├── list.ts           # 商品列表
│   │   │   ├── shops.ts          # 已授权店铺
│   │   │   ├── down.ts           # 下架 / 重新上架
│   │   │   ├── price.ts          # 改价
│   │   │   ├── up/               # Agent 上架子命令
│   │   │   │   ├── index.ts      # up 命令组注册
│   │   │   │   ├── info.ts       # 商品详情 + prefill
│   │   │   │   ├── categories.ts # 分类树
│   │   │   │   ├── props.ts      # 分类属性
│   │   │   │   ├── address.ts    # 发货地址
│   │   │   │   └── submit.ts     # 提交上架
│   │   │   └── up-flow/          # 交互式 7 步上架向导
│   │   │       ├── index.ts      # UpFlowService
│   │   │       ├── select-shop.ts
│   │   │       ├── select-goods.ts
│   │   │       ├── select-category.ts
│   │   │       ├── select-props.ts
│   │   │       └── summary.ts
│   │   └── ai/                   # AI 命令（开发中）
│   ├── services/                 # 服务层
│   │   ├── api/
│   │   │   ├── client.ts         # ApiClientService（fetch 封装 + 认证 + 响应解包）
│   │   │   ├── client.interface.ts  # ApiConfig / RequestConfig / ApiResponse<T>
│   │   │   └── modules/
│   │   │       ├── xianyu.ts     # 闲鱼业务 API（导出函数）
│   │   │       ├── xianyu-auth.ts # 闲鱼店铺授权 API（导出函数）
│   │   │       └── qrcode-auth.ts # 二维码登录 API（唯一 auth: false）
│   │   ├── storage/
│   │   │   ├── types.ts          # StoredCredentials / StoredAddress / StoredShop
│   │   │   ├── config-store.ts   # ConfigStore（~/.r2-cli/config.json，原子写入）
│   │   │   ├── auth-storage.ts   # AuthStorage（凭证读写 + 过期检查）
│   │   │   ├── business-storage.ts # BusinessStorage（地址/店铺缓存）
│   │   │   └── index.ts          # barrel export
│   │   ├── auth/
│   │   │   ├── login.ts          # LoginService（class，有状态 storage）
│   │   │   ├── xianyu-auth.ts    # 闲鱼授权（导出函数，无状态）
│   │   │   └── index.ts          # barrel export
│   │   ├── ai/
│   │   │   ├── alibaba.ts        # 阿里百炼 DashScope（SSE 流式）
│   │   │   └── index.ts          # MultiAIService 门面 + 单例
│   │   └── update-check/
│   │       └── index.ts          # 异步版本检查（npmmirror + npmjs）
│   ├── components/               # Ink/React 终端 UI 组件
│   │   ├── GoodsTable.tsx
│   │   ├── ShopsTable.tsx
│   │   ├── UserInfoCard.tsx
│   │   ├── StepHeader.tsx
│   │   ├── SelectionResult.tsx
│   │   ├── SubmitResult.tsx
│   │   └── SubmitSummary.tsx
│   ├── types/
│   │   ├── auth.ts               # UserInfo / QRCode / XianyuAuth 类型
│   │   └── xianyu.ts             # XyShop / XyGoodsDetail / XyGoodsUpParams 等
│   ├── errors/
│   │   └── index.ts              # R2Error → ApiError / AuthError / StorageError / PollingError / CliError
│   └── utils/
│       ├── index.ts              # parseJsonArg 等
│       ├── polling.ts            # poll() 通用轮询 + sleep
│       ├── qrcode.ts             # renderQRCode（PNG + Unicode 半块字符）
│       ├── render.tsx            # renderOnce + renderComponent（React + Ink）
│       └── city.ts               # 省市区数据
├── skills/                       # Claude Code Skill（随 npm 发布）
│   ├── r2-auth/SKILL.md
│   ├── r2-cli/SKILL.md
│   └── r2-goods/SKILL.md
├── scripts/
│   ├── build.js                  # esbuild 构建（env 注入 / shebang / externalize）
│   └── dev.js                    # tsx 开发模式（TTY 继承）
├── docs/
├── dist/                         # 构建输出
├── package.json
└── tsconfig.json
```

## 架构总览

```
┌──────────────────────────────────────────────────────────────────┐
│                         调用方                                    │
│     人类用户（终端交互）            AI Agent（Claude Code）        │
│          │                              │                         │
│    交互式向导（7步）            JSON 原子子命令（info/submit）      │
└──────────┬──────────────────────────────┬─────────────────────────┘
           │                              │
           └──────────┬───────────────────┘
                      │  Commander.js 解析参数
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  命令层 (src/commands/)                                           │
│                                                                   │
│  ┌──────────┐  ┌──────────────────┐  ┌───────┐                   │
│  │ auth/    │  │ goods/           │  │ ai/   │                   │
│  │ login    │  │ up (向导+子命令) │  │ (开发中)│                   │
│  │ xianyu   │  │ down / reup     │  │       │                   │
│  │ logout   │  │ list / shops    │  │       │                   │
│  │ status   │  │ price           │  │       │                   │
│  └────┬─────┘  └───────┬────────┘  └───────┘                   │
│       │                │                                          │
└───────┼────────────────┼──────────────────────────────────────────┘
        │                │
        ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│  服务层 (src/services/)                                           │
│                                                                   │
│  ┌────────────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ ApiClientService   │  │ Storage      │  │ AI               │ │
│  │ (client.ts)        │  │ (storage/)   │  │ (ai/)            │ │
│  │                    │  │              │  │                  │ │
│  │ • fetch 封装       │  │ • ConfigStore│  │ • Alibaba AI     │ │
│  │ • 自动注入 token   │  │ • AuthStorage│  │ • SSE 流式       │ │
│  │ • 响应解包         │  │ • Business   │  │                  │ │
│  │ • 401 清凭证       │  │   Storage    │  │                  │ │
│  └────────┬───────────┘  └──────────────┘  └──────────────────┘ │
│           │                                                       │
│  ┌────────┴───────────┐                  ┌────────────────────┐ │
│  │ API Modules        │                  │ 本地存储            │ │
│  │ (modules/)         │                  │ ~/.r2-cli/         │ │
│  │ • xianyu.ts        │                  │ config.json        │ │
│  │ • xianyu-auth.ts   │                  └────────────────────┘ │
│  │ • qrcode-auth.ts   │                                         │
│  └────────┬───────────┘                                         │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────┐                            │
│  │ R2 API                           │                            │
│  │ api.qiuxietang.com / puresnake.com                           │
│  └──────────────────────────────────┘                            │
└──────────────────────────────────────────────────────────────────┘
```

## 核心模块详解

### 1. 入口与命令注册

**入口** `src/entrypoints/r2-cli.tsx`：
- 创建 Commander `program`，设置 name/version
- figlet ASCII 欢迎信息
- 注册 `SIGINT`/`SIGTERM` 优雅退出（exit code 130）
- 异步更新检查（静默失败）

**命令注册** `src/commands/setup.ts`：
- `setupCommands(program)` 将所有域命令挂载到 program
- 每个域命令通过工厂函数 `createXxxCommand()` 返回 `Command` 实例
- 未实现命令统一使用 `notImplemented()` 占位

**命令层级**：

```
r2
├── auth
│   ├── login          # 扫码登录（人类一键 / Agent qr+poll 两步式）
│   │   ├── qr         #   生成二维码 JSON
│   │   └── poll       #   轮询登录状态 JSON
│   ├── xianyu         # 闲鱼店铺授权（人类一键 / Agent qr+poll 两步式）
│   │   ├── qr         #   获取授权二维码 JSON
│   │   └── poll       #   轮询授权状态 JSON
│   ├── logout         # 退出登录
│   └── status         # 查看登录状态
├── goods
│   ├── shops          # 查看已授权店铺（-p xianyu/douyin）
│   ├── list           # 商品列表（--status/--keyword/--page/--size）
│   ├── select         # 选品商品列表（--page/--size/--stock-id/--stock-goods-id）
│   ├── up             # 交互式上架向导（7步） + Agent 子命令
│   │   ├── info <id>  #   商品详情 + prefill
│   │   ├── categories #   分类树
│   │   ├── props <id> #   分类属性
│   │   ├── submit     #   提交上架
│   │   └── address    #   发货地址
│   ├── down <ids...>  # 批量下架
│   ├── reup <ids...>  # 批量重新上架
│   └── price <id>     # 修改售价
├── shops              # 查看所有已授权店铺（跨平台）
├── stocks             # 查看所有仓库
└── uninstall          # 一键卸载
```

### 2. API 客户端体系

扁平架构，每层职责清晰：

```
ApiClientService (client.ts — HTTP + 认证合一)
    │
    │  职责：
    │  • 原生 fetch 封装 GET/POST/PUT/DELETE
    │  • 默认启用认证：从 AuthStorage 读取 token 注入 headers.token
    │    （内存缓存 + 5 分钟过期安全边际，见 TOKEN_EXPIRY_MARGIN_MS）
    │  • 唯一例外：qrcode-auth.ts 传 { auth: false } 禁用认证
    │  • URL 构建：baseUrl + /v3/ + path
    │  • 响应解包：{ success, status, data, msg } → 提取 data
    │  • 错误映射：HTTP 401 → 清除凭证 + AuthError, 其他 → ApiError
    │  • Base URL 构建时注入（esbuild define）
    │  • AbortError 转换为友好提示
    │  • Debug 日志输出到 stderr
    │
    ▼
API Modules (modules/ — 导出函数 + 共享 client 实例)
    │
    │  模式：const client = new ApiClientService(); export async function xxx() { ... }
    │
    ├── xianyu.ts      # 闲鱼业务：getShops / getSellerGoodsList / getXyGoodsInfo /
    │                   #           getCategories / getProps / getPropValues /
    │                   #           upGoods / batchDown / batchReUp / updatePrice
    │
    ├── xianyu-auth.ts # 闲鱼店铺授权：getAuthUrl / getAuthStatus
    │                   #   mms/xianyu/auth/url → { url, state }
    │                   #   mms/xianyu/auth/status?state= → { status, shopId, shopName }
    │
    └── qrcode-auth.ts # 二维码登录（唯一 auth: false）：
                        #   generateQRCode / getQRCodeStatus
```

**API 响应格式**：

```typescript
interface ApiResponse<T> {
  success: boolean
  status: number      // 0 = 成功
  data: T
  msg: string
}
```

**Base URL**：构建时由 esbuild `define` 注入 `process.env.SERVER_BASEURL`。
- 开发环境：`https://api.qiuxietang.com`（`.env`）
- 生产环境：`https://api.puresnake.com`（`.env.production`）

### 3. 认证流程

支持两种模式：**人类一键登录** 和 **AI Agent 两步式登录**。

**扫码登录** (`auth login`)：

```
r2-cli auth login（人类模式）
    │
    ▼
LoginService.login()
    │
    ├── 1. qrcodeAuth.generateQRCode()
    │      → { qrToken, qrContent, expireTime, pollInterval }
    │
    ├── 2. renderQRCode()（src/utils/qrcode.ts，共享工具）
    │      ├── PNG → ~/.r2-cli/qrcode.png
    │      └── Unicode 半块字符（█▀▄）渲染到终端
    │
    ├── 3. poll() 轮询扫码状态
    │      ├── waiting  → 继续等待
    │      ├── scanned  → 提示用户在 APP 确认
    │      ├── confirmed → 登录成功
    │      ├── expired  → 二维码过期
    │      └── canceled → 用户取消
    │
    ├── 4. storage.saveCredentials(token, userInfo)
    │
    └── 5. displayUserInfo（React 组件渲染）
```

**Agent 两步式登录**（r2-auth Skill）：

```
第1步：r2-cli auth login qr
    → JSON 输出 { qrToken, unicodeQR, expireTimeMs, pollIntervalMs }

第2步：r2-cli auth login poll --token <qrToken> --expire <ms> --interval <ms>
    → JSON 输出 { success, userInfo, token } 或 { success: false, error }
```

**闲鱼店铺授权** (`auth xianyu`)：

```
r2-cli auth xianyu（人类模式）
    │
    ▼
authorize()
    ├── 1. xianyuAuthApi.getAuthUrl() → { url, state }
    ├── 2. renderQRCode(url, "xianyu-auth-qrcode.png")
    ├── 3. poll() 轮询授权状态 (waiting/success/expired)
    └── 4. 成功返回 { shopId, shopName }

Agent 两步式：
    r2-cli auth xianyu qr    → { state, url, unicodeQR, ... }
    r2-cli auth xianyu poll --state <state> → { success, shopId, shopName }
```

**Token 存储**：

```
登录 → token 存入 AuthStorage → ~/.r2-cli/config.json（原子写入）
  → API 请求自动携带 token（headers.token）
  → 401 → 清除凭证 → 提示 r2-cli auth login
  → 内存缓存带 5 分钟过期检查（TOKEN_EXPIRY_MARGIN_MS）
```

### 4. 上架流程 (Up Flow) — 双模架构

`up` 命令同时支持两种调用方式，共享同一个 API 服务层。

#### 人类模式：交互式 7 步向导

`UpFlowService`（`up-flow/index.ts`）提供完整交互流程：

```
步骤 0: 店铺选择（缓存优先）
    ├── BusinessStorage 缓存命中 → confirm 使用缓存
    └── 缓存未命中 → 选择平台(闲鱼/抖音) → 选择店铺 → 缓存

步骤 1: 选择商品
    └── 分页加载 status=wait 商品 → inquirer select

步骤 2: 选择成色
    └── ITEM_BIZ_TYPES(普通商品=2) + STUFF_LABELS

步骤 3: 商品描述
    └── 默认值取 goodsDetail.desc

步骤 4: 选择类目
    └── API 加载类目 → 按主类目分组 → 先选主类目再选子分类

步骤 5: 售价
    └── 默认值取 goodsDetail.reservePrice

步骤 6: 选择属性（select-props.ts）
    ├── 品牌：优先 API 搜索自动匹配 → confirm 或手动搜索
    ├── 尺码/鞋码：自动匹配 detail.size → confirm
    ├── 成色：自动匹配 → confirm
    └── 其他：逐项 select（可跳过）

步骤 7: 服务保障 + 确认（summary.ts）
    ├── 选择发货地址（省/市/区，优先缓存）
    ├── 展示摘要
    └── confirm → api.upGoods(params)
```

#### Agent 模式：原子操作子命令

```
1. goods list --status wait        → 获取待上架商品列表
2. goods up info <id>              → 商品详情 + 店铺 + 地址 + prefill 建议值
3. goods up address --save ...     → （仅地址为 null 时）非交互式设置
4. goods up categories             → 获取分类树
5. goods up props <catId>          → 获取分类属性
6. goods up submit --data @file    → 提交上架
```

**submit 子命令**：
- `--data @file.json` 从文件读取 goodsDetail（排除 `price` 字段）
- flag 覆盖：`--price` / `--stuff` / `--desc` / `--title` / `--barcode` / `--goodsNo` / `--size`
- `--attrs @attrs.json` 属性列表
- `--services @services.json` 服务保障

### 5. 本地存储

三层存储，共享 `ConfigStore` 底层：

```
ConfigStore (config-store.ts)
    ├── ~/.r2-cli/config.json，原子写入（tmp + rename）
    ├── 内存缓存
    │
    ├── AuthStorage (auth-storage.ts)
    │   ├── saveCredentials / getCredentials / clearCredentials
    │   ├── isLoggedIn（带 TOKEN_EXPIRY_MARGIN_MS 安全边际）
    │   └── 构造函数接受可选 ConfigStore（可测试性）
    │
    └── BusinessStorage (business-storage.ts)
        ├── getShop / saveShop
        └── getAddress / saveAddress
```

### 6. AI 服务

```
MultiAIService (门面, ai/index.ts)
    └── AlibabaAIService (ai/alibaba.ts)
         ├── chat(messages, options)    → 非流式文本生成
         ├── stream(messages, options)  → AsyncGenerator<string> (SSE)
         └── listModels()
```

- API Key 从 `process.env.ALIBABA_API_KEY` 读取
- SSE 流式：ReadableStream + TextDecoder 逐行解析 `data:` 事件

### 7. 错误体系

```
R2Error (基类: code + details)
 ├── ApiError       (status + response)     — API 请求失败
 ├── AuthError                              — 认证过期 / 未登录
 ├── StorageError   (path + code)           — 文件读写失败
 ├── PollingError   (attempts + timeout)    — 轮询超时
 └── CliError       (command)               — 命令执行异常
```

命令层错误处理（`src/commands/shared.ts`）：
- **交互式命令**：`handleCommandError()` 按 `instanceof` 分发
- **Agent 子命令**：`agentAction<T>(fn)` 包装器，自动 catch → `{ success: false, error }` JSON
- **未实现命令**：`notImplemented(name)`

### 8. Skill 体系

Skill 随 npm 包发布，安装到 Claude Code：

| Skill | 触发词 | 职责 |
|-------|--------|------|
| **r2-auth** | 登录/login/auth/扫码/二维码 | 两步式扫码登录 + 闲鱼授权 |
| **r2-cli** | r2/r2-cli | 核心概览 |
| **r2-goods** | 上架/下架/商品/goods | 商品管理全流程 |

### 9. 共享工具

| 工具 | 文件 | 说明 |
|------|------|------|
| `poll()` | `utils/polling.ts` | 通用轮询（支持 AbortSignal + 超时） |
| `renderQRCode()` | `utils/qrcode.ts` | PNG + Unicode 半块字符渲染（login + xianyu-auth 共用） |
| `renderComponent()` | `utils/render.tsx` | React.createElement + renderOnce 封装 |
| `parseJsonArg()` | `utils/index.ts` | JSON 参数解析（支持 `@file.json` 从文件读取） |

## 构建系统

### 开发模式

```bash
npm run dev -- <command> [args]
# → spawn('tsx', ['src/entrypoints/r2-cli.tsx', ...args], { stdio: 'inherit' })
```

### 生产构建

```bash
npm run build          # NODE_ENV=development → 读取 .env
npm run build:prod     # NODE_ENV=production  → 读取 .env.production
```

**esbuild 配置要点**：
- 入口：`src/entrypoints/r2-cli.tsx` → 输出：`dist/r2-cli.js`
- 格式：ESM，platform：node
- `define`：构建时替换 `process.env.SERVER_BASEURL` 和 `process.env.NODE_ENV`
- 所有运行时依赖 externalize
- Windows EBUSY fallback：`cleanDist()` 逐文件删除
- 版本号读取：双路径 fallback（npm 安装后 + 开发模式）

### TypeScript 配置

- `module: "nodenext"` + `verbatimModuleSyntax: true` → 所有 import 使用 `.js` 扩展名
- `jsx: "react-jsx"` → 支持 TSX 文件
- `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns`
- JSON 导入使用 `import ... from "..." with { type: "json" }`

## 设计模式

| 模式 | 应用位置 | 说明 |
|------|---------|------|
| 工厂函数 | 所有 `createXxxCommand()` | 每个命令返回独立 `Command` 实例 |
| 导出函数 + 共享实例 | API modules | `const client = new X(); export function f() {}` |
| class + 单例 | `LoginService` | 有状态（storage），单例 `getLoginService()` |
| 门面 | `MultiAIService` | 统一多 AI 服务接口 |
| 双模命令 | `up` / `login` / `xianyu` | 交互式 + JSON 子命令 |
| 通用轮询 | `poll()` | 所有轮询场景共用 |
| 原子写入 | `ConfigStore` | tmp + rename 防丢失 |

## 技术栈

| 类别 | 技术 | 用途 |
|------|------|------|
| CLI 框架 | Commander.js 14 | 命令注册、参数解析 |
| 交互式 Prompt | @inquirer/prompts 8 | select / input / confirm |
| 终端样式 | chalk 5 | 彩色输出 |
| 进度指示 | ora 9 | Spinner 动画 |
| 终端 UI | React + Ink 4 | 结构化数据展示组件 |
| 二维码 | qrcode 1.5 | PNG + Unicode 半块字符 |
| HTTP 客户端 | 原生 fetch | API 请求（Node 18+） |
| AI | 阿里百炼 DashScope | qwen-turbo（SSE 流式） |
| 构建 | esbuild 0.28 | 打包、env 注入、tree-shaking |
| 运行时 | tsx (dev) / Node 18+ (prod) | TypeScript 执行 |

## 环境配置

| 文件 | 环境 | 用途 |
|------|------|------|
| `.env` | 开发 | `SERVER_BASEURL='https://api.qiuxietang.com'` |
| `.env.production` | 生产 | `SERVER_BASEURL='https://api.puresnake.com'` |
| `ALIBABA_API_KEY` | 通用 | 阿里百炼 AI 服务密钥（环境变量，不硬编码） |
