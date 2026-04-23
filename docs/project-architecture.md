# R2-CLI 系统架构文档

> 版本 1.0.3 | 更新于 2026-04-23

## 项目概述

R2-CLI 是 Round2AI 面向 AI Agent 开发者的命令行工具，将二手潮奢交易全链路能力以 CLI 命令和 Skill 形式开放。基于 TypeScript + ESM 开发，使用 Commander.js 管理命令、@inquirer/prompts 处理交互、esbuild 打包。

核心设计理念是**双模架构**：同一套业务逻辑同时服务人类用户（交互式向导）和 AI Agent（JSON 输出的原子操作子命令）。

## 目录结构

```
r2-cli/
├── src/
│   ├── entrypoints/
│   │   └── cli.tsx                # CLI 入口：Commander program 初始化
│   ├── commands/                  # 命令层（每个域一个目录）
│   │   ├── setup.ts               # 中央命令注册
│   │   ├── auth/
│   │   │   └── login.ts           # 认证：login / logout / status
│   │   ├── ai/
│   │   │   ├── chat.ts            # AI 聊天（占位）
│   │   │   └── skills.ts          # AI Skill 管理（占位）
│   │   ├── business/
│   │   │   ├── pricing.ts         # 定价分析（占位）
│   │   │   └── report.ts          # 经营报告（占位）
│   │   ├── goods/
│   │   │   ├── index.ts           # 商品命令组注册
│   │   │   ├── list.ts            # 列表：代售商品查询
│   │   │   ├── shops.ts           # 店铺：已授权店铺
│   │   │   ├── up.ts              # 上架：交互向导 + Agent 子命令(info/categories/props/submit/address)
│   │   │   ├── down.ts            # 下架：批量下架 / 重新上架（共享 createBatchCommand）
│   │   │   ├── price.ts           # 改价：更新售价
│   │   │   └── shared.ts          # 共享 handleCommandError()
│   │   └── inventory/
│   │       └── risk.ts            # 库存风险分析（占位）
│   ├── services/                  # 服务层
│   │   ├── api/
│   │   │   ├── api-client.interface.ts       # IApiClient / IQRCodeAuthApi / ApiResponse<T>
│   │   │   ├── api-client.service.ts         # 基础 HTTP 客户端（fetch）
│   │   │   ├── authenticated-client.service.ts  # 自动认证 + 401 刷新重试
│   │   │   └── index.ts                      # 统一导出
│   │   ├── storage/
│   │   │   ├── storage-service.interface.ts  # IStorageService / LocalConfig / StoredCredentials
│   │   │   └── index.ts                      # StorageService (~/.r2-cli/config.json)
│   │   ├── xy/
│   │   │   ├── xianyu-api.service.ts         # 闲鱼 API 封装（单例）
│   │   │   ├── up-flow.service.ts            # 上架 7 步交互向导
│   │   │   └── citys.json                    # 省市区地址数据
│   │   └── ai/
│   │       ├── alibaba.ts                    # 阿里百炼 DashScope（SSE 流式）
│   │       └── index.ts                      # MultiAIService 门面 + 单例
│   ├── types/
│   │   ├── auth.ts               # UserInfo / QRCodeStatus / AuthToken
│   │   ├── xianyu.ts             # XyShop / SellerGoodsItem / XyGoodsDetail / XyGoodsUpParams
│   │   └── index.ts
│   ├── errors/
│   │   └── index.ts              # R2Error 体系：ApiError / AuthError / StorageError / PollingError / CliError
│   └── utils/
│       ├── polling.ts            # 通用轮询 + sleep
│       └── index.ts
├── skills/                       # Claude Code Skill 定义（发布到 npm）
│   ├── r2-auth/SKILL.md          # 认证专家：两步式扫码登录
│   ├── r2-cli/SKILL.md           # 核心概览：认证 + 基本操作
│   └── r2-goods/SKILL.md         # 商品专家：上架/下架/改价 + AI Agent 分步流程
├── .claude/skills/               # Claude Code 预装 Skill
│   ├── cli-developer-0.1.0/      # CLI 开发参考模式
│   └── nodejs-1.0.1/             # Node.js 最佳实践
├── scripts/
│   ├── build.js                  # esbuild 构建（env 注入 / shebang / externalize）
│   └── dev.js                    # tsx 开发模式（TTY 继承）
├── docs/                         # 文档
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
│  ┌──────────┐  ┌──────────────────┐  ┌───────┐  ┌────────────┐  │
│  │ auth/    │  │ goods/           │  │ ai/   │  │ business/  │  │
│  │ login    │  │ up (向导+子命令) │  │ chat  │  │ pricing    │  │
│  │ logout   │  │ down / reup     │  │ skills│  │ report     │  │
│  │ status   │  │ list / shops    │  │       │  │            │  │
│  │          │  │ price           │  │       │  │            │  │
│  └────┬─────┘  └───────┬────────┘  └───┬───┘  └─────┬──────┘  │
│       │                │               │             │          │
└───────┼────────────────┼───────────────┼─────────────┼──────────┘
        │                │               │             │
        ▼                ▼               ▼             ▼
┌──────────────────────────────────────────────────────────────────┐
│  服务层 (src/services/)                                           │
│                                                                   │
│  ┌────────────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Authenticated      │  │ Storage      │  │ AI               │ │
│  │ ApiClient          │  │ Service      │  │ Service          │ │
│  │                    │  │              │  │                  │ │
│  │ • 自动加载 token    │  │ • 凭证读写   │  │ • Alibaba AI     │ │
│  │ • 401 自动刷新重试  │  │ • 地址缓存   │  │ • SSE 流式       │ │
│  │ • 刷新失败清凭证   │  │ • 店铺缓存   │  │ • 多模型支持     │ │
│  └────────┬───────────┘  └──────────────┘  └───────┬──────────┘ │
│           │                                        │            │
│  ┌────────┴───────────┐                  ┌─────────┴──────────┐ │
│  │ ApiClient          │                  │ DashScope API      │ │
│  │ Service            │                  │ (阿里百炼)          │ │
│  │ • fetch 封装       │                  └────────────────────┘ │ │
│  │ • 响应解包         │                                         │
│  │ • 统一错误处理     │                  ┌────────────────────┐ │ │
│  └────────┬───────────┘                  │ 本地存储            │ │
│           │                              │ ~/.r2-cli/         │ │
│           ▼                              │ config.json        │ │
│  ┌──────────────────────────────────┐    └────────────────────┘ │
│  │ R2 API                           │                            │
│  │ api.qiuxietang.com / puresnake.com                           │
│  └──────────────────────────────────┘                            │
└──────────────────────────────────────────────────────────────────┘
```

