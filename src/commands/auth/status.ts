/**
 * 登录状态命令
 */

import { Command } from "commander";
import { getLoginService } from "../../services/auth/index.js";
import { jsonAction, jsonSuccess } from "../shared.js";

export function createStatusCommand(): Command {
  const command = new Command("status");
  command
    .description("查看登录状态")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(jsonAction(async (options) => {
    if (options.json) {
      const { getAuthStorage } = await import("../../services/storage/index.js");
      const storage = getAuthStorage();
      const isLoggedIn = await storage.isLoggedIn();
      if (!isLoggedIn) {
        jsonSuccess(options, { loggedIn: false }, "未登录");
        return;
      }
      const credentials = await storage.getCredentials();
      jsonSuccess(options, {
        loggedIn: true,
        userInfo: credentials!.userInfo,
        timestamp: credentials!.timestamp,
      });
    } else {
      const loginService = getLoginService();
      await loginService.status();
    }
  }));

  return command;
}
