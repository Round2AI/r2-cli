# 发布流程

`@round2ai/r2-cli` 的完整发布流程。支持两种方式：

1. **自动化发布**（推荐）— 推送 git tag 触发 GitHub Actions，自动构建 + 创建 GitHub Release
2. **手动发布** — 本地构建 + 手动上传 GitHub Release

---

## 方式一：自动化发布（推荐）

### 发布步骤

```bash
# ① 更新 package.json 版本号
#    将 "version": "1.0.15" → "1.0.16"

# ② 在 CHANGELOG.md 顶部添加新版本记录
#    ## v1.0.16 (2026-05-14)
#    ### 新增功能
#    - ... （参考已有格式）

# ③ 提交代码
git add package.json CHANGELOG.md
git commit -m "release: v1.0.16"

# ④ 推送代码到 GitHub
git push origin main

# ⑤ 打 tag 并推送（触发自动发布）
git tag v1.0.16
git push origin v1.0.16
```

推送 tag 后，GitHub Actions 自动执行：
1. `npm ci` 安装依赖
2. `npm run build:prod` 生产构建（读取 `.env.production`）
3. 打包 `dist/` 目录为 `r2-cli-dist.tar.gz`
4. 从 `CHANGELOG.md` 提取对应版本的发布说明
5. 创建 GitHub Release，附加 `r2-cli-dist.tar.gz` 和 `r2-cli.js`
6. 预发布版本（如 `v1.0.16-beta.0`）自动标记为 Pre-release

---

## 方式二：手动发布

没有 GitHub Actions 或需要手动控制时使用。

```bash
# ① 生产构建
npm run build:prod

# ② 打包构建产物
cd dist && tar -czf ../r2-cli-dist.tar.gz . && cd ..

# ③ 创建 git tag
git tag v1.0.16

# ④ 推送 tag
git push origin v1.0.16

# ⑤ 在 GitHub 创建 Release
#    https://github.com/Round2AI/r2-cli/releases/new
#    - 选择刚推送的 tag: v1.0.16
#    - 上传 r2-cli-dist.tar.gz 和 dist/r2-cli.js
#    - 从 CHANGELOG.md 复制发布说明
#    - 含 beta 的版本勾选 "Set as a pre-release"
```

---

## 版本号规则

| 变化 | 适用场景 | 示例 |
|------|----------|------|
| 第三位 +1 | Bug 修复、文档更新 | 1.0.15 → 1.0.16 |
| 第二位 +1 | 新功能、向后兼容 | 1.0.15 → 1.1.0 |
| 第一位 +1 | 破坏性变更 | 1.0.15 → 2.0.0 |
| 加 `-beta.N` | 测试版 | 1.0.16-beta.0 |

---

## 验证发布结果

```bash
# 确认 GitHub Release 已创建
# https://github.com/Round2AI/r2-cli/releases

# 本地安装验证
npm install -g @round2ai/r2-cli@latest
r2-cli -v
```

---

## 回滚

```bash
# 删除 GitHub Release（在网页上操作）
# 删除 git tag（本地 + 远程）
git tag -d v1.0.16
git push origin :refs/tags/v1.0.16
```
