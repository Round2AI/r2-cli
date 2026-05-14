---
name: r2-workflow-goods-audit
version: 1.0.0
description: "商品审核上架工作流。检查待上架商品的信息完整性后批量提交。触发词：审核上架、审核通过后上架、批量上架审核。"
metadata:
  requires:
    bins: ["r2-cli"]
  related:
    - "r2-shared"
    - "r2-auth"
    - "r2-goods"
---

# 商品审核上架工作流

**CRITICAL -- 开始前 MUST 先用 Read 工具读取 [../r2-shared/SKILL.md](../r2-shared/SKILL.md) 和 [../r2-auth/SKILL.md](../r2-auth/SKILL.md)，确保已登录并了解执行规则。商品命令详细用法见 [../r2-goods/SKILL.md](../r2-goods/SKILL.md)。**

## 适用场景

- "审核通过的商品可以上架了"
- "帮我检查一下这些商品信息有没有问题"

## 工作流

1. **查询待审核商品**：`r2-cli goods list --json`
2. **AI 校验信息完整性**：检查每个商品是否具备上架所需信息
3. **标记问题商品**：展示有问题的商品和具体缺失项

   ```
   商品完整性检查结果：
   ✅ [商品A] — 信息完整
   ❌ [商品B] — 缺少：价格、图片
   ❌ [商品C] — 缺少：类目
   ```
4. **用户确认**：用户确认后进入批量上架
5. **批量提交**：逐个执行 `goods up`

## 友好输出指引

**审核结果展示**：从 `goods list --json` 返回的 JSON 中提取每个商品的字段，逐一校验。展示时不展示原始 JSON，直接输出浓缩的审核结果：

```
正在审核 5 个商品...
─────────────────────
✅ 商品A — 信息完整
❌ 商品B — 缺少：价格、图片
   → 请补充 salePrice 和图片后再上架
❌ 商品C — 缺少：类目
   → 请分配类目后再上架
─────────────────────
结果：2 个通过，1 个缺项跳过（2 个无需处理）
```

**批量提交进度**：逐个执行 `goods up --json` 时，实时反馈进度：
```
正在上架通过审核的商品...
[1/2] 商品A → ✅ 成功（listing id: 12345）
[2/2] 商品D → ✅ 成功（listing id: 12346）
全部上架完成！
```

> `goods list --json` 返回 `{ success, data: { list: SelectGoodsItem[], pagination: { total, pageNum, pageSize } } }`。Agent 从 `data.list` 中遍历，检查每个商品的 `goodsName`（标题）、`salePrice`（价格 > 0）、`cate1Name/cate2Name/cate3Name`（类目）、`img`（图片）。
>
> 缺项商品标记后**跳过不上架**，只上架信息完整的商品。结束后汇总告知用户哪些商品因缺项被跳过。

## 完整性校验规则

| 检查项 | 要求 |
|--------|------|
| 标题 | 非空，包含品牌+款式+颜色+尺码 |
| 价格 | `salePrice > 0` |
| 类目 | 已分配有效类目 |
| 图片 | 至少 1 张 |

## 参考

- [r2-goods/SKILL.md](../r2-goods/SKILL.md) — 商品管理命令
- [r2-goods/scenes/r2-scene-batch-operations.md](../r2-goods/scenes/r2-scene-batch-operations.md) — 批量操作指南
- [r2-shared/SKILL.md](../r2-shared/SKILL.md) — 执行规则
