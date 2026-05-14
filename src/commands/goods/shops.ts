/**
 * 用户店铺列表命令（跨平台）
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/http/modules/goods.js";
import { jsonAction, sanitizeShops } from "../shared.js";

export function createShopsCommand(): Command {
  const command = new Command("shops");
  command.description("查看所有已授权店铺（跨平台）");
  command.option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(jsonAction(async (options: { json?: boolean }) => {
    const shops = await xianyuApi.getUserShopList();

    if (options.json) {
      console.log(JSON.stringify(sanitizeShops(shops), null, 2));
      return;
    }

    if (!shops.length) {
      console.log(chalk.yellow("未找到已授权的店铺"));
      console.log(chalk.gray("  提示: 请先在第二回合 APP 中授权店铺"));
      return;
    }

    const { ShopsTable } = await import("../../components/ShopsTable.js");
    const { renderComponent } = await import("../../utils/render.js");
    renderComponent(ShopsTable, { shops, platform: "all" });
  }));

  return command;
}