## 核心模块详解

### 1. 入口与命令注册

**入口** `src/entrypoints/cli.tsx`：
- 创建 Commander `program`，设置 name (`r2`)、version（从 package.json 读取）
- 配置 `configureOutput` 用 chalk 格式化错误输出
- 无子命令时显示 figlet ASCII 欢迎信息 + help
- 注册 `SIGINT` 优雅退出（exit code 130）

**命令注册** `src/commands/setup.ts`：
- `setupCommands(program)` 将所有域命令挂载到 program
- 每个域命令通过工厂函数 `createXxxCommand()` 返回 `Command` 实例
- 未实现命令统一使用 `notImplemented()` 占位提示

**命令层级**：

```
r2
├── auth
│   ├── login          # 扫码登录（人类一键 / Agent 两步式）
│   ├── logout         # 退出登录
│   └── status         # 查看登录状态
├── goods
│   ├── shops          # 查看已授权店铺（-p xianyu/douyin）
│   ├── list           # 代售商品列表（--status/--keyword/--page）
│   ├── up             # 交互式上架向导（7步）
│   │   ├── info <id>  #   商品详情 + 店铺 + 地址 + prefill (JSON)
│   │   ├── categories #   类目树 (JSON)
│   │   ├── props <id> #   类目属性 + 品牌搜索 (JSON)
│   │   ├── submit     #   直接提交上架 (--data @file.json)
│   │   └── address    #   发货地址（非交互式 --provinces/--cities/--areas/--save）
│   ├── down <ids...>  # 批量下架
│   ├── reup <ids...>  # 批量重新上架
│   └── price <id>     # 修改售价 (--price)
├── ai
│   ├── chat           # AI 对话
│   └── skills         # Skill 列表
├── report
│   └── generate       # 经营报告
├── pricing
│   └── analyze        # 定价分析
├── inventory
│   └── risk           # 库存风险
├── ingest             # (占位) ERP 对接
├── ask                # (占位) 自然语言查询
├── demand             # (占位) 市场需求
├── fulfillment        # (占位) 履约追踪
├── simulate           # (占位) 竞价模拟
├── bidding-strategy   # (占位) 竞价策略
├── decide             # (占位) 经营决策
├── chat               # AI 聊天（快捷方式）
└── agent              # AI Agent 集成信息
```

