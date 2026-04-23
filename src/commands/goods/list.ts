/**
 * 寄售商品列表命令
 */

import { Command } from "commander";
import chalk from "chalk";
import React from "react";
import { render } from "ink";
import { getXianyuApi } from "../../services/xy/xianyu-api.service.js";
import { handleCommandError } from "../shared.js";
import { GoodsTable } from "../../components/GoodsTable.js";

export function createListCommand(): Command {
  const command = new Command("list");
  command.description("寄售商品列表");

  command.option("--status <status>", "状态: wait/on/sold/down", "");
  command.option("--keyword <keyword>", "搜索关键词");
  command.option("--page <page>", "页码", "1");
  command.option("--size <size>", "每页数量", "20");

  command.action(async (options: { status?: string; keyword?: string; page?: string; size?: string }) => {
    try {
      if (options.status && !["wait", "on", "sold", "down"].includes(options.status)) {
        console.log(chalk.red("状态必须是: wait/on/sold/down"));
        return;
      }

      const pageNum = Number(options.page);
      const sizeNum = Number(options.size);
      if (options.page && (!Number.isInteger(pageNum) || pageNum < 1)) {
        console.log(chalk.red("页码必须是正整数"));
        return;
      }
      if (options.size && (!Number.isInteger(sizeNum) || sizeNum < 1)) {
        console.log(chalk.red("每页数量必须是正整数"));
        return;
      }

      const api = getXianyuApi();
      const params: Record<string, unknown> = {
        page: Number(options.page) || 1,
        size: Number(options.size) || 20,
      };
      if (options.status) params.status = options.status;
      if (options.keyword) params.key = options.keyword;
      const result = await api.getSellerGoodsList(params);

      if (!result.items.length) {
        console.log(chalk.yellow("暂无商品"));
        return;
      }

      render(
        React.createElement(GoodsTable, {
          items: result.items,
          total: result.total,
          statusFilter: options.status || "",
        }),
      );
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
