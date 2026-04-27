/**
 * 价格分析命令
 */

import { Command } from "commander";
import { notImplemented } from "../shared.js";

export function createPricingCommand(): Command {
  const command = new Command("analyze");
  command.description("分析商品价格建议");
  command.option("--sku <sku>", "商品SKU");
  command.option("--condition <condition>", "商品成色");
  command.action(() => notImplemented("pricing analyze"));
  return command;
}
