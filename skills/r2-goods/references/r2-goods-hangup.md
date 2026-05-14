# R2-Goods 闲鱼挂售（hang-up）

> **Prerequisite:** 读取 [`../SKILL.md`](../SKILL.md) 了解路由决策和命令概览。

挂售模式支持完整商品信息：图片、类目、属性等。核心原则见 SKILL.md 的「关键注意事项」。

## 图片识别降级策略

| Agent 能力 | 处理方式 |
|------------|----------|
| 能查看图片（多模态） | 用 Read 工具读图 → 自动识别品牌/成色/类目/描述 |
| 不能查看图片 | 跳过识别 → 向用户询问品牌、类目、成色、描述等信息 |

> 不同 Agent 能力不同。Agent 应自行判断是否能识别图片，不能则直接走询问路径。两条路径最终都走相同的 submit 提交。

---

## 第 1 步：上传图片 + 识别商品信息（并行）

**上传图片**：

```bash
r2-cli goods hang-up upload-images --shop-id <shopId> --files /path/img1.jpg,/path/img2.jpg --json
```

返回：

```json
{
  "success": true,
  "images": [
    { "value": "1086608743767730915" },
    { "value": "1086608743823622409" }
  ]
}
```

> 图片路径是用户本地文件路径。`--image-ids` 保持字符串，不要转数字（19 位 ID 会精度丢失）。**CLI 自动压缩超过 2MB 的图片**（sharp 渐进式降低 JPEG quality 直到 < 2MB，PNG 自动转 JPEG），原文件不会被修改。多张图片**并行上传**，单张失败自动重试 1 次。

返回（部分成功时带 `warning` 和 `failed` 字段）：

```json
{
  "success": true,
  "images": [
    { "value": "1086608743767730915" }
  ],
  "warning": "1 张图片上传失败",
  "failed": [
    { "file": "d:/path/bad.jpg", "error": "413 Request Entity Too Large" }
  ]
}
```

**同时尝试识别图片**：如果 Agent 支持多模态（如 Claude Code、Gemini），用 Read 工具查看用户图片文件，识别以下信息。不支持则跳过，全部改为向用户询问。

> **多图不一致处理**：如果多张图片显示不同商品（如不同款式、不同品牌），Agent 应识别后告知用户，只保留同一商品的图片。不要把不同商品混在一起提交。

**成色判断映射**：

| 图片中商品状态 | `--stuff-status` 值 |
|----------------|---------------------|
| 带吊牌/未拆封 | `100`（全新） |
| 几乎无使用痕迹 | `-1`（准新）或 `99`（99新） |
| 轻微使用痕迹 | `95`（95新） |
| 明显使用痕迹 | `90`（9新） |

**如果用户没提供价格和商家编码，此时询问**（不要留到最后）。

---

## 第 2 步：自动匹配类目 + 属性

**获取类目 → 自动匹配**：

```bash
r2-cli goods hang-up categories --json
```

Agent 根据图片识别结果自动匹配类目（不需要用户从列表中选）。只在识别不确定时才展示列表：

```
请选择最匹配的类目：
1. 男士鞋靴 > 低帮鞋（推荐）
2. 男士鞋靴 > 运动鞋
3. 男士鞋靴 > 板鞋
```

**获取属性 → 自动匹配**：

```bash
r2-cli goods hang-up props --channel-cat-id <channelCatId> --json
```

Agent 遍历所有属性，尽量自动匹配：

| 属性 | 处理方式 |
|------|----------|
| 图片可识别的（款式/成色/颜色/材质等） | 自动匹配 `propsValues` 中的对应值 |
| 品牌 | 用识别结果调 `brands` 搜索，自动选取精确匹配 |
| 图片无法识别的（季节/裙长等） | 留空，汇总时让用户补充 |

> **props API 说明**：`props` 返回所有属性及其 `propsValues`（非品牌属性可直接从这里选值）；品牌属性需额外调用 `brands` 搜索。

**品牌精确匹配规则**：brands 搜索结果中必须选**完全匹配**的官方名称（如搜 Nike → 只选 `Nike/耐克`，忽略 BACHNIKE、NIKE 7 等）。**支持大小写模糊搜索**。

