/**
 * 选品商品列表命令
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/api/modules/xianyu.js";
import { handleCommandError } from "../shared.js";
import { validatePositiveInt } from "../../utils/index.js";

const MAX_PAGE_SIZE = 100;

export function createSelectCommand(): Command {
  const command = new Command("select");
  command.description("选品商品列表（今日数据）");

  command.option("--stock-id <id>", "按仓库 ID 筛选");
  command.option("--stock-goods-id <id>", "按选品 ID 筛选");
  command.option("--page <page>", "页码", "1");
  command.option("--size <size>", "每页数量", "20");
  command.option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(
    async (options: { stockId?: string; stockGoodsId?: string; page?: string; size?: string; json?: boolean }) => {
      try {
        const page = validatePositiveInt(options.page, "页码") ?? 1;
        const size = Math.min(validatePositiveInt(options.size, "每页数量") ?? 20, MAX_PAGE_SIZE);

        const params: { page: number; size: number; stockId?: string; stockGoodsId?: string } = { page, size };
        if (options.stockId) params.stockId = options.stockId;
        if (options.stockGoodsId) params.stockGoodsId = options.stockGoodsId;

        const result = await xianyuApi.getSelectGoodsList(params);

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        if (!result.items.length) {
          console.log(chalk.yellow("暂无选品商品"));
          return;
        }

        const { SelectGoodsTable } = await import("../../components/SelectGoodsTable.js");
        const { renderComponent } = await import("../../utils/render.js");
        renderComponent(SelectGoodsTable, { items: result.items, total: Number(result.total) });
      } catch (error) {
        handleCommandError(error);
      }
    },
  );

  return command;
}
