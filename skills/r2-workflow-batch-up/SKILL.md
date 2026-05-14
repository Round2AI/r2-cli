---
name: r2-workflow-batch-up
version: 1.0.0
description: "批量上架工作流。将选品库中多个商品批量上架到闲鱼，支持同商品多店铺上架。触发词：批量上架、全部上架、都上架。"
metadata:
  requires:
    bins: ["r2-cli"]
  related:
    - "r2-shared"
    - "r2-auth"
    - "r2-goods"
---

# 批量上架工作流

**CRITICAL -- 开始前 MUST 先用 Read 工具读取 [../r2-shared/SKILL.md](../r2-shared/SKILL.md) 和 [../r2-auth/SKILL.md](../r2-auth/SKILL.md)，确保已登录并了解执行规则。商品命令详细用法见 [../r2-goods/SKILL.md](../r2-goods/SKILL.md)。**

## 适用场景

- "帮我把这些商品都上架"
- "选品库全部上架到店铺"
- "这几件都上架了吧"

## 工作流

1. **确认店铺**：`r2-cli goods shops --json` → 展示店铺让用户选择
2. **确认仓库**：`r2-cli goods stocks --json` → 用户选择仓库
3. **展示待上架商品**：`r2-cli goods list --stock-id <id> --json`
4. **用户选择要上架的商品**（可多选）
5. **逐商品询问价格** → 逐个执行 `goods up`
6. **汇总结果展示**

   ```
   批量上架结果：
   ✅ [商品A] → ¥[价格] → 成功（listing id: [id]）
   ✅ [商品B] → ¥[价格] → 成功（listing id: [id]）
   ❌ [商品C] → 失败：[错误原因]
   ```

## 友好输出指引

批量上架过程中，每个商品独立执行 `goods up --json`，Agent 需要逐个处理响应：

**每上架一个商品，及时反馈进度**：
```
[1/3] Nike 运动鞋 → 上架中...
[1/3] Nike 运动鞋 → ✅ 成功（id: 12345）
[2/3] Adidas T恤 → 上架中...
[2/3] Adidas T恤 → ❌ 失败：商家编码重复
...
```

**全部完成后展示汇总**：
```
批量上架完成！
✅ 成功：2 个商品
  - Nike 运动鞋 → ¥299 → 店铺A（id: 12345）
  - LV 包 → ¥9999 → 店铺B（id: 12346）
❌ 失败：1 个商品
  - Adidas T恤 → 错误：商家编码重复
```

> 每个 `goods up --json` 返回 `{ success, data: { listing: { id, goodsName, price, shopName, status } } }`。Agent 从每个响应中提取 `success` 和 `data.listing` 字段，累加后汇总展示。
>
> 中途 Token 过期时：停止工作流，告知用户已完成的商品数，引导重新登录后从断点继续。**不要丢弃已完成的结果**。

## 规则

- **每个商品独立提交**：一个失败不影响其他商品
- **批量上架间隔至少 1 秒**，避免触发限流
- **中途 Token 过期**：停止工作流，引导重新登录后从当前商品继续
- **提交失败 ≠ 已下架**：可能只是轮询超时，稍后用 `goods listing` 确认

## 参考

- [r2-goods/SKILL.md](../r2-goods/SKILL.md) — goods up 详细参数
- [r2-shared/SKILL.md](../r2-shared/SKILL.md) — 执行规则、Token Expiry Recovery
