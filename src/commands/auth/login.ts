/**
 * 登录命令
 *
 * 支持三种模式：
 * - `auth login`          一键登录
 * - `auth login qr`       生成二维码，输出 JSON（AI Agent 用）
 * - `auth login poll`     轮询登录状态（AI Agent 用）
 */

import { Command } from "commander";
import { getLoginService } from "../../services/auth/index.js";
import { handleCommandError, agentAction } from "../shared.js";

export function createLoginCommand(): Command {
  const command = new Command("login");
  command.description("扫码登录 Round2AI 账户");

  const qrCmd = new Command("qr")
    .description("生成登录二维码（返回 JSON，供 AI Agent 使用）")
    .action(agentAction(async () => {
      const service = getLoginService();
      const { qrData, ...output } = await service.generateQR();
      const expireMs = Number.parseInt(qrData.expireTime, 10);
      const intervalMs = Number.parseInt(qrData.pollInterval, 10);
      console.log(JSON.stringify({
        qrToken: qrData.qrToken,
        expireTimeMs: expireMs,
        pollIntervalMs: intervalMs,
        ...output,
      }, null, 2));
      // 后台轮询：更新页面状态，完成后延迟关闭服务器
      service.pollPageStatus(qrData.qrToken, expireMs, intervalMs, output.setStatus)
        .then(() => { setTimeout(output.closeServer, 3000); })
        .catch(() => { output.closeServer(); });
    }));

  const pollCmd = new Command("poll")
    .description("轮询登录状态（供 AI Agent 使用）")
    .requiredOption("--token <qrToken>", "二维码 token")
    .option("--expire <ms>", "过期时间（毫秒）", "300000")
    .option("--interval <ms>", "轮询间隔（毫秒）", "1000")
    .action(agentAction(async (options: { token: string; expire: string; interval: string }) => {
      const service = getLoginService();
      const result = await service.waitForLogin(
        options.token,
        Number.parseInt(options.expire, 10),
        Number.parseInt(options.interval, 10),
      );
      console.log(JSON.stringify({ success: true, ...result }));
    }));

  command.addCommand(qrCmd);
  command.addCommand(pollCmd);

  command.action(async () => {
    try {
      await getLoginService().login();
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