```bash
r2-cli goods hang-up brands --channel-cat-id <id> --prop-id <品牌propId> --key "Nike" --json
```

最终构建 `--item-attrs`（**5 个字段：valueName、valueId、propId、propName、channelCatId**）：

```json
[
  { "valueName": "Nike/耐克", "valueId": "68af4e8f...", "propId": "83b8f62c...", "propName": "品牌", "channelCatId": "f4718bbb..." },
  { "valueName": "几乎全新", "valueId": "25317efe...", "propId": "3b9f06b2...", "propName": "成色", "channelCatId": "f4718bbb..." },
  { "valueName": "L", "valueId": "65f57139...", "propId": "6562df9f...", "propName": "尺码", "channelCatId": "f4718bbb..." },
  { "valueName": "春秋季", "valueId": "3162b94f...", "propId": "be925d4d...", "propName": "适用季节", "channelCatId": "f4718bbb..." }
]
```

> **注意**：每个属性项包含 `valueName`、`valueId`、`propId`、`propName`、`channelCatId` 五个字段，全部从 `props` 返回的 `propsValues` 中获取。

---

## 第 3 步：汇总展示 → 补充缺失 → 提交

Agent 将所有自动填充和识别结果汇总展示给用户，**一次确认**：

```
商品信息（自动识别 + 需要你补充）：
✅ 标题：Nike 低帮运动鞋 白色 42码 全新（自动生成）
✅ 品牌：Nike/耐克（图片识别）
✅ 类目：男士鞋靴 → 低帮鞋（自动匹配）
✅ 成色：全新（图片识别）
✅ 描述：Nike 低帮运动鞋...（自动生成）
✅ 款式：运动鞋（图片识别）
✅ 鞋码：42（图片识别）
❓ 季节：？（无法识别，请选择：春季/夏季/秋季/冬季/四季）
📦 运费：默认包邮（如需收运费请告知金额）
💰 价格：？（必填）
📋 商家编码：？（优先自定义，不填自动生成）
```

**处理顺序**：
1. 展示汇总信息
2. 让用户补充缺失字段（价格、商家编码、无法识别的属性）
3. 用户确认后直接提交

**所有参数就绪后提交**：

```bash
r2-cli goods hang-up submit \
  --shop-id <shopId> \
  --title "商品标题" \
  --price 599 \
  --category-id <catId> \
  --channel-cat-id <channelCatId> \
  --image-ids "id1,id2" \
  --stuff-status 95 \
  --desc "商品描述（自动生成，包含品牌/款式/颜色/材质/货号）" \
  --out-item-no "商家编码" \
  --brand-name "Nike/耐克" \
  --size "42" \
  --item-attrs '[{"valueName":"Nike/耐克","valueId":"品牌valueId","propId":"83b8f62c...","propName":"品牌","channelCatId":"f4718bbb..."},{"valueName":"全新","valueId":"d114e6ab...","propId":"3b9f06b2...","propName":"成色","channelCatId":"f4718bbb..."},{"valueName":"42","valueId":"尺码valueId","propId":"6562df9f...","propName":"尺码","channelCatId":"f4718bbb..."}]' \
  --json
```

成功返回：`{ "success": true, "data": "上架成功" }`

### 友好输出指引

提交成功后，Agent 从流程中已收集的参数提取关键信息**汇总展示**，不依赖响应中的字段：

```
上架成功！
- 标题：Nike 低帮运动鞋 白色 42码
- 价格：¥99999
- 品牌：Nike/耐克
- 类目：男士鞋靴 → 低帮鞋
- 成色：全新
- 店铺：xxx
```

> Agent 提交前已收集所有参数（title、price、brand-name、category、stuff-status、shop-id），提交成功后直接用这些参数构建摘要，不要翻查历史记录。
>
> 如果提交失败（`success: false`），直接展示 `error` 字段内容：
> ```
> 上架失败：[error 内容]
> ```
> 不要展示整个 JSON。

---

## 必填字段处理

缺少时**在流程中尽早询问用户**，不要等所有信息都收集完再问：

