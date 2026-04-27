# npm 发布指南

`@round2ai/r2-cli` 的完整发布流程。

> **核心原则**：先构建 → 再验证 → 后发布。绝不直接 `npm publish`。

## 前置条件

```bash
node -v                          # Node >= 18
npm login                        # 需 round2ai 组织的 publish 权限
npm whoami                       # 确认登录身份 → 输出你的 npm 用户名
```

---

## 场景速查

| 场景 | 命令 |
|------|------|
| 发 Bug 修复版 | `npm version patch -m "release: v%s"` |
| 发新功能版 | `npm version minor -m "release: v%s"` |
| 发破坏性变更版 | `npm version major -m "release: v%s"` |
| 发 Beta 测试版 | `npm version prerelease --preid=beta -m "release: v%s"` |

以上命令都会自动：修改 `package.json` 版本号 → 创建 git commit → 创建 git tag。

---

## 场景一：发正式版（最常用）

从 v1.0.7 升级到 v1.0.8 的完整过程：

```bash
# ① 升级版本号（package.json: 1.0.7 → 1.0.8）
npm version patch -m "release: v%s"

# ② 生产构建（minified，读取 .env.production）
npm run build:prod

# ③ 预览打包内容（不实际上传，确认无误）
npm publish --dry-run --access public

# ④ 正式发布
npm publish --access public

# ⑤ 推送到远程（npm version 已自动创建 commit + tag）
git push && git push --tags

# ⑥ 验证
npm view @round2ai/r2-cli version     # 输出: 1.0.8
npm install -g @round2ai/r2-cli@latest
r2-cli -v                              # 输出: 1.0.8
```

### 版本号规则

| 命令 | 变化 | 适用场景 | 示例 |
|------|------|----------|------|
| `npm version patch` | 第三位 +1 | Bug 修复、文档更新 | 1.0.7 → 1.0.8 |
| `npm version minor` | 第二位 +1 | 新功能、向后兼容 | 1.0.7 → 1.1.0 |
| `npm version major` | 第一位 +1 | 破坏性变更 | 1.0.7 → 2.0.0 |

---

## 场景二：发 Beta 测试版

从 v1.0.7 开始发 beta，测试完毕后转正式版：

```bash
# ── 创建第一个 beta ──

# ① 1.0.7 → 1.0.8-beta.0
npm version prerelease --preid=beta -m "release: v%s"

# ② 构建 + 发布
npm run build:prod
npm publish --access public --tag beta
git push && git push --tags

# 用户安装 beta:
# npm install -g @round2ai/r2-cli@beta

# ── 继续修 bug，发第二个 beta ──

# ① 1.0.8-beta.0 → 1.0.8-beta.1（自动递增）
npm version prerelease --preid=beta -m "release: v%s"
npm run build:prod
npm publish --access public --tag beta
git push && git push --tags

# ── 测试通过，转正式版 ──

# ① 1.0.8-beta.1 → 1.0.8（去掉 beta 后缀）
npm version patch -m "release: v%s"
npm run build:prod
npm publish --access public              # 默认上 latest tag
git push && git push --tags
```

### tag 说明

| tag | 含义 | 用户安装命令 |
|-----|------|-------------|
| `latest`（默认） | 正式稳定版 | `npm install -g @round2ai/r2-cli` |
| `beta` | 测试版 | `npm install -g @round2ai/r2-cli@beta` |

---

## 场景三：本地测试后再发布

改动代码后，先本地验证再发：

```bash
# ① 构建
npm run build:prod

# ② 本地链接测试
npm link
r2-cli -v                    # 确认版本号
r2-cli goods list            # 测试核心功能

# ③ 测试完毕，取消链接
npm unlink -g @round2ai/r2-cli

# ④ 确认无误，再走正式发布流程
```

---

## 场景四：回滚有问题的版本

```bash
# 标记废弃（推荐，不影响已安装用户，安装时会有警告）
npm deprecate @round2ai/r2-cli@1.0.8 "存在上架 Bug，请升级到 1.0.9"

# 删除版本（发布 72 小时内可用，删除后该版本不可安装）
npm unpublish @round2ai/r2-cli@1.0.8

# 删除整个包（极端情况，所有版本都删除）
npm unpublish @round2ai/r2-cli --force
```

---

## 构建产物说明

| 文件 | 来源 | 说明 |
|------|------|------|
| `dist/r2-cli.js` | esbuild 打包 | CLI 入口，首行 `#!/usr/bin/env node` |
| `dist/package.json` | 根目录复制 | 包含版本号、bin、dependencies |
| `dist/README.md` | 根目录复制 | npm 包展示页 |
| `skills/` | 原样包含 | 3 个 AI Agent Skill 文件 |

### 打包内容验证

```bash
npm pack --dry-run
```

检查清单：
- [ ] `dist/r2-cli.js` 首行是 `#!/usr/bin/env node`
- [ ] `skills/` 包含 `r2-auth/`、`r2-cli/`、`r2-goods/` 三个目录
- [ ] 无 `.env`、`.env.production` 等敏感文件

---

## 常见问题

### 发布时 403 Forbidden

```bash
npm whoami                    # 确认登录身份
# 输出应该是你的 npm 用户名
# 如果是 403，检查:
# 1. 账号是否在 round2ai 组织中
# 2. 是否有 publish 权限
# 3. 开了 2FA 的话: npm publish --access public --otp=123456
```

### 包含了不该有的文件

检查 `package.json` 的 `files` 字段，或添加 `.npmignore` 排除。

### 安装后 `r2-cli` 命令找不到

- 确认 `package.json` 有 `bin` 字段：`"r2-cli": "./dist/r2-cli.js"`
- 确认 `dist/r2-cli.js` 首行有 `#!/usr/bin/env node`
- Windows 用户重新打开终端

### npmmirror 同步延迟

国内用户可能看到旧版本，手动触发同步：

```bash
curl https://registry.npmmirror.com/-/package/@round2ai/r2-cli syncs
```

### `-m "release: v%s"` 是什么

`-m` 指定 commit message，`%s` 是 npm 占位符自动替换为版本号。

```bash
npm version patch -m "release: v%s"
# git commit message: "release: v1.0.8"
# git tag: "v1.0.8"

# 也可以不指定 -m，默认 message 就是版本号 "1.0.8"
npm version patch
```
