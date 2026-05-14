# r2-auth-login — 扫码登录 / 闲鱼授权

## `auth login --json` — 扫码登录

```bash
r2-cli auth login --json
```

**两段 JSON 输出：**

第 1 段（立即输出，二维码信息）：

| 字段 | 说明 |
|------|------|
| `qrToken` | 二维码 token（内置轮询使用） |
| `expireTimeMs` | 二维码过期时间（毫秒），默认 5 分钟 |
| `qrUrl` | 本地扫码页面链接，需展示给用户 |
| `pollIntervalMs` | 轮询间隔（毫秒） |

第 2 段（用户扫码后输出）：

```json
{ "success": true, "userInfo": { "nickname": "...", "mobile": "..." } }
```

## `auth xianyu --json` — 闲鱼店铺授权

```bash
r2-cli auth xianyu --json
```

第 1 段（立即输出）：

| 字段 | 说明 |
|------|------|
| `state` | 授权状态 token |
| `expireTimeMs` | 过期时间，默认 5 分钟 |
| `qrUrl` | 本地授权页面链接 |
| `pollIntervalMs` | 轮询间隔（毫秒） |

第 2 段（用户扫码后输出）：

```json
{ "success": true, "shopId": "...", "shopName": "..." }
```

## 手动轮询（不推荐）

`auth login` 和 `auth xianyu` 的 `--json` 模式已内置自动轮询，通常不需要手动调用 poll 命令。仅在命令中断需要恢复时使用：

```bash
r2-cli auth login poll --token <qrToken>
r2-cli auth xianyu poll --state <state>
```

## 错误处理

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `二维码已过期` | 扫码超时（5 分钟） | 重新执行命令 |
| `授权链接已过期` | 授权扫码超时（5 分钟） | 重新执行命令 |
| `网络连接失败` | API 服务不可达 | 检查网络连接，确认 SERVER_BASEURL 配置 |
| `请先运行 r2-cli auth login 登录` | Token 过期或未登录 | 执行 `r2-cli auth login --json` |

## 参考

- [../SKILL.md](../SKILL.md) — 认证命令完整流程
- [../../r2-shared/SKILL.md](../../r2-shared/SKILL.md) — 执行规则和错误格式
