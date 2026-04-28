/**
 * 开发中命令注册（stub）
 */

import { Command } from "commander";
import { notImplemented } from "./shared.js";

export function setupStubCommands(program: Command): void {
  program
    .command("ingest", { hidden: true })
    .description("对接主流 ERP，统一多渠道经营数据")
    .action(() => notImplemented("ingest"));

  program
    .command("ask", { hidden: true })
    .description("自然语言查询经营数据")
    .action(() => notImplemented("ask"));

  program
    .command("demand", { hidden: true })
    .description("扫描市场需求热度与供需缺口")
    .option("--sku <sku>", "商品SKU")
    .option("--region <region>", "区域")
    .action(() => notImplemented("demand"));

  program
    .command("fulfillment", { hidden: true })
    .description("履约全链路追踪")
    .action(() => notImplemented("fulfillment"));

  program
    .command("simulate", { hidden: true })
    .description("竞价成交模拟")
    .option("--sku <sku>", "商品SKU")
    .option("--price <price>", "出价")
    .action(() => notImplemented("simulate"));

  program
    .command("bidding-strategy", { hidden: true })
    .description("基于预算与品类生成竞价策略建议")
    .action(() => notImplemented("bidding-strategy"));

  program
    .command("decide", { hidden: true })
    .description("综合数据输出经营动作建议")
    .option("--store <store>", "店铺代码")
    .option("--horizon <horizon>", "预测周期")
    .action(() => notImplemented("decide"));

  program
    .command("agent", { hidden: true })
    .description("AI Agent 集成")
    .action(() => notImplemented("agent"));
}
