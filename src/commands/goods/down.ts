/**
 * 商品下架/重新上架命令
 */

import { Command } from "commander";
import chalk from "chalk";
import { getXianyuApi } from "../../services/xy/xianyu-api.service.js";
import { handleCommandError } from "./shared.js";

function createBatchCommand(
  name: string,
  desc: string,
  actionLabel: string,
  apiFn: (api: ReturnType<typeof getXianyuApi>, ids: string) => Promise<unknown>,
): Command {
  const cmd = new Command(name);
  cmd.description(desc);
  cmd.argument("<ids...>", "商品渠道 ID（多个用空格分隔）");
  cmd.action(async (ids: string[]) => {
    try {
      if (!ids.length) {
        console.log(chalk.red("请提供至少一个商品 ID"));
        return;
      }
      const api = getXianyuApi();
      console.log(chalk.cyan(`正在${actionLabel} ${ids.length} 个商品...`));

      await apiFn(api, ids.join(","));
      console.log(chalk.green(`${actionLabel}成功 (${ids.length} 个商品)`));
    } catch (error) {
      handleCommandError(error);
    }
  });
  return cmd;
}

export function createDownCommand(): Command {
  return createBatchCommand("down", "下架商品", "下架", (api, ids) => api.batchDown(ids));
}

export function createReUpCommand(): Command {
  return createBatchCommand("reup", "重新上架商品", "重新上架", (api, ids) => api.batchReUp(ids));
}
