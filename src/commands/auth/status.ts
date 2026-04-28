/**
 * 登录状态命令
 */

import { Command } from "commander";
import { getLoginService } from "../../services/auth/index.js";
import { handleCommandError } from "../shared.js";

export function createStatusCommand(): Command {
  const command = new Command("status");
  command.description("查看登录状态");

  command.action(async () => {
    try {
      const loginService = getLoginService();
      await loginService.status();
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