### 2. API 客户端体系

三层架构，每层职责清晰：

```
ApiClientService (基础层 — HTTP)
    │
    │  职责：
    │  • 原生 fetch 封装 GET/POST/PUT/DELETE
    │  • 请求头注入 token（headers.token）
    │  • URL 构建：baseUrl + /v3/ + path
    │  • 响应解包：{ success, status, data, msg } → 提取 data
    │  • 错误映射：HTTP 401 → AuthError, 其他 → ApiError
    │  • refreshToken() 独立方法，不经 handleResponse 避免循环
    │  • Base URL 构建时注入（esbuild define）
    │
    ▼
AuthenticatedApiClient (认证层 — Token 生命周期)
    │
    │  职责：
    │  • ensureAuthenticated(): 从 StorageService 加载 token
    │  • withAuthRefresh<T>(): 所有请求的包装器
    │    → 正常请求
    │    → 401(AuthError) → refreshToken(oldToken) → 更新 Storage → 重试
    │    → 刷新也失败 → clearCredentials() → 抛出 AuthError
    │  • 防并发刷新（isRefreshing 标志）
    │
    ▼
XianyuApiService (业务层 — 闲鱼 API)
       • 闲鱼平台全部 API 封装，单例模式 getXianyuApi()
       • getShops(platform) / getSellerGoodsList(params)
       • getXyGoodsInfo(goodsInfoId, xyShopId)
       • getCategories(spBizType) / getProps(channelCatId)
       • getPropValues(channelCatId, propId, key?)
       • upGoods(params) / batchDown(ids) / batchReUp(ids)
       • updatePrice(id, price)
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

**Base URL**：构建时由 esbuild `define` 注入 `process.env.R2_API_URL`。
- 开发环境：`https://api.qiuxietang.com`
- 生产环境：`https://api.puresnake.com`

### 3. 认证流程

支持两种模式：**人类一键登录** 和 **AI Agent 两步式登录**。

```
r2 auth login（人类模式）
    │
    ▼
LoginService.login()
    │
    ├── 1. authApi.generateQRCode()
    │      → { qrToken, qrContent, expireTime, pollInterval }
    │
    ├── 2. displayQRCode()
    │      ├── 生成 PNG → ~/.r2-cli/qrcode.png
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
    │      → 写入 ~/.r2-cli/config.json
    │
    └── 5. 显示用户信息（昵称、脱敏手机号）
```

**Agent 两步式登录**（r2-auth Skill）：

```
第1步：r2 auth login qr
    → JSON 输出 { qrToken, unicodeQR, expireTimeMs, pollIntervalMs }
    → Agent 将 unicodeQR 直接输出到聊天窗口

第2步：r2 auth login poll --token <qrToken> --expire <ms> --interval <ms>
    → 后台轮询（run_in_background: true）
    → JSON 输出 { success, userInfo, token } 或 { success: false, error }
```

**Token 生命周期**：

```
登录 → token 存入 Storage
  → API 请求自动携带 token（headers.token）
  → 401 → refreshToken(oldToken) → 更新 Storage → 重试原请求
  → 刷新也失败 → 清除凭证 → 提示 r2 auth login
```

### 4. 上架流程 (Up Flow) — 双模架构

`up.ts` 命令同时支持两种调用方式，共享同一个 API 服务层。

#### 人类模式：交互式 7 步向导

`UpFlowService`（`up-flow.service.ts`）提供完整交互流程：

