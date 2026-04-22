/**
 * 闲鱼商品改价命令
 */

import { Command } from "commander";
import chalk from "chalk";
import { getXianyuApi } from "../../services/xy/xianyu-api.service.js";
import { handleCommandError } from "./shared.js";

export function createPriceCommand(): Command {
  const command = new Command("price");
  command.description("修改闲鱼商品售价");

  command.argument("<id>", "商品渠道 ID");
  command.requiredOption("--price <amount>", "新售价");

  command.action(async (id: string, options: { price: string }) => {
    try {
      const api = getXianyuApi();
      console.log(chalk.cyan(`正在修改价格...`));

      await api.updatePrice(id, options.price);
      console.log(chalk.green(`价格已修改为 ¥${options.price}`));
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
