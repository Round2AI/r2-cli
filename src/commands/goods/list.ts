/**
 * 寄售商品列表命令
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/api/modules/xianyu.js";
import { handleCommandError } from "../shared.js";
import { validateStatus, validatePositiveInt } from "../../utils/index.js";

const MAX_PAGE_SIZE = 100;

export function createListCommand(): Command {
  const command = new Command("list");
  command.description("寄售商品列表");

  command.option("--status <status>", "状态: wait/on/sold/down", "");
  command.option("--keyword <keyword>", "搜索关键词");
  command.option("--page <page>", "页码", "1");
  command.option("--size <size>", "每页数量", "20");

  command.action(async (options: { status?: string; keyword?: string; page?: string; size?: string }) => {
    try {
      validateStatus(options.status);
      const page = validatePositiveInt(options.page, "页码") ?? 1;
      const size = Math.min(validatePositiveInt(options.size, "每页数量") ?? 20, MAX_PAGE_SIZE);

      const params: Record<string, unknown> = { page, size };
      if (options.status) params.status = options.status;
      if (options.keyword) params.key = options.keyword;
      const result = await xianyuApi.getSellerGoodsList(params);

      if (!result.items.length) {
        console.log(chalk.yellow("暂无商品"));
        console.log(chalk.gray("  提示: 请先在第二回合 APP 或 ERP 中同步商品"));
        return;
      }

      const { GoodsTable } = await import("../../components/GoodsTable.js");
      const { renderComponent } = await import("../../utils/render.js");
      renderComponent(GoodsTable, {
        items: result.items,
        total: result.total,
        statusFilter: options.status || "",
      });
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
