/**
 * 报告命令 - 简化版
 */

import { Command } from "commander";

/**
 * 创建报告命令
 */
export function createReportCommand(container: any): Command {
  const command = new Command("report");
  command.description("生成经营日报/周报");

  command.action(() => {
    console.log("报告生成功能开发中...");
  });

  return command;
}