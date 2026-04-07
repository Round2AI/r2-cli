/**
 * AI 聊天命令 - 简化版
 */

import { Command } from "commander";

/**
 * 创建聊天命令
 */
export function createChatCommand(container: any): Command {
  const command = new Command("chat");
  command.description("与 AI 助手聊天，获取经营建议");

  command.action(() => {
    console.log("AI 聊天功能开发中...");
  });

  return command;
}