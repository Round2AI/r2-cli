# Changelog

## v1.0.15 (2026-05-14)

### 新增功能
- 图片自动压缩 + 并行上传（>2MB 自动压缩，PNG 转 JPEG，失败自动重试）
- 挂售两阶段提交 — 先提交基础信息，再补全属性减少失败
- listing 分页查询 + `--status sold` 已售出过滤
- 挂售汇总时提示运费默认包邮可修改
- 商家编码优先让用户自定义，不填则自动生成

### 问题修复
- `postinstall` 改用 `npx skills add` 全局安装技能
- 挂售提交补全遗漏的属性字段

### 优化
- 提取通用辅助函数（`validationError` / `jsonSuccess`），消除重复代码
- `UploadImagesResult` 类型移到 `types/goods.ts`
- 移除未使用的 `CliError` 类
- Skills / README 文档同步更新

---

## v1.0.14 (2026-05-12)

### 新增功能
- 商品信息修改命令 `goods edit` — 支持修改已上架商品的标题、描述、品牌、类目、图片、属性、成色
- `ListingTable` 组件 — 格式化展示上架列表

### 优化
- Skills 拆分 references/ 模式 — 独立文件管理各操作流程
- 路由决策修正 — 明确选品上架 vs 挂售上架的判断规则
- 售后默认值全关闭 — 避免 `ITEM_CONDITION_NOT_SUPPORT_SIGN` 错误
- 代码复用提取 — `agentError` / `jsonAction` 等共享函数标准化

---

## v1.0.13 (2026-05-11)

### 新增功能
- 挂售流程重构 — 图片优先，AI 读图自动识别商品信息
- 类目/属性/品牌查询命令 — `hang-up categories` / `props` / `brands`
- 新增 `itemAttrs` 支持 — 挂售时传递结构化属性
- 新增下架 `goods down` 和改价 `goods price` 命令
- 店铺/仓库/选品商品查询 — `goods shops` / `stocks` / `list`

### 优化
- jsonAction 统一错误处理，消除内联 try/catch
- API Client 共享实例，消除重复创建
- QR 服务器重构 — `openUrl` 移到 command 层，服务清理增强
- 技能精简，统一错误格式

---

## v1.0.12-beta.0 (2026-05-11)

- Skills 拆分 references/ 模式
- 售后默认值全关闭
- 路由决策修正

---

## v1.0.9-beta.0 (2026-05-09)

### 新增功能
- 扫码登录 — 支持第二回合 APP / 微信 / 支付宝扫码
- 闲鱼店铺授权
- 商品上架 `goods up` — 交互式 + Agent 模式，自动轮询上架结果
- AI Agent Skills 体系（r2-auth / r2-goods / r2-shared）

### 优化
- QR 页面品牌化重构 + 认证服务优化
- 架构全面重构 — Storage 层拆分、API 层简化、错误处理标准化
- Node.js 最佳实践审查修复
- Skills/README/CLAUDE.md 中文文档同步更新

### 技术基础
- Node.js + TypeScript + Commander CLI 框架
- 双模架构 — 交互式 + `--json` 参数（Agent 友好）
- QR 服务器 — 本地 HTTP + SSE 推送
- Ink（React for CLI）表格组件
- esbuild 构建系统，sharp 图片处理

---

## v1.0.8 (2026-05-09)

### 新增功能
- 店铺/仓库/选品商品查询 — `goods shops` / `stocks` / `list` / `listing`
- 下架 `goods down` 和改价 `goods price` 命令
- QR 服务器重构 — 启动逻辑简化，服务清理增强

### 优化
- 上架流程简化，命令逻辑收敛
- 技能精简，统一错误格式
- `agentAction` --json 模式修复

---

## v1.0.7 (2026-05-08)

### 新增功能
- 闲鱼店铺授权 — 扫码授权，支持 `--json` 模式
- QR 页面品牌化重构 — 品牌色 `#06d290`，实时状态更新

### 优化
- API 层简化 — 消除 `auth-client.ts`，认证逻辑内联到 `client.ts`
- Storage 层拆分 — `config-store.ts` + `auth-storage.ts` 独立职责
- API 模块重构，消除重复逻辑
- Skills / README 文档同步更新

---

## v1.0.6 (2026-04-28)

### 优化
- 全方位优化 — 目录重命名、终端 UI 美化（Ink 组件）、文档更新
- Node.js 最佳实践审查修复
- 代码审查整改 — 修复 17 个问题（P0-P3）

### 问题修复
- 修复 #17 #19 #22 #28 #29 共 5 个 issue

---

## v1.0.5 (2026-04-27)

### 新增功能
- 一键卸载 `r2-cli uninstall` — 清除 `~/.r2-cli/` + 全局包
- 版本检查 — 启动时异步检测更新

### 优化
- 架构拆分 — 命令统一命名为 `r2-cli`
- README 重写（飞书风格），新增 AI Agent 指南
- 移除 `fs-extra` 依赖，提取共享工具函数
- Ink 组件美化终端输出（圆角边框 + 表格）

---

## v1.0.4 (2026-04-23)

### 优化
- 系统架构文档重写，新增 `r2-auth` Skill 说明
- CLAUDE.md 改为中文，修正多处过时描述
- `itemBizType` 强制为 `"2"`（普通商品），移除商品类型选择器
- SKILL.md 同步更新匹配当前代码

---

## v1.0.3 (2026-04-22)

### 优化
- Skills 拆分 — `r2-cli`（认证/概览）+ `r2-goods`（商品管理/AI Agent 上架流程）
- `goods up` 分步执行子命令（AI Agent 模式）
- AI Agent 上架流程完善 — 交互式重构、店铺缓存、Agent 子命令增强
- 优化上架传参 — 改用 `--data` 传参、全量透传 `goodsDetail`

---

## v1.0.2 (2026-04-22)

### 新增功能
- 平台选择 — 交互式选择上架平台
- 二维码 PNG 生成 + Token 自动刷新
- Skills 体系支持 — 通过 `npx skills add` 安装

### 优化
- 命令 `xy` 更名为 `goods`
- 构建配置优化、目录结构调整
- dotenv 替换手写 `loadEnvFile`

---

## v1.0.1 (2026-04-21)

### 新增功能
- 闲鱼商品上架流程 — 交互式命令（选择店铺 → 选择商品 → 输入价格 → 确认上架）

### 优化
- CLI 架构重构，引入 React/Ink 渲染引擎和 AI 服务层
- API 客户端重构，构建时环境变量替换

---

## v1.0.0 (2026-04-07)

### 新增功能
- 项目初始化，CLI 命令框架搭建
- 扫码登录 — 支持第二回合 APP 扫码，Token 本地持久化存储（`~/.r2-cli/config.json`）
- 基础欢迎信息和帮助文档
