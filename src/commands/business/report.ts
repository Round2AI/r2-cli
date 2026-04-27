/**
 * 报告命令
 */

import { Command } from "commander";
import { notImplemented } from "../shared.js";

export function createReportCommand(): Command {
  const command = new Command("generate");
  command.description("生成经营报告");
  command.option("--type <type>", "报告类型: daily, weekly", "daily");
  command.action(() => notImplemented("report generate"));
  return command;
}