| 缺失字段 | 何时询问 | 询问方式 |
|----------|----------|----------|
| `--price`（售价） | 上传图片时 | "这个商品上架价格是多少？" |
| `--out-item-no`（商家编码） | 上传图片时 | 先问："商家编码是什么？"用户不填则推荐自动生成编码 |
| `--shop-id`（店铺） | 流程开始时 | 展示店铺列表让用户选择 |
| `--title`（标题） | 图片识别无法生成时 | "商品标题用什么？" |
| `--desc`（描述） | 图片识别无法生成时 | "商品描述？" |

## Agent 常见错误预防

- **不要在命令末尾加 `&`**：如果用 `run_in_background: true` 启动命令，不要额外加 `&`，否则 shell 立即返回，无法捕获后续输出
- **`--image-ids` 保持字符串**：图片 ID 是 19 位数字（如 `"1086608743767730915"`），JavaScript `Number()` 会精度丢失。拼接时用字符串拼接，不要 `parseInt`/`Number`
- **`--stuff-status` 准新是数字 `-1`**：不是字符串 `"-1"`，直接传 `--stuff-status -1`
- **`--item-attrs` 传 JSON 字符串**：值必须是 `JSON.stringify()` 后的字符串，不能直接传对象。命令行示例：`--item-attrs '[{"propId":"x","valueId":"y"}]'`
- **`--files` 和 `--image-ids` 都是逗号分隔**：不要多次传 `--files`，用逗号拼成单个值：`--files a.jpg,b.jpg`
- **`--category-id` 取 `catId` 不是 `id`**：categories 返回的数据中 `catId`（如 50106003）是真正的类目 ID，`id`（如 865）是自增 ID，不要用错

## 必填参数

| 参数 | 说明 |
|------|------|
| `--shop-id <id>` | 店铺 ID（即闲鱼用户名 account） |
| `--title <title>` | 商品标题 |
| `--price <amount>` | 售价 |
| `--category-id <id>` | 大分类 ID（从 categories 获取） |
| `--channel-cat-id <id>` | 小分类 ID（从 categories 获取） |
| `--image-ids <ids>` | 图片 ID 列表，逗号分隔（保持字符串） |
| `--stuff-status <n>` | 成色等级 |
| `--desc <desc>` | 商品描述 |
| `--out-item-no <no>` | 商家编码（同店铺唯一，用户自定义） |

## 可选参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--brand-name <name>` | — | 品牌名称 |
| `--size <size>` | — | 尺码 |
| `--goods-no <no>` | — | 货号 |
| `--original-price <amount>` | — | 原价 |
| `--trade-type <n>` | `0` | 交易方式：0 仅在线 / 1 仅线下 / 2 线上或线下 |
| `--transport-fee <amount>` | `0` | 运费（0 = 包邮） |
| `--division-id <id>` | `330100` | 行政区划 ID（市级，默认杭州） |
| `--item-attrs <json>` | — | 商品属性列表 JSON（来自 props/brands） |
| `--yhb` | `false` | 是否开启验货宝 |

> 内部默认值：`itemBizType=2`（普通商品）、`spBizType="16"`（奢品）

## 售后服务（默认关闭）

提交时自动附带售后服务配置，**默认全部关闭**。卖家需在闲鱼 APP 开通后才能开启，未开通的服务如果传 `true` 会导致提交失败（错误：`ITEM_CONDITION_NOT_SUPPORT_SIGN`）。

## 挂售错误处理

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `请提供至少一张图片` | upload-images 无图片 | 提供本地图片路径 |
| 413 / `图片太大` | 图片超过服务端大小限制 | CLI 自动压缩 > 2MB 的图片，如仍失败请手动压缩 |
| `请填写有效的商品叶子类目` | category-id 或 channel-cat-id 错误 | 重新查询 categories |
| `找不到传入的某些图片` | 图片 ID 无效或过期 | 重新上传图片 |
| `ITEM_CONDITION_NOT_SUPPORT_SIGN` | 售后服务未开通或品类不支持 | 默认关闭售后，或在闲鱼 APP 开通对应服务 |

## References

- [r2-goods SKILL.md](../SKILL.md) — 商品管理概览和路由决策
- [r2-shared](../../r2-shared/SKILL.md) — 认证和全局规则
- [../scenes/r2-scene-hangup-fashion.md](../scenes/r2-scene-hangup-fashion.md) — 服装鞋包挂售场景指南
