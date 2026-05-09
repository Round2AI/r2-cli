/**
 * 商品上架命令
 *
 * 新版上架：只需 stockGoodsId + shopId + price 即可提交
 * - 人类模式：交互式选择店铺 → 选择仓库商品 → 输入价格 → 确认 → 自动轮询上架结果
 * - Agent 模式：直接传参 --stock-goods-id --shop-id --price，自动轮询上架结果
 */

import { Command } from "commander";
import chalk from "chalk";
import { select, input, confirm } from "@inquirer/prompts";
import * as xianyuApi from "../../../services/api/modules/goods.js";
import { handleCommandError } from "../../shared.js";
import { poll } from "../../../utils/polling.js";
import type { ListingInfo } from "../../../types/goods.js";

/** 上架提交后的轮询：每 2 秒查询一次，最多 10 秒 */
const LISTING_POLL_INTERVAL = 2000;
const LISTING_POLL_TIMEOUT = 10000;

/** 判断上架是否还在处理中（init 表示待处理，仍在队列中） */
function isProcessing(info: ListingInfo): boolean {
  const status = info.status?.toLowerCase() ?? "";
  return status === "" || status === "init" || status === "pending" || status === "processing";
}

/** 轮询上架状态直到完成 */
async function pollListingStatus(
  stockGoodsId: number,
  shopId: string,
  platform: string,
  json?: boolean,
): Promise<ListingInfo> {
  if (!json) {
    process.stdout.write(chalk.cyan("⏳ 正在查询上架进度..."));
  }

  const result = await poll(
    () => xianyuApi.getListingInfo({ stockGoodsId, shopId, platform }),
    {
      interval: LISTING_POLL_INTERVAL,
      timeout: LISTING_POLL_TIMEOUT,
      condition: (data) => !isProcessing(data),
    },
  );

  if (!json) {
    process.stdout.write("\r" + " ".repeat(30) + "\r");
  }

  return result;
}

export function createUpCommand(): Command {
  const command = new Command("up");
  command.description("上架商品到闲鱼");

  command
    .option("--stock-goods-id <id>", "库存商品ID（从 goods list 获取）")
    .option("--shop-id <id>", "店铺ID（从 goods shops 获取）")
    .option("--price <amount>", "上架价格")
    .option("-p, --platform <platform>", "平台", "xianyu")
    .option("--json", "输出 JSON（Agent 用）")
    .action(async (options: { stockGoodsId?: string; shopId?: string; price?: string; platform: string; json?: boolean }) => {
      try {
        // Agent 模式：所有参数齐全则直接提交
        if (options.stockGoodsId && options.shopId && options.price) {
          const stockGoodsId = Number(options.stockGoodsId);
          const shopId = options.shopId;
          const price = Number(options.price);
          const platform = options.platform;

          const result = await xianyuApi.listingUpXianyu({ stockGoodsId, shopId, price, platform });

          // 提交成功后轮询上架进度
          const listingInfo = await pollListingStatus(stockGoodsId, shopId, platform, options.json);

          if (options.json) {
            console.log(JSON.stringify({ success: true, data: { submit: result, listing: listingInfo } }, null, 2));
          } else {
            const statusOk = listingInfo.status?.toLowerCase() !== "failed";
            console.log(statusOk ? chalk.green("✓ 上架成功") : chalk.red("✗ 上架失败"));
            console.log(JSON.stringify(listingInfo, null, 2));
          }
          return;
        }

        // 人类交互式模式
        const shops = await xianyuApi.getUserShopList();
        if (shops.length === 0) {
          console.log(chalk.yellow("没有已授权店铺，请先运行 r2-cli auth xianyu 授权"));
          return;
        }

        const selectedShop = await select({
          message: "选择店铺",
          choices: shops.map((s) => ({ name: `${s.shopName} (${s.platform})`, value: s.shopId })),
        });

        const stocks = await xianyuApi.getUserStockList();
        if (stocks.length === 0) {
          console.log(chalk.yellow("没有可用的仓库"));
          return;
        }

        const selectedStock = await select({
          message: "选择仓库",
          choices: stocks.map((s) => ({ name: s.stockName, value: s.stockId })),
        });

        // 获取仓库中的选品商品
        const goodsList = await xianyuApi.getSelectGoodsList({ stockId: selectedStock, size: 100 });
        if (!goodsList.items?.length) {
          console.log(chalk.yellow("该仓库没有可选的商品"));
          return;
        }

        const selectedGoods = await select({
          message: "选择商品",
          choices: goodsList.items.map((g) => ({
            name: `${g.goodsName} ${g.size ? `| ${g.size}` : ""} | ¥${g.salePrice}`,
            value: g.stockGoodsId,
          })),
        });

        const priceInput = await input({
          message: "输入上架价格",
          default: goodsList.items.find((g) => g.stockGoodsId === selectedGoods)?.salePrice?.toString() ?? "",
          validate: (v) => {
            const n = Number(v);
            return n > 0 ? true : "价格必须为正数";
          },
        });

        const confirmed = await confirm({
          message: `确认上架？价格 ¥${priceInput}`,
          default: true,
        });

        if (!confirmed) {
          console.log(chalk.gray("已取消"));
          return;
        }

        const stockGoodsId = Number(selectedGoods);
        await xianyuApi.listingUpXianyu({
          stockGoodsId,
          shopId: selectedShop,
          price: Number(priceInput),
          platform: "xianyu",
        });

        console.log(chalk.green("✓ 上架已提交，正在查询进度..."));

        // 轮询上架结果
        const listingInfo = await pollListingStatus(stockGoodsId, selectedShop, "xianyu");
        const statusOk = listingInfo.status?.toLowerCase() !== "failed";
        console.log(statusOk ? chalk.green("✓ 上架成功") : chalk.red("✗ 上架失败"));
        console.log(JSON.stringify(listingInfo, null, 2));
      } catch (error) {
        handleCommandError(error);
      }
    });

  return command;
}
