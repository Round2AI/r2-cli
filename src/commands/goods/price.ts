/**
 * 修改上架价格命令
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/api/modules/goods.js";
import { jsonAction } from "../shared.js";
import type { ListingUpdatePriceParams } from "../../types/goods.js";

export function createPriceCommand(): Command {
  const command = new Command("price");
  command.description("修改闲鱼上架商品价格");

  command
    .option("--id <id>", "上架记录 ID")
    .option("--stock-goods-id <id>", "库存商品 ID")
    .option("--shop-id <id>", "店铺 ID")
    .option("--price <amount>", "新价格（必填）")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(
    jsonAction(async (options: { id?: string; stockGoodsId?: string; shopId?: string; price?: string; json?: boolean }) => {
      if (!options.price) {
        if (options.json) {
          console.log(JSON.stringify({ success: false, error: "--price <amount> 为必填参数" }));
          process.exit(1);
        }
        console.log(chalk.yellow("--price <amount> 为必填参数"));
        return;
      }

      if (!options.id && !(options.stockGoodsId && options.shopId)) {
        if (options.json) {
          console.log(JSON.stringify({ success: false, error: "请指定商品：--id <id> 或 --stock-goods-id <id> --shop-id <id>" }));
          process.exit(1);
        }
        console.log(chalk.yellow("请指定商品：--id <id> 或 --stock-goods-id <id> --shop-id <id>"));
        return;
      }

      const params: ListingUpdatePriceParams = { price: Number(options.price) };
      if (options.id) params.id = options.id;
      if (options.stockGoodsId) params.stockGoodsId = Number(options.stockGoodsId);
      if (options.shopId) params.shopId = options.shopId;

      if (!options.json) console.log(chalk.cyan(`💰 正在修改价格为 ${options.price}...`));
      const result = await xianyuApi.listingUpdatePrice(params);

      if (options.json) {
        console.log(JSON.stringify({ success: true, data: result }, null, 2));
      } else {
        console.log(chalk.green("✅ 价格修改成功"));
        console.log(JSON.stringify(result, null, 2));
      }
    }),
  );

  return command;
}
