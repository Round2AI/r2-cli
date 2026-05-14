/**
 * 登出命令
 */

import { Command } from "commander";
import { getLoginService } from "../../services/auth/index.js";
import { jsonAction, jsonSuccess } from "../shared.js";

export function createLogoutCommand(): Command {
  const command = new Command("logout");
  command
    .description("退出登录")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(jsonAction(async (options) => {
    if (options.json) {
      const { getAuthStorage } = await import("../../services/storage/index.js");
      await getAuthStorage().clearCredentials();
      jsonSuccess(options, null, "已退出登录");
    } else {
      const loginService = getLoginService();
      await loginService.logout();
    }
  }));

  return command;
}
