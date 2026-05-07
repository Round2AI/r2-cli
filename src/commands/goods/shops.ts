/**
 * 店铺列表命令
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/api/modules/xianyu.js";
import { handleCommandError } from "../shared.js";

export function createShopsCommand(): Command {
  const command = new Command("shops");
  command.description("查看授权店铺列表");
  command.option("-p, --platform <platform>", "平台 (xianyu/douyin)", "xianyu");

  command.action(async (options: { platform: string }) => {
    try {
      const shops = await xianyuApi.getShops(options.platform);

      const platformName = options.platform === "douyin" ? "抖音" : "闲鱼";

      if (!shops.length) {
        console.log(chalk.yellow(`未找到已授权的${platformName}店铺`));
        console.log(chalk.gray("  提示: 请先在第二回合 APP 中授权店铺"));
        console.log(chalk.gray("  路径: 打开第二回合 APP → 店铺管理 → 选择平台 → 按提示授权"));
        console.log(chalk.gray("  授权后运行: r2 goods shops 验证"));
        return;
      }

      const { ShopsTable } = await import("../../components/ShopsTable.js");
      const { renderComponent } = await import("../../utils/render.js");
      renderComponent(ShopsTable, { shops, platform: options.platform });
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
