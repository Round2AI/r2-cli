/**
 * 用户店铺列表命令（跨平台）
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/api/modules/goods.js";
import { handleCommandError, sanitizeShops } from "../shared.js";

export function createShopsCommand(): Command {
  const command = new Command("shops");
  command.description("查看所有已授权店铺（跨平台）");
  command.option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(async (options: { json?: boolean }) => {
    try {
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
    } catch (error) {
      if (options.json) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(JSON.stringify({ success: false, error: msg }));
        process.exit(1);
      }
      handleCommandError(error);
    }
  });

  return command;
}
