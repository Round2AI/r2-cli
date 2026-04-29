/**
 * 商品改价命令
 */

import { Command } from "commander";
import chalk from "chalk";
import { getXianyuApi } from "../../services/api/modules/xianyu.js";
import { handleCommandError } from "../shared.js";

export function createPriceCommand(): Command {
  const command = new Command("price");
  command.description("修改商品售价");

  command.argument("<id>", "商品渠道 ID");
  command.requiredOption("--price <amount>", "新售价");

  command.action(async (id: string, options: { price: string }) => {
    try {
      const priceNum = Number(options.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        console.log(chalk.red("请输入有效的价格（正数）"));
        return;
      }

      const api = getXianyuApi();
      console.log(chalk.cyan(`正在修改价格...`));

      await api.updatePrice(id, String(priceNum));
      console.log(chalk.green(`价格已修改为 ¥${priceNum}`));
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
