# r2-auth-status — 查看登录状态

## 命令

```bash
r2-cli auth status [--json]
```

## 输出

不传 `--json` 时输出人类可读状态信息。传 `--json` 时：

```json
{ "success": true, "data": { "loggedIn": true, "userInfo": { ... } } }
```

## 常见状态

| 状态 | 含义 | Agent 操作 |
|------|------|-----------|
| `loggedIn: true` | 已登录，Token 有效 | 可继续执行业务命令 |
| `loggedIn: false` | 未登录或 Token 过期 | 引导用户执行 `auth login --json` |

## 参考

- [../SKILL.md](../SKILL.md) — 认证命令
- [../../r2-shared/SKILL.md](../../r2-shared/SKILL.md) — Token Expiry Recovery
