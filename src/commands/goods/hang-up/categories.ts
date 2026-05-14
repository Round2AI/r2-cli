/**
 * 挂售子命令：获取类目
 */

import { Command } from "commander";
import chalk from "chalk";
import { getXyCategories } from "../../../services/http/modules/categories.js";
import { jsonAction } from "../../shared.js";

export function createCategoriesCommand(): Command {
  return new Command("categories")
    .description("获取闲鱼类目列表（大分类 → 小分类）")
    .option("--sp-biz-type <n>", "业务分类，16=奢品", "16")
    .option("--json", "输出 JSON（供 AI Agent 使用）")
    .action(jsonAction(async (options: { spBizType: string; json?: boolean }) => {
      const cats = await getXyCategories(Number(options.spBizType));
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
      for (const [catId, group] of grouped) {
        console.log(chalk.bold(`${group.catName} (catId: ${chalk.green(catId)})`));
        for (const child of group.children) {
          console.log(`  ${child.channel} (channelCatId: ${chalk.green(child.channelCatId)})`);
        }
      }
    }));
}
