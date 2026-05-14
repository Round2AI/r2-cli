/**
 * 用户仓库列表命令
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/http/modules/goods.js";
import { jsonAction } from "../shared.js";

export function createStocksCommand(): Command {
  const command = new Command("stocks");
  command.description("查看所有仓库");
  command.option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(jsonAction(async (options: { json?: boolean }) => {
    const stocks = await xianyuApi.getUserStockList();

    if (options.json) {
      console.log(JSON.stringify(stocks, null, 2));
      return;
    }

    if (!stocks.length) {
      console.log(chalk.yellow("未找到仓库信息"));
      return;
    }

    const { StocksTable } = await import("../../components/StocksTable.js");
    const { renderComponent } = await import("../../utils/render.js");
    renderComponent(StocksTable, { stocks });
  }));

  return command;
}
