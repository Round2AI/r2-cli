/**
 * 报告命令
 */

import { Command } from "commander";
import chalk from "chalk";

export function createReportCommand(): Command {
  const command = new Command("generate");
  command.description("生成经营报告");
  command.option("--type <type>", "报告类型: daily, weekly", "daily");

  command.action(() => {
    console.log(chalk.yellow('⚠️  "report generate" 功能开发中，暂不可用'));
  });

  return command;
}