```
步骤 0: 店铺选择（缓存优先）
    ├── Storage 缓存命中 → confirm 使用缓存
    └── 缓存未命中 → 选择平台(闲鱼/抖音) → 选择店铺 → 缓存

步骤 1: 选择商品
    └── 分页加载 status=wait 商品 → inquirer select

步骤 2: 选择成色
    └── ITEM_BIZ_TYPES(普通商品=2) + STUFF_LABELS(全新/准新/99新/95新/9新)

步骤 3: 商品描述
    └── 默认值取 goodsDetail.desc

步骤 4: 选择类目
    └── API 加载类目 → 按主类目分组 → 先选主类目再选子分类

步骤 5: 售价
    └── 默认值取 goodsDetail.reservePrice

步骤 6: 选择属性
    ├── 品牌：优先 API 搜索自动匹配 → confirm 或手动搜索
    ├── 尺码/鞋码：自动匹配 detail.size → confirm
    ├── 成色：自动匹配 → confirm
    └── 其他：逐项 select（可跳过）

步骤 7: 服务保障 + 确认
    ├── 选择发货地址（省/市/区，优先缓存）
    ├── 普通商品(itemBizType=2)跳过服务保障
    ├── 非普通商品：checkbox(24h发货/48h发货/描述不符包退/七天无理由)
    ├── 展示摘要
    └── confirm → api.upGoods(params)
```

#### Agent 模式：原子操作子命令

Agent 无法操作交互式选择器，因此使用 JSON 输出的子命令逐步执行：

```
1. goods list --status wait        → 获取待上架商品列表
2. goods up info <id>              → 获取商品详情 + 店铺 + 地址 + prefill 建议值
3. goods up address --save ...     → （仅地址为 null 时）非交互式设置发货地址
4. goods up categories             → 获取分类树
5. goods up props <catId> --brand  → 获取分类属性 + 品牌搜索匹配
6. goods up submit --data @file    → 提交上架
```

**info 子命令** 输出结构：

```json
{
  "shops": [{ "name": "...", "thirdUserId": "...", "expired": false }],
  "selectedShop": { "name": "...", "thirdUserId": "..." },
  "goodsDetail": { "goodsInfoId": "...", "account": "...", "...": "..." },
  "prefill": {
    "stuffStatus": "100",
    "reservePrice": "599",
    "desc": "...",
    "brandName": "Nike",
    "size": "42"
  },
  "address": { "divisionId": "...", "province": "...", "city": "...", "area": "..." } | null
}
```

**submit 子命令** 参数设计：

```bash
r2 goods up submit \
  --data @detail.json       # goodsDetail 全量透传（排除 price）
  --division-id <id>        # 发货地区 ID
  --cat-id <catId>          # 主类目 ID
  --channel-cat-id <id>     # 子类目 ID
  --price <amount>          # 覆盖售价
  --stuff <status>          # 覆盖成色
  --desc <text>             # 覆盖描述
  --attrs @attrs.json       # 属性列表
  --services @services.json # 服务保障
```

- `--data` 支持 `@file.json` 从文件读取或直接传 JSON 字符串
- 从 goodsDetail 中排除 `price` 字段，仅使用 `reservePrice` 和 `originalPrice`
- goodsDetail 中的全量字段（goodsInfoId、account、imageList、spBizType 等）透传给上架接口

**address 子命令** 支持非交互式：

```bash
r2 goods up address --provinces              # 列出省份
r2 goods up address --cities <省>             # 列出城市
r2 goods up address --areas <市> --province <省>  # 列出地区
r2 goods up address --save --province <省> --city <市> --area-code <code>
```

### 5. 本地存储

`StorageService` 管理 `~/.r2-cli/config.json`：

```typescript
interface LocalConfig {
  credentials: StoredCredentials | null  // token + userInfo + timestamp + expire
  address?: StoredAddress               // divisionId + province + city + area
  shop?: StoredShop                     // thirdUserId + name + platform
}
```

| 缓存项 | 写入时机 | 读取时机 |
|--------|---------|---------|
| credentials | login 成功 / token 刷新 | API 请求自动加载 / status 查看 |
| address | 上架流程选地址 / address --save | info 子命令返回 / 上架流程复用 |
| shop | 上架流程选店铺 | info 子命令自动选择 / 上架流程复用 |

