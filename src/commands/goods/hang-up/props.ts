/**
 * 挂售子命令：获取属性
 */

import { Command } from "commander";
import chalk from "chalk";
import { getXyProps } from "../../../services/http/modules/categories.js";
import { jsonAction } from "../../shared.js";

export function createPropsCommand(): Command {
  return new Command("props")
    .description("获取指定类目下的属性列表（含可选值）")
    .requiredOption("--channel-cat-id <id>", "小分类 ID（从 categories 获取）")
    .option("--json", "输出 JSON（供 AI Agent 使用）")
    .action(jsonAction(async (options: { channelCatId: string; json?: boolean }) => {
      const props = await getXyProps(options.channelCatId);
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
    }));
}
