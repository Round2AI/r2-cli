# 批量操作场景指南

## 适用场景

- 将同一商品上架到多个店铺
- 查询全部上架商品
- 批量下架/改价

## 分页策略

```bash
# 获取全部上架商品（分页遍历）
r2-cli goods listing --page 1 --size 50 --json
r2-cli goods listing --page 2 --size 50 --json
```

- 默认 `--size 50`（最大值），减少请求次数
- 用 `--status` 过滤特定状态的商品（up/down/sold）
- 用 `--shop-id` 限定店铺范围

## 跨店铺操作

```bash
# 查看所有店铺
r2-cli goods shops --json

# 切换到另一个店铺的库存
r2-cli goods list --stock-id <stockId> --json

# 上架到不同店铺
r2-cli goods up --stock-goods-id <id> --shop-id <shopA> --price <n> --json
r2-cli goods up --stock-goods-id <id> --shop-id <shopB> --price <n> --json
```

## 注意事项

- 每个操作独立执行，一个失败不影响其他
- 批量提交时间隔至少 1 秒
- Token 过期时停止工作流，重新登录后从断点继续

## 汇总展示格式

操作完成后，按以下格式展示结果：

```
批量上架完成！
✅ 成功：N 个商品
  - [商品名] → ¥[价格] → [店铺名]
  - [商品名] → ¥[价格] → [店铺名]
❌ 失败：N 个商品
  - [商品名] → 错误：[错误信息]
  - [商品名] → 错误：[错误信息]
```

## 友好输出指引

每个批量操作命令的 JSON 响应结构不同，Agent 统一按以下方式处理：

**批量上架**：每个 `goods up --json` 返回 `{ success, data: { listing: { id, goodsName, price, shopName, status } } }`。逐个提取，累积汇总。

**批量下架**：每个 `goods down --json` 返回 `{ success, data: "下架成功" }`。Agent 从流程参数中提取商品信息展示：
```
[1/2] Nike 运动鞋 → ✅ 已下架
[2/2] Adidas T恤 → ✅ 已下架
```

**批量改价**：每个 `goods price --json` 返回 `{ success, data: "修改成功" }`。从流程参数中提取信息展示：
```
[1/3] Nike 运动鞋 → ¥299 → ¥249 ✅
[2/3] Adidas T恤 → ¥199 → ¥149 ✅
```

> 即使某个操作失败（`success: false`），也不影响其他商品继续执行。每完成一个商品就反馈进度，全部完成后展示汇总。

## 参考

- [../SKILL.md](../SKILL.md) — 商品管理概览
- [../references/r2-goods-query.md](../references/r2-goods-query.md) — 查询命令
