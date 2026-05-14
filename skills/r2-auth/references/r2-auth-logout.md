# r2-auth-logout — 退出登录

## 命令

```bash
r2-cli auth logout [--json]
```

## 说明

清除本地存储的登录凭证（`~/.r2-cli/config.json`）。

**安全确认**：Agent 执行前必须先询问用户确认，不要静默执行。

## 输出

```json
{ "success": true, "message": "已退出登录" }
```

## 注意事项

- 退出后需要重新执行 `auth login --json` 才能继续操作
- 退出不会影响已上架的商品

## 参考

- [../SKILL.md](../SKILL.md) — 认证命令
- [r2-auth-login](r2-auth-login.md) — 重新登录流程
