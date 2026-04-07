/**
 * 库存风险命令 - 简化版
 */

import { Command } from "commander";

/**
 * 创建库存风险命令
 */
export function createInventoryRiskCommand(container: any): Command {
  const command = new Command("risk");
  command.description("库存风险识别");

  command.action(() => {
    console.log("库存风险识别功能开发中...");
  });

  return command;
}