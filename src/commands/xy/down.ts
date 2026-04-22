/**
 * 闲鱼商品下架/重新上架命令
 */

import { Command } from "commander";
import chalk from "chalk";
import { getXianyuApi } from "../../services/xy/xianyu-api.service.js";
import { handleCommandError } from "./shared.js";

export function createDownCommand(): Command {
  const command = new Command("down");
  command.description("下架闲鱼商品");

  command.argument("<ids...>", "商品渠道 ID（多个用空格分隔）");
  command.action(async (ids: string[]) => {
    try {
      const api = getXianyuApi();
      console.log(chalk.cyan(`正在下架 ${ids.length} 个商品...`));

      await api.batchDown(ids.join(","));
      console.log(chalk.green(`下架成功 (${ids.length} 个商品)`));
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}

export function createReUpCommand(): Command {
  const command = new Command("reup");
  command.description("重新上架闲鱼商品");

  command.argument("<ids...>", "商品渠道 ID（多个用空格分隔）");
  command.action(async (ids: string[]) => {
    try {
      const api = getXianyuApi();
      console.log(chalk.cyan(`正在重新上架 ${ids.length} 个商品...`));

      await api.batchReUp(ids.join(","));
      console.log(chalk.green(`重新上架成功 (${ids.length} 个商品)`));
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
