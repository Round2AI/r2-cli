/**
 * 下架商品命令
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/http/modules/goods.js";
import { jsonAction, jsonSuccess, validationError } from "../shared.js";
import type { ListingDownParams } from "../../types/goods.js";

export function createDownCommand(): Command {
  const command = new Command("down");
  command.description("下架闲鱼商品");

  command
    .option("--id <id>", "上架记录 ID")
    .option("--stock-goods-id <id>", "库存商品 ID")
    .option("--shop-id <id>", "店铺 ID")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(
    jsonAction(async (options: { id?: string; stockGoodsId?: string; shopId?: string; json?: boolean }) => {
      if (!options.id && !(options.stockGoodsId && options.shopId)) {
        validationError(options, "请指定下架条件：--id <id> 或 --stock-goods-id <id> --shop-id <id>");
        return;
      }

      const params: ListingDownParams = {};
      if (options.id) params.id = options.id;
      if (options.stockGoodsId) params.stockGoodsId = Number(options.stockGoodsId);
      if (options.shopId) params.shopId = options.shopId;

      if (!options.json) console.log(chalk.cyan("📦 正在下架商品..."));
      const result = await xianyuApi.listingDownXianyu(params);

      jsonSuccess(options, result, "✅ 下架成功");
    }),
  );

  return command;
}
