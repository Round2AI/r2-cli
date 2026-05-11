/**
 * 闲鱼挂售上架命令
 *
 * 完整商品信息模式：上传图片 → 提交挂售
 * - 人类模式：交互式上传图片 + 填写商品信息
 * - Agent 模式：upload-images 子命令上传图片 → 主命令提交挂售
 */

import { Command } from "commander";
import chalk from "chalk";
import * as goodsApi from "../../services/api/modules/goods.js";
import { handleCommandError, agentAction } from "../shared.js";
import type { HangUpParams } from "../../types/goods.js";

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

  // 子命令：批量上传图片
  const uploadImagesCmd = new Command("upload-images")
    .description("批量上传图片到闲鱼（挂售前必须先上传图片）")
    .requiredOption("--shop-id <id>", "店铺 ID")
    .requiredOption("--files <paths>", "图片文件路径，逗号分隔")
    .option("--json", "输出 JSON（供 AI Agent 使用）")
    .action(async (options: { shopId: string; files: string; json?: boolean }) => {
      try {
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
            console.log(`  图片ID: ${img.imageId}${img.width ? ` (${img.width}x${img.height})` : ""}`);
          }
        }
      } catch (error) {
        if (options.json) {
          const msg = error instanceof Error ? error.message : String(error);
          console.log(JSON.stringify({ success: false, error: msg }));
          process.exit(1);
        }
        handleCommandError(error);
      }
    });

  command.addCommand(uploadImagesCmd);

  // 主命令：提交挂售
  command
    .option("--shop-id <id>", "店铺 ID（即闲鱼用户名 account）")
    .option("--title <title>", "商品标题")
    .option("--price <amount>", "售价")
    .option("--category-id <id>", "大分类 ID")
    .option("--channel-cat-id <id>", "小分类 ID")
    .option("--image-ids <ids>", "图片 ID 列表，逗号分隔（先通过 upload-images 获取）")
    .option("--stuff-status <n>", "成色：100 全新 / -1 准新 / 99 99新 / 95 95新 / 90 9新")
    .option("--brand-name <name>", "品牌名称")
    .option("--desc <desc>", "商品描述")
    .option("--size <size>", "尺码")
    .option("--goods-no <no>", "货号")
    .option("--original-price <amount>", "原价")
    .option("--trade-type <n>", "交易方式：0 仅在线 / 1 仅线下 / 2 线上或线下", "0")
    .option("--transport-fee <amount>", "运费（默认 0 包邮）", "0")
    .option("--yhb", "是否开启验货宝")
    .option("--out-item-no <no>", "商家编码（同店铺唯一）")
    .option("--json", "输出 JSON（供 AI Agent 使用）")
    .action(async (options: {
      shopId?: string;
      title?: string;
      price?: string;
      categoryId?: string;
      channelCatId?: string;
      imageIds?: string;
      stuffStatus?: string;
      brandName?: string;
      desc?: string;
      size?: string;
      goodsNo?: string;
      originalPrice?: string;
      tradeType: string;
      transportFee: string;
      yhb?: boolean;
      outItemNo?: string;
      json?: boolean;
    }) => {
      try {
        // Agent 模式：缺少必填参数时直接返回 JSON 错误
        const required: Record<string, string | undefined> = {
          "--shop-id": options.shopId,
          "--title": options.title,
          "--price": options.price,
          "--category-id": options.categoryId,
          "--channel-cat-id": options.channelCatId,
          "--image-ids": options.imageIds,
          "--stuff-status": options.stuffStatus,
        };
        const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
        if (missing.length > 0) {
          const msg = `缺少必填参数：${missing.join(", ")}`;
          if (options.json) {
            console.log(JSON.stringify({ success: false, error: msg }));
            process.exit(1);
          }
          console.log(chalk.yellow(msg));
          return;
        }

        const imageIdList = options.imageIds!.split(",").map((id) => Number(id.trim()));
        const params: HangUpParams = {
          account: options.shopId!,
          title: options.title!,
          reservePrice: Number(options.price),
          categoryId: Number(options.categoryId),
          channelCatId: options.channelCatId!,
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
          ...(options.outItemNo && { outItemNo: options.outItemNo }),
        };

        if (!options.json) {
          console.log(chalk.cyan("正在提交挂售..."));
          console.log(chalk.gray(`  标题: ${params.title}`));
          console.log(chalk.gray(`  售价: ¥${params.reservePrice}`));
          console.log(chalk.gray(`  成色: ${STUFF_STATUS_MAP[params.stuffStatus] ?? params.stuffStatus}`));
          console.log(chalk.gray(`  图片: ${imageIdList.length} 张`));
        }

        const result = await goodsApi.listingHangUpXianyu(params);

        if (options.json) {
          console.log(JSON.stringify({ success: true, data: result }, null, 2));
        } else {
          console.log(chalk.green("挂售提交成功"));
          console.log(JSON.stringify(result, null, 2));
        }
      } catch (error) {
        if (options.json) {
          const msg = error instanceof Error ? error.message : String(error);
          console.log(JSON.stringify({ success: false, error: msg }));
          process.exit(1);
        }
        handleCommandError(error);
      }
    });

  return command;
}