### 6. AI 服务

```
MultiAIService (门面)
    └── AlibabaAIService (阿里百炼 DashScope)
         ├── chat(messages, options)    → 非流式文本生成
         ├── stream(messages, options)  → AsyncGenerator<string> (SSE)
         └── listModels()
```

- API Key 从 `process.env.ALIBABA_API_KEY` 读取
- 默认模型 `qwen-turbo`，可通过 options.model 覆盖
- SSE 流式：ReadableStream + TextDecoder 逐行解析 `data:` 事件
- 接口定义：`ChatMessage { role, content }` + `ChatOptions { temperature, maxTokens, model }`

### 7. 错误体系

```
R2Error (基类: code + details)
 ├── ApiError       (status + response)     — API 请求失败 / 业务状态码非 0
 ├── AuthError                              — 认证过期 / 未登录 / token 刷新失败
 ├── StorageError   (path + code)           — 文件读写失败（ENOENT 等）
 ├── PollingError   (attempts + timeout)    — 轮询超时
 └── CliError       (command)               — 命令执行异常
```

`src/commands/goods/shared.ts` 中的 `handleCommandError()` 按类型分发：
- `AuthError` → 提示 `请先运行 r2 auth login`
- `ApiError` → 显示错误消息 + HTTP 状态码
- 其他 → 显示通用错误信息

### 8. Skill 体系

Skill 是面向 Claude Code 的能力描述文件，定义在 `skills/` 目录下，随 npm 包发布（`package.json.files` 包含 `.claude/skills/`）。

| Skill | 触发词 | 职责 |
|-------|--------|------|
| **r2-auth** | 登录/login/auth/扫码/二维码 | 两步式扫码登录，专为 Agent 设计 |
| **r2-cli** | r2/r2-cli/登录/login/auth | 核心概览，认证 + 基本操作入口 |
| **r2-goods** | 上架/下架/商品列表/改价/goods/商品/寄售 | 商品管理全流程，含 Agent 分步上架 |

**Skill 与命令的对应关系**：

```
r2-auth  → auth login qr / auth login poll / auth status / auth logout
r2-cli   → auth * + goods shops/list/up/down/reup/price（概览）
r2-goods → goods *（详细用法，交互式向导 + Agent 分步流程）
```

## 构建系统

### 开发模式

```bash
npm run dev -- <command> [args]
# → node scripts/dev.js
# → spawn('tsx', ['src/entrypoints/cli.tsx', ...args], { stdio: 'inherit' })
# TTY 直传，支持交互式 prompt
```

### 生产构建

```bash
npm run build        # NODE_ENV=development → 读取 .env
npm run build:prod   # NODE_ENV=production  → 读取 .env.production
```

**esbuild 配置要点**：
- 入口：`src/entrypoints/cli.tsx` → 输出：`dist/cli.js`
- 格式：ESM，platform：node
- `define`：构建时替换 `process.env.R2_API_URL` 和 `process.env.NODE_ENV`
- 所有运行时依赖（commander, chalk, inquirer, react, ink 等）externalize
- CLI 输出添加 `#!/usr/bin/env node` shebang
- 复制 `package.json` 和 `README.md` 到 dist/

### TypeScript 配置

- `module: "nodenext"` + `verbatimModuleSyntax: true` → 所有 import 使用 `.js` 扩展名
- `jsx: "react-jsx"` → 支持 TSX 文件
- `strict: true`
- JSON 导入使用 `import ... from "..." with { type: "json" }`（被 esbuild 内联打包）

## 数据流

### 典型请求流程（以 `goods list` 为例）

```
用户输入: r2 goods list --status wait
    │
    ▼ Commander 解析
createListCommand().action()
    │
    ▼
getXianyuApi() → XianyuApiService.getSellerGoodsList({ status: "wait" })
    │
    ▼
AuthenticatedApiClient.get()
    │
    ├── ensureAuthenticated() → StorageService.getToken()
    │   └── token 不存在 → throw AuthError → handleCommandError → 提示登录
    │
    ▼
ApiClientService.get() → fetch(baseUrl/v3/mms/seller/goods/info/list?status=wait)
    │
    ▼ handleResponse()
    ├── 200 + success=true → return data.items
    ├── 401 → throw AuthError → withAuthRefresh → refreshToken → 重试
    └── 其他 → throw ApiError(msg, status)
    │
    ▼
格式化表格输出到终端
```

