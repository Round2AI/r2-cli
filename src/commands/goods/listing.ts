/**
 * 上架信息查询命令
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/api/modules/xianyu.js";
import { handleCommandError, agentAction } from "../shared.js";

export function createListingCommand(): Command {
  const command = new Command("listing");
  command.description("查询上架信息");

  command
    .option("--id <id>", "上架记录 ID（goodsListingId）")
    .option("--stock-goods-id <id>", "库存商品 ID")
    .option("--shop-id <id>", "店铺 ID")
    .option("-p, --platform <platform>", "平台", "xianyu")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(
    async (options: { id?: string; stockGoodsId?: string; shopId?: string; platform: string; json?: boolean }) => {
      if (options.json) {
        await agentAction(async () => {
          const result = await xianyuApi.getListingInfo({
            id: options.id,
            stockGoodsId: options.stockGoodsId ? Number(options.stockGoodsId) : undefined,
            shopId: options.shopId,
            platform: options.platform,
          });
          console.log(JSON.stringify(result, null, 2));
        });
        return;
      }

      try {
        if (!options.id && !options.stockGoodsId) {
          console.log(chalk.yellow("请指定查询条件：--id <goodsListingId> 或 --stock-goods-id <id> --shop-id <id>"));
          return;
        }

        const result = await xianyuApi.getListingInfo({
          id: options.id,
          stockGoodsId: options.stockGoodsId ? Number(options.stockGoodsId) : undefined,
          shopId: options.shopId,
          platform: options.platform,
        });

        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        handleCommandError(error);
      }
    },
  );

  return command;
}
