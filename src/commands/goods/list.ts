/**
 * 选品商品列表命令
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/http/modules/goods.js";
import { jsonAction } from "../shared.js";

export function createListCommand(): Command {
  const command = new Command("list");
  command.description("查看仓库中的选品商品");

  command
    .option("--stock-id <id>", "仓库 ID（从 goods stocks 获取）")
    .option("--stock-goods-id <id>", "库存商品 ID")
    .option("--page <n>", "页码", "1")
    .option("--size <n>", "每页数量（最大 50）", "20")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(
    jsonAction(async (options: { stockId?: string; stockGoodsId?: string; page?: string; size?: string; json?: boolean }) => {
      const result = await xianyuApi.getSelectGoodsList({
        stockId: options.stockId || undefined,
        stockGoodsId: options.stockGoodsId || undefined,
        page: Number(options.page) || 1,
        size: Math.min(Number(options.size) || 20, 50),
      });

      const data = result ?? { items: [], total: 0 };

      if (options.json) {
        if (!data.items?.length) {
          console.log(JSON.stringify({ ...data, hint: "选品商品为空，请先在后台生成选品表数据后再试" }, null, 2));
        } else {
          console.log(JSON.stringify(data, null, 2));
        }
        return;
      }

      if (!data.items?.length) {
        console.log(chalk.yellow("暂无选品商品，请先绑定仓库或在后台生成选品表数据"));
        return;
      }

      console.log(chalk.cyan(`\n选品商品（共 ${data.total} 件，第 ${data.page} 页）\n`));
      for (const item of data.items) {
        console.log(
          `  ${chalk.bold(item.goodsName)} ${item.size ? chalk.gray(`| ${item.size}`) : ""}`,
        );
        console.log(
          `  品牌: ${item.brand}  建议售价: ¥${item.salePrice}  stockGoodsId: ${chalk.green(item.stockGoodsId)}`,
        );
        console.log(chalk.gray(`  分类: ${item.cate1Name} > ${item.cate2Name} > ${item.cate3Name}`));
        console.log();
      }
    }),
  );

  return command;
}
