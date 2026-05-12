/**
 * 命令设置模块
 */

import { Command } from "commander";

import { createLoginCommand, createLogoutCommand, createStatusCommand, createXianyuAuthCommand } from "./auth/index.js";
import { createGoodsCommand } from "./goods/index.js";
import { createUninstallCommand } from "./uninstall.js";
import { createUpdateCommand } from "./update.js";

export function setupCommands(program: Command): void {
  const authCommand = program.command("auth").description("授权管理");
  authCommand.addCommand(createLoginCommand());
  authCommand.addCommand(createLogoutCommand());
  authCommand.addCommand(createStatusCommand());
  authCommand.addCommand(createXianyuAuthCommand());

  program.addCommand(createGoodsCommand());
  program.addCommand(createUninstallCommand());
  program.addCommand(createUpdateCommand());
}
