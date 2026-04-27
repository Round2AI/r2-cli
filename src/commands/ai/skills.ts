/**
 * AI 技能管理命令
 */

import { Command } from "commander";
import { notImplemented } from "../shared.js";

export function createSkillsCommand(): Command {
  const command = new Command("skills");
  command.description("AI Agent 技能管理");
  command.action(() => notImplemented("ai skills"));
  return command;
}
