/**
 * 挂售子命令：品牌搜索
 */

import { Command } from "commander";
import chalk from "chalk";
import { getXyPropValues } from "../../../services/http/modules/categories.js";
import { jsonAction } from "../../shared.js";

export function createBrandsCommand(): Command {
  return new Command("brands")
    .description("搜索闲鱼品牌（按关键字过滤）")
    .requiredOption("--channel-cat-id <id>", "小分类 ID")
    .requiredOption("--prop-id <id>", "属性 ID（品牌属性的 propId）")
    .requiredOption("--key <keyword>", "搜索关键字")
    .option("--json", "输出 JSON（供 AI Agent 使用）")
    .action(jsonAction(async (options: { channelCatId: string; propId: string; key: string; json?: boolean }) => {
      const values = await getXyPropValues(options.channelCatId, options.propId, options.key);
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
    }));
}
