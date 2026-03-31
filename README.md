Round2AI 正式开源 R2-CLI，向 AI 开放二手潮奢交易全链路能力
2026 年 3 月，Anthropic、Google、字节跳动、阿里巴巴、腾讯等公司相继开源 CLI 工具，将办公、协作、开发等核心能力以命令行形式向 AI Agent 开放。
今天，Round2AI 正式开源 R2-CLI，将二手潮奢交易场景中的数据、市场、价格、库存、履约、决策等核心能力，以同样的方式向 AI Agent 开放。
GitHub：github.com/Round2AI/r2-cli协议：MIT

---
关于 Round2AI
Round2AI 由 PURESNAKE 团队开发。
使命：让潮奢循环交易没有摩擦。
PURESNAKE 深耕二手潮奢交易流通 6 年，累计鉴定超 400 万单，自建 6 座质检云仓，全国员工超 100 人，B2B 平台年成交规模超 1 亿。业务覆盖回收、鉴定、质检、仓储、定价、销售全链路。
这些能力正在被抽象为系统能力。R2-CLI 是这些能力面向 AI Agent 的开放入口。

---
开放能力一览
R2-CLI 开放 6 大业务域、40+ 命令、12 个 AI Agent Skills，覆盖二手潮奢交易全链路。
业务域
能力
说明
📊 数据对接
r2 ingest
对接主流 ERP，统一线上电商、线下门店、仓储履约等多渠道经营数据
📈 经营分析
r2 report
生成经营日报 / 周报，涵盖销售、毛利、库龄、异常波动

r2 ask
自然语言查询经营数据，实时返回结果
🔍 市场分析
r2 demand
按 SKU / 品类 / 区域扫描市场需求热度与供需缺口

r2 simulate
竞价成交模拟，输入出价返回预估成交率与利润空间

r2 bidding strategy
基于预算与品类生成竞价策略建议
💰 价格分析
r2 pricing
基于真实成交数据给出收货价与售卖价建议

r2 sell optimize
在售商品的定价与渠道优化建议
📦 库存与履约
r2 inventory risk
库存风险识别：滞销预警、贬值通道、库龄超期

r2 fulfillment
履约全链路追踪：收货 → 质检 → 入库 → 发货
🧠 经营决策
r2 decide
综合数据输出经营动作建议：补货 / 清仓 / 调价 / 风控

---
快速开始
安装
npm install -g @round2ai/r2-cli

授权
r2 auth login

查看今日经营概况
r2 report --type daily

查询某个 SKU 的市场行情和建议价格
r2 demand --sku "Chanel Classic Flap" --region east-china
r2 pricing --sku "Chanel Classic Flap" --condition A

竞价前模拟成交概率
r2 simulate --sku "Air Jordan 1 Retro High OG" --price 1200

检查仓库库存风险
r2 inventory risk --warehouse sz-01

**获取未来 7 天经营建议**

```bash
r2 decide --store shanghai-01 --horizon 7d


---
AI Agent 集成
R2-CLI 支持 Claude Code、OpenClaw、Codex 等主流 AI Agent 框架。
安装 Agent Skills：
npx skills add Round2AI/r2-cli --all -y

安装后，AI Agent 可以直接调用 R2-CLI 的全部交易能力。一句"帮我看看这周哪些款在亏钱"，Agent 会自动调用 r2 ask、r2 pricing、r2 inventory risk，给出完整的分析和建议。
R2-CLI 帮商家解决三件事：买什么，卖多少钱，怎么卖掉。

---
技术信息


语言
Go
协议
MIT
安装
npm install -g @round2ai/r2-cli
授权
r2 auth login
命令数
40+
AI Agent Skills
12
数据源
通过 ERP 对接各电商平台、线下 POS、自营仓储 WMS

---
Already used by merchants in production.
Across online and offline channels.
Including ourselves.

---
Round2AI — 让潮奢循环交易没有摩擦。
Reduce friction in circular commerce.
本文发布于 2026 年 4 月 1 日。如有巧合，纯属巧合。