### Agent 上架完整流程

```
Agent 调用链：

1. goods list --status wait
   → 表格 → Agent 选择 goodsInfoId

2. goods up info <id>
   → { shops, selectedShop, goodsDetail, prefill, address }
   → Agent 分析 prefill，决定各字段值

3. goods up address --save ... (仅 address=null 时)
   → { saved: { divisionId, province, city, area } }

4. goods up categories
   → [{ catId, catName, children: [{ channel, channelCatId }] }]
   → Agent 选择 catId + channelCatId

5. goods up props <channelCatId> --brand <keyword>
   → [{ propId, propName, propsValues, matched? }]
   → Agent 选择属性值，构建 itemAttrList

6. goods up submit --data @detail.json --division-id ... --cat-id ... --attrs @attrs.json
   → { success: true, result: "..." }
```

### 错误处理流程

```
Command Action
    │
    try {
      // 业务逻辑
    } catch (error) {
      handleCommandError(error)
        │
        ├── AuthError  → console.error("请先运行 r2 auth login")
        ├── ApiError   → console.error(msg + status)
        └── Error      → console.error(message)
    }
```

## 技术栈

| 类别 | 技术 | 用途 |
|------|------|------|
| CLI 框架 | Commander.js 14 | 命令注册、参数解析、help 生成 |
| 交互式 Prompt | @inquirer/prompts 8 | select / input / confirm / checkbox |
| 终端样式 | chalk 5 | 彩色输出 |
| 进度指示 | ora 9 | Spinner 动画 |
| ASCII 艺术 | figlet 1 | 欢迎信息大字 |
| 二维码 | qrcode 1.5 | PNG 生成 + Unicode 半块字符渲染 |
| HTTP 客户端 | 原生 fetch | API 请求（Node 18+ 内置） |
| AI | 阿里百炼 DashScope | qwen-turbo 文本生成（SSE 流式） |
| 构建 | esbuild 0.28 | 打包、env 注入、tree-shaking |
| 运行时 | tsx (dev) / Node 18+ (prod) | TypeScript 执行 |
| 文件操作 | fs-extra 11 | 配置文件读写 |

## 环境配置

| 文件 | 环境 | 用途 |
|------|------|------|
| `.env` | 开发 | `SERVER_BASEURL='https://api.qiuxietang.com'` |
| `.env.production` | 生产 | `SERVER_BASEURL='https://api.puresnake.com'` |
| `ALIBABA_API_KEY` | 通用 | 阿里百炼 AI 服务密钥（不硬编码） |

## 设计模式

| 模式 | 应用位置 | 说明 |
|------|---------|------|
| 工厂函数 | 所有 `createXxxCommand()` | 每个命令返回独立 `Command` 实例，解耦注册与实现 |
| 单例 | `getXianyuApi()`, `aiService` | 避免重复创建 API 客户端和连接 |
| 门面 | `MultiAIService` | 统一多 AI 服务接口 |
| 装饰器/包装 | `AuthenticatedApiClient` | 在基础客户端上透明增加认证逻辑 |
| 策略 | `handleCommandError()` | 按错误类型分发处理逻辑 |
| 模板方法 | `UpFlowService.run()` | 固定 7 步流程，每步可被子命令参数跳过 |
| 双模命令 | `up.ts` (交互式 + 子命令) | 同一业务逻辑服务于人类和 Agent |

## 业务约束

| 约束 | 说明 |
|------|------|
| price 排除 | 构建 XyGoodsUpParams 时解构排除 `price`，仅使用 `reservePrice` 和 `originalPrice` |
| 商品类型 | 目前仅支持普通商品（itemBizType=2），严选商品暂不支持 |
| JSON 传参 | Windows 下 JSON 参数建议用 `@file.json` 方式传递，避免 shell 转义问题 |
| Token 刷新 | 防并发（isRefreshing 标志），刷新失败才清除凭证 |
