/**
 * 库存风险命令
 */

import { Command } from "commander";
import { notImplemented } from "../shared.js";

export function createRiskCommand(): Command {
  const command = new Command("risk");
  command.description("库存风险识别");
  command.option("--warehouse <warehouse>", "仓库代码");
  command.action(() => notImplemented("inventory risk"));
  return command;
}
