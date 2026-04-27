/**
 * 商品上架命令
 *
 * 支持两种模式：
 * 1. 交互式向导：`r2-cli goods up`（人类使用）
 * 2. 分步执行：`r2 goods up info|categories|props|submit`（AI Agent 使用）
 */

import { Command } from "commander";
import { UpFlowService } from "../../../services/platform/up-flow/index.js";
import { handleCommandError } from "../../shared.js";
import { createUpInfoCommand } from "./info.js";
import { createUpCategoriesCommand } from "./categories.js";
import { createUpPropsCommand } from "./props.js";
import { createUpSubmitCommand } from "./submit.js";
import { createUpAddressCommand } from "./address.js";

export function createUpCommand(): Command {
  const command = new Command("up");
  command.description("上架商品（交互式向导）");

  command.action(async () => {
    try {
      const flow = new UpFlowService();
      await flow.run();
    } catch (error) {
      handleCommandError(error);
    }
  });

  // AI Agent 子命令
  command.addCommand(createUpInfoCommand());
  command.addCommand(createUpCategoriesCommand());
  command.addCommand(createUpPropsCommand());
  command.addCommand(createUpSubmitCommand());
  command.addCommand(createUpAddressCommand());

  return command;
}
