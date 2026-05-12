/**
 * 修改已上架商品信息命令
 */

import { Command } from "commander";
import chalk from "chalk";
import * as goodsApi from "../../services/api/modules/goods.js";
import { jsonAction } from "../shared.js";
import type { UpdateGoodsInfoParams, XyItemAttr } from "../../types/goods.js";

export function createEditCommand(): Command {
  const command = new Command("edit");
  command.description("修改已上架商品信息（标题、描述、品牌、类目、图片、属性等）");

  command
    .option("--id <id>", "商品上架 ID（不推荐，优先用 --stock-goods-id + --account）")
    .option("--stock-goods-id <id>", "库存商品 ID（推荐，与 --account 配合）")
    .option("--account <shopId>", "闲鱼用户名/店铺 ID（推荐，与 --stock-goods-id 配合）")
    .option("--title <title>", "商品标题")
    .option("--desc <desc>", "商品描述")
    .option("--category-id <id>", "商品类目 ID（大分类，后端必填）")
    .option("--channel-cat-id <id>", "渠道类目 ID（小分类，后端必填）")
    .option("--image-ids <ids>", "图片 ID 列表（逗号分隔）")
    .option("--item-attrs <json>", "商品属性列表（JSON 字符串）")
    .option("--brand-name <name>", "品牌名称")
    .option("--stuff-status <status>", "成色等级：100=全新 -1=准新 99=99新 95=95新 90=9新")
    .option("--goods-no <no>", "货号")
    .option("--original-price <price>", "原价（单位：元）")
    .option("--size <size>", "尺码")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(
    jsonAction(async (options: {
      id?: string;
      stockGoodsId?: string;
      account?: string;
      title?: string;
      desc?: string;
      categoryId?: string;
      channelCatId?: string;
      imageIds?: string;
      itemAttrs?: string;
      brandName?: string;
      stuffStatus?: string;
      goodsNo?: string;
      originalPrice?: string;
      size?: string;
      json?: boolean;
    }) => {
      // 验证定位参数（推荐 stock-goods-id + account）
      if (!(options.stockGoodsId && options.account) && !options.id) {
        if (options.json) {
          console.log(JSON.stringify({ success: false, error: "请指定商品：--stock-goods-id <id> --account <shopId>" }));
          process.exit(1);
        }
        console.log(chalk.yellow("请指定商品：--stock-goods-id <id> --account <shopId>"));
        return;
      }

      // 构建参数（只发送有值的字段）
      const params: UpdateGoodsInfoParams = {};
      if (options.id) params.goodsListingId = Number(options.id);
      if (options.stockGoodsId) params.stockGoodsId = Number(options.stockGoodsId);
      if (options.account) params.account = options.account;
      if (options.title) params.title = options.title;
      if (options.desc) params.desc = options.desc;
      if (options.categoryId) params.categoryId = Number(options.categoryId);
      if (options.channelCatId) params.channelCatId = options.channelCatId;
      if (options.imageIds) params.imageIdList = options.imageIds.split(",").map((s) => s.trim());
      if (options.brandName) params.brandName = options.brandName;
      if (options.stuffStatus) params.stuffStatus = Number(options.stuffStatus);
      if (options.goodsNo) params.goodsNo = options.goodsNo;
      if (options.originalPrice) params.originalPrice = Number(options.originalPrice);
      if (options.size) params.size = options.size;

      if (options.itemAttrs) {
        try {
          params.itemAttrList = JSON.parse(options.itemAttrs) as XyItemAttr[];
        } catch {
          if (options.json) {
            console.log(JSON.stringify({ success: false, error: "--item-attrs JSON 解析失败" }));
            process.exit(1);
          }
          console.log(chalk.yellow("--item-attrs JSON 解析失败"));
          return;
        }
      }

      // 检查是否有修改字段
      const hasUpdate = Object.keys(params).some(
        (k) => !["goodsListingId", "stockGoodsId", "account"].includes(k),
      );
      if (!hasUpdate) {
        if (options.json) {
          console.log(JSON.stringify({ success: false, error: "未指定需要修改的字段" }));
          process.exit(1);
        }
        console.log(chalk.yellow("未指定需要修改的字段"));
        return;
      }

      if (!options.json) console.log(chalk.cyan("正在修改商品信息..."));
      const result = await goodsApi.updateGoodsInfo(params);

      if (options.json) {
        console.log(JSON.stringify({ success: true, data: result }, null, 2));
      } else {
        console.log(chalk.green("✅ 商品信息修改成功"));
        console.log(JSON.stringify(result, null, 2));
      }
    }),
  );

  return command;
}
