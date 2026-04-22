/**
 * 库存风险命令
 */

import { Command } from "commander";
import chalk from "chalk";

export function createRiskCommand(): Command {
  const command = new Command("risk");
  command.description("库存风险识别");
  command.option("--warehouse <warehouse>", "仓库代码");

  command.action(() => {
    console.log(chalk.yellow('⚠️  "inventory risk" 功能开发中，暂不可用'));
  });

  return command;
}
