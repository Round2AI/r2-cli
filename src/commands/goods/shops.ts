/**
 * 店铺列表命令
 */

import { Command } from "commander";
import chalk from "chalk";
import { getXianyuApi } from "../../services/xy/xianyu-api.service.js";
import { handleCommandError } from "./shared.js";

export function createShopsCommand(): Command {
  const command = new Command("shops");
  command.description("查看授权店铺列表");
  command.option("-p, --platform <platform>", "平台 (xianyu/douyin)", "xianyu");

  command.action(async (options: { platform: string }) => {
    try {
      const api = getXianyuApi();
      const shops = await api.getShops(options.platform);

      const platformName = options.platform === "douyin" ? "抖音" : "闲鱼";

      if (!shops.length) {
        console.log(chalk.yellow(`未找到已授权的${platformName}店铺`));
        return;
      }

      console.log(chalk.cyan(`\n${platformName}授权店铺:\n`));

      for (const shop of shops) {
        const expired = Date.now() > shop.expiresIn;
        const status = expired ? chalk.red("已过期") : chalk.green("授权中");
        const expireDate = new Date(shop.expiresIn).toLocaleDateString();

        console.log(chalk.white(`  ${shop.name}`));
        console.log(chalk.gray(`    ID: ${shop.thirdUserId}  状态: ${status}  到期: ${expireDate}`));
      }
      console.log();
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
