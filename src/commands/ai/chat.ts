/**
 * AI 聊天命令
 */

import { Command } from "commander";
import { notImplemented } from "../shared.js";

export function createChatCommand(): Command {
  const command = new Command("chat");
  command.description("与 AI 助手聊天，获取经营建议");
  command.action(() => notImplemented("ai chat"));
  return command;
}
