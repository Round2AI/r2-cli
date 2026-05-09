/**
 * 下架商品命令
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/api/modules/xianyu.js";
import { handleCommandError } from "../shared.js";
import type { ListingDownParams } from "../../types/xianyu.js";

export function createDownCommand(): Command {
  const command = new Command("down");
  command.description("下架闲鱼商品");

  command
    .option("--id <id>", "上架记录 ID")
    .option("--stock-goods-id <id>", "库存商品 ID")
    .option("--shop-id <id>", "店铺 ID")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(
    async (options: { id?: string; stockGoodsId?: string; shopId?: string; json?: boolean }) => {
      if (options.json) {
        try {
          const params: ListingDownParams = {};
          if (options.id) params.id = options.id;
          if (options.stockGoodsId) params.stockGoodsId = Number(options.stockGoodsId);
          if (options.shopId) params.shopId = options.shopId;
          const result = await xianyuApi.listingDownXianyu(params);
          console.log(JSON.stringify({ success: true, data: result }, null, 2));
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.log(JSON.stringify({ success: false, error: msg }));
          process.exit(1);
        }
        return;
      }

      try {
        if (!options.id && !(options.stockGoodsId && options.shopId)) {
          console.log(chalk.yellow("请指定下架条件：--id <id> 或 --stock-goods-id <id> --shop-id <id>"));
          return;
        }

        const params: Record<string, unknown> = {};
        if (options.id) params.id = options.id;
        if (options.stockGoodsId) params.stockGoodsId = Number(options.stockGoodsId);
        if (options.shopId) params.shopId = options.shopId;

        console.log(chalk.cyan("📦 正在下架商品..."));
        const result = await xianyuApi.listingDownXianyu(params);
        console.log(chalk.green("✅ 下架成功"));
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        handleCommandError(error);
      }
    },
  );

  return command;
}
