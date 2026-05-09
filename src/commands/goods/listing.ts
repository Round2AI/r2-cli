/**
 * 上架列表查询命令
 */

import { Command } from "commander";
import chalk from "chalk";
import * as xianyuApi from "../../services/api/modules/goods.js";
import { handleCommandError } from "../shared.js";

const STATUS_MAP: Record<string, string> = {
  init: "待上架",
  up: "已上架",
  down: "已下架",
  fail: "失败",
};

export function createListingCommand(): Command {
  const command = new Command("listing");
  command.description("查询上架商品列表");

  command
    .option("--id <id>", "上架记录 ID")
    .option("--stock-goods-id <id>", "库存商品 ID")
    .option("--shop-id <id>", "店铺 ID")
    .option("--stock-id <id>", "仓库 ID")
    .option("-s, --status <status>", "状态过滤（init/up/down/fail）")
    .option("-p, --platform <platform>", "平台", "xianyu")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(
    async (options: {
      id?: string;
      stockGoodsId?: string;
      shopId?: string;
      stockId?: string;
      status?: string;
      platform: string;
      json?: boolean;
    }) => {
      try {
        const result = await xianyuApi.getListingList({
          id: options.id,
          stockGoodsId: options.stockGoodsId ? Number(options.stockGoodsId) : undefined,
          shopId: options.shopId,
          stockId: options.stockId,
          status: options.status,
          platform: options.platform,
        });

        const data = result ?? { list: [], total: 0 };

        if (options.json) {
          if (!data.list?.length) {
            console.log(JSON.stringify({ ...data, hint: "暂无上架记录" }, null, 2));
          } else {
            console.log(JSON.stringify(data, null, 2));
          }
          return;
        }

        if (!data.list?.length) {
          console.log(chalk.yellow("暂无上架记录"));
          return;
        }

        console.log(chalk.green(`✅ 共 ${data.total} 条记录\n`));
        for (const item of data.list) {
          const statusText = STATUS_MAP[item.status] ?? item.status;
          console.log(`  ID: ${item.id} | 状态: ${statusText} | 价格: ${item.price} | stockGoodsId: ${item.stockGoodsId}`);
        }
      } catch (error) {
        if (options.json) {
          const msg = error instanceof Error ? error.message : String(error);
          console.log(JSON.stringify({ success: false, error: msg }));
          process.exit(1);
        }
        handleCommandError(error);
      }
    },
  );

  return command;
}
