/**
 * 挂售子命令：批量上传图片
 */

import { Command } from "commander";
import chalk from "chalk";
import { uploadXyImages } from "../../../services/http/modules/upload.js";
import { jsonAction, validationError } from "../../shared.js";

export function createUploadImagesCommand(): Command {
  return new Command("upload-images")
    .description("批量上传图片到闲鱼（挂售前必须先上传图片）")
    .requiredOption("--shop-id <id>", "店铺 ID")
    .requiredOption("--files <paths>", "图片文件路径，逗号分隔")
    .option("--json", "输出 JSON（供 AI Agent 使用）")
    .action(jsonAction(async (options: { shopId: string; files: string; json?: boolean }) => {
      const filePaths = options.files.split(",").map((p) => p.trim()).filter(Boolean);
      if (filePaths.length === 0) {
        validationError(options, "请提供至少一张图片");
        return;
      }
      if (!options.json) console.log(chalk.cyan(`正在上传 ${filePaths.length} 张图片...`));
      const { images, failed } = await uploadXyImages(options.shopId, filePaths);
      if (options.json) {
        const output: Record<string, unknown> = { success: true, images };
        if (failed.length) {
          output.warning = `${failed.length} 张图片上传失败`;
          output.failed = failed;
        }
        console.log(JSON.stringify(output, null, 2));
      } else {
        if (images.length) {
          console.log(chalk.green(`上传成功，共 ${images.length} 张`));
          for (const img of images) {
            console.log(`  图片ID: ${img.value}`);
          }
        }
        if (failed.length) {
          console.log(chalk.yellow(`\n${failed.length} 张上传失败:`));
          for (const f of failed) {
            console.log(`  ${f.file}: ${f.error}`);
          }
        }
      }
    }));
}
