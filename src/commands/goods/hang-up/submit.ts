/**
 * 挂售子命令：提交挂售
 */

import { Command } from "commander";
import chalk from "chalk";
import { listingHangUpXianyu } from "../../../services/http/modules/listing.js";
import { jsonAction, jsonSuccess } from "../../shared.js";
import type { HangUpParams, XyItemAttr } from "../../../types/goods.js";

const STUFF_STATUS_MAP: Record<number, string> = {
  100: "全新",
  [-1]: "准新",
  99: "99新",
  95: "95新",
  90: "9新",
};

export function createSubmitCommand(): Command {
  return new Command("submit")
    .description("提交挂售上架")
    .requiredOption("--shop-id <id>", "店铺 ID（即闲鱼用户名 account）")
    .requiredOption("--title <title>", "商品标题")
    .requiredOption("--price <amount>", "售价")
    .requiredOption("--category-id <id>", "大分类 ID（从 categories 获取）")
    .requiredOption("--channel-cat-id <id>", "小分类 ID（从 categories 获取）")
    .requiredOption("--image-ids <ids>", "图片 ID 列表，逗号分隔（先通过 upload-images 获取）")
    .requiredOption("--stuff-status <n>", "成色：100 全新 / -1 准新 / 99 99新 / 95 95新 / 90 9新")
    .option("--item-attrs <json>", "商品属性列表 JSON，格式: [{\"valueName\":\"x\",\"valueId\":\"y\",\"propId\":\"z\"}]")
    .option("--brand-name <name>", "品牌名称")
    .requiredOption("--desc <desc>", "商品描述")
    .option("--size <size>", "尺码")
    .option("--goods-no <no>", "货号")
    .option("--original-price <amount>", "原价")
    .option("--trade-type <n>", "交易方式：0 仅在线 / 1 仅线下 / 2 线上或线下", "0")
    .option("--transport-fee <amount>", "运费（默认 0 包邮）", "0")
    .option("--yhb", "是否开启验货宝")
    .requiredOption("--out-item-no <no>", "商家编码（同店铺唯一，用户自定义）")
    .option("--division-id <id>", "行政区划 ID（市级 ID，默认杭州 330100）", "330100")
    .option("--json", "输出 JSON（供 AI Agent 使用）")
    .action(jsonAction(async (options: {
      shopId: string;
      title: string;
      price: string;
      categoryId: string;
      channelCatId: string;
      imageIds: string;
      stuffStatus: string;
      itemAttrs?: string;
      brandName?: string;
      desc: string;
      size?: string;
      goodsNo?: string;
      originalPrice?: string;
      tradeType: string;
      transportFee: string;
      yhb?: boolean;
      outItemNo: string;
      divisionId: string;
      json?: boolean;
    }) => {
      const imageIdList = options.imageIds.split(",").map((id) => id.trim());
      const parsedAttrs = options.itemAttrs ? JSON.parse(options.itemAttrs) as XyItemAttr[] : undefined;
      const params: HangUpParams = {
        account: options.shopId,
        title: options.title,
        reservePrice: Number(options.price),
        categoryId: Number(options.categoryId),
        channelCatId: options.channelCatId,
        imageIdList,
        stuffStatus: Number(options.stuffStatus),
        itemBizType: 2,
        spBizType: "16",
        tradeType: Number(options.tradeType) || 0,
        transportFee: Number(options.transportFee) || 0,
        yhb: options.yhb ?? false,
        ...(options.brandName && { brandName: options.brandName }),
        desc: options.desc,
        ...(options.size && { size: options.size }),
        ...(options.goodsNo && { goodsNo: options.goodsNo }),
        ...(options.originalPrice && { originalPrice: Number(options.originalPrice) }),
        ...(parsedAttrs?.length && { itemAttrList: parsedAttrs }),
        outItemNo: options.outItemNo,
        divisionId: Number(options.divisionId) || 330100,
        apiAfterSalesDo: {
          supportFd10msPolicy: false,
          supportFd24hsPolicy: false,
          supportNfrPolicy: false,
          supportSdrPolicy: false,
          supportVnrPolicy: false,
          supportGpaPolicy: false,
          supportFd48hsPolicy: false,
        },
      };

      if (!options.json) {
        console.log(chalk.cyan("正在提交挂售..."));
        console.log(chalk.gray(`  标题: ${params.title}`));
        console.log(chalk.gray(`  售价: ¥${params.reservePrice}`));
        console.log(chalk.gray(`  成色: ${STUFF_STATUS_MAP[params.stuffStatus] ?? params.stuffStatus}`));
        console.log(chalk.gray(`  图片: ${imageIdList.length} 张`));
        if (parsedAttrs?.length) {
          console.log(chalk.gray(`  属性: ${parsedAttrs.length} 项`));
        }
      }

      const result = await listingHangUpXianyu(params);

      jsonSuccess(options, result, "挂售提交成功");
    }));
}
