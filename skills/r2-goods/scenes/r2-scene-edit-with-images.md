# 带图片修改商品信息

用户提供了图片文件时，**Agent 自动完成所有步骤，用户只需确认**。

## 全自动流程

1. **展示列表**：`r2-cli goods listing --json` → 展示给用户选择要修改的商品
2. **上传图片**：`r2-cli goods hang-up upload-images --shop-id <shopId> --files <paths> --json`
3. **AI 读图识别**：Agent 用 Read 工具查看图片，识别品牌/类目/成色/描述/材质等
4. **自动匹配类目**：`r2-cli goods hang-up categories --json` → 根据识别结果匹配 catId + channelCatId
5. **自动查询属性**：`r2-cli goods hang-up props --channel-cat-id <id> --json` → 根据识别结果匹配成色/尺码/季节等
6. **自动搜索品牌**：`r2-cli goods hang-up brands --channel-cat-id <> --prop-id <> --key <品牌名> --json`
7. **汇总确认**：展示「当前值 vs 变更值」对比表，让用户确认

   ```
   ┌──────────┬──────────────────┬──────────────────┐
   │ 字段      │ 当前值            │ 变更值            │
   ├──────────┼──────────────────┼──────────────────┤
   │ 标题      │ Nike 运动鞋 白 42  │ Nike 运动鞋 黑 42  │
   │ 图片      │ img1.jpg          │ img1.jpg,img2.jpg │
   │ 成色      │ 95新              │ 全新               │
   │ 价格      │ ¥299（不改价）      │ —                 │
   └──────────┴──────────────────┴──────────────────┘
   ```
8. **提交**：

```bash
r2-cli goods edit \
  --id <goodsListingId> \
  --category-id <catId> --channel-cat-id <channelCatId> \
  --image-ids "id1,id2,id3" \
  --item-attrs '[{...品牌...},{...成色...},{...尺码...},{...季节...}]' \
  --brand-name "品牌名" \
  --json
```

## 约束

- `--category-id` 和 `--channel-cat-id` 后端必填，即使不改类目也要传当前值
- `--item-attrs` 必须包含 props 中所有属性，不只是修改的那一个
- `--image-ids` 保持字符串，不要转数字
- `--item-attrs` 传 JSON 字符串（`JSON.stringify()` 后）

## 参考

- [../references/r2-goods-listing.md](../references/r2-goods-listing.md) — edit 命令参数
- [../references/r2-goods-hangup.md](../references/r2-goods-hangup.md) — 图片上传和属性查询
