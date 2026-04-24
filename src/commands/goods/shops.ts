/**
 * 店铺列表命令
 */

import React from "react";
import { Command } from "commander";
import chalk from "chalk";
import { getXianyuApi } from "../../services/xy/xianyu-api.service.js";
import { handleCommandError } from "../shared.js";
import { renderOnce } from "../../utils/index.js";
import { ShopsTable } from "../../components/ShopsTable.js";

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

      renderOnce(React.createElement(ShopsTable, { shops, platform: options.platform }));
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
