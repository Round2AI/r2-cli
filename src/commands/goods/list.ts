/**
 * 选品商品列表命令
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/api/modules/xianyu.js";
import { handleCommandError, agentAction } from "../shared.js";

export function createListCommand(): Command {
  const command = new Command("list");
  command.description("查看仓库中的选品商品");

  command
    .option("--stock-id <id>", "仓库 ID（从 goods stocks 获取）")
    .option("--page <n>", "页码", "1")
    .option("--size <n>", "每页数量", "20")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(
    async (options: { stockId?: string; page?: string; size?: string; json?: boolean }) => {
      if (options.json) {
        await agentAction(async () => {
          const result = await xianyuApi.getSelectGoodsList({
            stockId: options.stockId,
            page: options.page ? Number(options.page) : undefined,
            size: options.size ? Number(options.size) : undefined,
          });
          console.log(JSON.stringify(result, null, 2));
        });
        return;
      }

      try {
        if (!options.stockId) {
          console.log(chalk.yellow("请指定仓库 ID: r2-cli goods list --stock-id <id>"));
          return;
        }

        const result = await xianyuApi.getSelectGoodsList({
          stockId: options.stockId,
          page: options.page ? Number(options.page) : undefined,
          size: options.size ? Number(options.size) : undefined,
        });

        if (!result.items?.length) {
          console.log(chalk.yellow("该仓库没有选品商品"));
          return;
        }

        console.log(chalk.cyan(`\n选品商品（共 ${result.total} 件，第 ${result.page} 页）\n`));
        for (const item of result.items) {
          console.log(
            `  ${chalk.bold(item.goodsName)} ${item.size ? chalk.gray(`| ${item.size}`) : ""}`,
          );
          console.log(
            `  品牌: ${item.brand}  建议售价: ¥${item.salePrice}  stockGoodsId: ${chalk.green(item.stockGoodsId)}`,
          );
          console.log(chalk.gray(`  分类: ${item.cate1Name} > ${item.cate2Name} > ${item.cate3Name}`));
          console.log();
        }
      } catch (error) {
        handleCommandError(error);
      }
    },
  );

  return command;
}
