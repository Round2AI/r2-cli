/**
 * 登出命令
 */

import { Command } from "commander";
import { getLoginService } from "../../services/auth/index.js";
import { handleCommandError } from "../shared.js";

export function createLogoutCommand(): Command {
  const command = new Command("logout");
  command.description("退出登录");

  command.action(async () => {
    try {
      const loginService = getLoginService();
      await loginService.logout();
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
