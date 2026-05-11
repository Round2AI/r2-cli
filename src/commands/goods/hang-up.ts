/**
 * 闲鱼挂售上架命令
 *
 * 完整商品信息模式：查询类目/属性 → 上传图片 → 提交挂售
 * - 子命令：categories / props / brands / upload-images / submit
 */

import { Command } from "commander";
import chalk from "chalk";
import * as goodsApi from "../../services/api/modules/goods.js";
import { jsonAction } from "../shared.js";
import type { HangUpParams, XyItemAttr } from "../../types/goods.js";

const STUFF_STATUS_MAP: Record<number, string> = {
  100: "全新",
  [-1]: "准新",
  99: "99新",
  95: "95新",
  90: "9新",
};

export function createHangUpCommand(): Command {
  const command = new Command("hang-up");
  command.description("闲鱼挂售上架（完整商品信息模式）");

  // ====== 子命令：获取类目 ======
  command.addCommand(
    new Command("categories")
      .description("获取闲鱼类目列表（大分类 → 小分类）")
      .option("--sp-biz-type <n>", "业务分类，16=奢品", "16")
      .option("--json", "输出 JSON（供 AI Agent 使用）")
      .action(jsonAction(async (options: { spBizType: string; json?: boolean }) => {
        const cats = await goodsApi.getXyCategories(Number(options.spBizType));
        if (options.json) {
          console.log(JSON.stringify(cats, null, 2));
          return;
        }
        const grouped = new Map<string, { catName: string; children: { channel: string; channelCatId: string }[] }>();
        for (const cat of cats) {
          const key = String(cat.catId);
          if (!grouped.has(key)) grouped.set(key, { catName: cat.catName, children: [] });
          grouped.get(key)!.children.push({ channel: cat.channel, channelCatId: cat.channelCatId });
        }
        for (const [, group] of grouped) {
          console.log(chalk.bold(group.catName));
          for (const child of group.children) {
            console.log(`  ${child.channel} (channelCatId: ${chalk.green(child.channelCatId)})`);
          }
        }
      })),
  );

  // ====== 子命令：获取属性 ======
  command.addCommand(
    new Command("props")
      .description("获取指定类目下的属性列表（含可选值）")
      .requiredOption("--channel-cat-id <id>", "小分类 ID（从 categories 获取）")
      .option("--json", "输出 JSON（供 AI Agent 使用）")
      .action(jsonAction(async (options: { channelCatId: string; json?: boolean }) => {
        const props = await goodsApi.getXyProps(options.channelCatId);
        if (options.json) {
          console.log(JSON.stringify(props, null, 2));
          return;
        }
        for (const prop of props) {
          console.log(chalk.bold(`\n${prop.propName} (propId: ${prop.propId})`));
          if (prop.propsValues?.length) {
            for (const val of prop.propsValues) {
              console.log(`  ${val.valueName} (valueId: ${val.valueId})`);
            }
          } else {
            console.log(chalk.gray("  （使用 brands 子命令搜索）"));
          }
        }
      })),
  );

  // ====== 子命令：品牌搜索 ======
  command.addCommand(
    new Command("brands")
      .description("搜索闲鱼品牌（按关键字过滤）")
      .requiredOption("--channel-cat-id <id>", "小分类 ID")
      .requiredOption("--prop-id <id>", "属性 ID（品牌属性的 propId）")
      .requiredOption("--key <keyword>", "搜索关键字")
      .option("--json", "输出 JSON（供 AI Agent 使用）")
      .action(jsonAction(async (options: { channelCatId: string; propId: string; key: string; json?: boolean }) => {
        const values = await goodsApi.getXyPropValues(options.channelCatId, options.propId, options.key);
        if (options.json) {
          console.log(JSON.stringify(values, null, 2));
          return;
        }
        if (!values.length) {
          console.log(chalk.yellow("未找到匹配的品牌"));
          return;
        }
        for (const val of values) {
          console.log(`  ${val.valueName} (valueId: ${val.valueId})`);
        }
      })),
  );

  // ====== 子命令：批量上传图片 ======
  command.addCommand(
    new Command("upload-images")
      .description("批量上传图片到闲鱼（挂售前必须先上传图片）")
      .requiredOption("--shop-id <id>", "店铺 ID")
      .requiredOption("--files <paths>", "图片文件路径，逗号分隔")
      .option("--json", "输出 JSON（供 AI Agent 使用）")
      .action(jsonAction(async (options: { shopId: string; files: string; json?: boolean }) => {
        const filePaths = options.files.split(",").map((p) => p.trim()).filter(Boolean);
        if (filePaths.length === 0) {
          if (options.json) {
            console.log(JSON.stringify({ success: false, error: "请提供至少一张图片" }));
            process.exit(1);
          }
          console.log(chalk.yellow("请提供至少一张图片"));
          return;
        }
        if (!options.json) console.log(chalk.cyan(`正在上传 ${filePaths.length} 张图片...`));
        const images = await goodsApi.uploadXyImages(options.shopId, filePaths);
        if (options.json) {
          console.log(JSON.stringify({ success: true, images }, null, 2));
        } else {
          console.log(chalk.green(`上传成功，共 ${images.length} 张`));
          for (const img of images) {
            console.log(`  图片ID: ${img.value}`);
          }
        }
      })),
  );

  // ====== 子命令：提交挂售 ======
  command.addCommand(
    new Command("submit")
      .description("提交挂售上架")
      .requiredOption("--shop-id <id>", "店铺 ID（即闲鱼用户名 account）")
      .requiredOption("--title <title>", "商品标题")
      .requiredOption("--price <amount>", "售价")
      .requiredOption("--category-id <id>", "大分类 ID（从 categories 获取）")
      .requiredOption("--channel-cat-id <id>", "小分类 ID（从 categories 获取）")
      .requiredOption("--image-ids <ids>", "图片 ID 列表，逗号分隔（先通过 upload-images 获取）")
      .requiredOption("--stuff-status <n>", "成色：100 全新 / -1 准新 / 99 99新 / 95 95新 / 90 9新")
      .option("--item-attrs <json>", "商品属性列表 JSON，格式: [{\"propId\":\"x\",\"valueId\":\"y\",\"valueName\":\"z\"}]")
      .option("--brand-name <name>", "品牌名称")
      .option("--desc <desc>", "商品描述")
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
        desc?: string;
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
          ...(options.desc && { desc: options.desc }),
          ...(options.size && { size: options.size }),
          ...(options.goodsNo && { goodsNo: options.goodsNo }),
          ...(options.originalPrice && { originalPrice: Number(options.originalPrice) }),
          outItemNo: options.outItemNo,
          divisionId: Number(options.divisionId) || 330100,
          ...(options.itemAttrs && { itemAttrList: JSON.parse(options.itemAttrs) as XyItemAttr[] }),
        };

        if (!options.json) {
          console.log(chalk.cyan("正在提交挂售..."));
          console.log(chalk.gray(`  标题: ${params.title}`));
          console.log(chalk.gray(`  售价: ¥${params.reservePrice}`));
          console.log(chalk.gray(`  成色: ${STUFF_STATUS_MAP[params.stuffStatus] ?? params.stuffStatus}`));
          console.log(chalk.gray(`  图片: ${imageIdList.length} 张`));
          if (params.itemAttrList?.length) {
            console.log(chalk.gray(`  属性: ${params.itemAttrList.length} 项`));
          }
        }

        const result = await goodsApi.listingHangUpXianyu(params);

        if (options.json) {
          console.log(JSON.stringify({ success: true, data: result }, null, 2));
        } else {
          console.log(chalk.green("挂售提交成功"));
          console.log(JSON.stringify(result, null, 2));
        }
      })),
  );

  return command;
}
