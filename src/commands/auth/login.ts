/**
 * 登录命令
 *
 * 支持两种模式：
 * - `auth login`           一键登录（人类）
 * - `auth login --json`    生成二维码并自动轮询，输出 JSON（AI Agent）
 * - `auth login poll`      轮询登录状态（AI Agent 备选）
 */

import { Command } from "commander";
import { getLoginService } from "../../services/auth/index.js";
import { handleCommandError, agentAction } from "../shared.js";
import { runQRJsonFlow } from "./qr-flow.js";

export function createLoginCommand(): Command {
  const command = new Command("login");
  command
    .description("扫码登录 Round2AI 账户")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

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

  command.addCommand(pollCmd);

  command.action(async (options: { json?: boolean }) => {
    try {
      if (options.json) {
        await runQRJsonFlow({
          generate: async () => {
            const service = getLoginService();
            const { qrData, qrUrl, setStatus, closeServer } = await service.generateQR();
            const expireMs = Number.parseInt(qrData.expireTime, 10);
            const intervalMs = Number.parseInt(qrData.pollInterval, 10);
            return {
              qrInfo: {
                qrToken: qrData.qrToken,
                expireTimeMs: expireMs,
                pollIntervalMs: intervalMs,
                qrUrl,
              },
              qrUrl,
              setStatus,
              closeServer,
              waitArgs: { qrToken: qrData.qrToken, expireMs, intervalMs },
            };
          },
          waitResult: ({ qrToken, expireMs, intervalMs }, setStatus) =>
            getLoginService().waitForLogin(qrToken, expireMs, intervalMs, undefined, setStatus, true),
          formatSuccess: (result) => ({ success: true, userInfo: result.userInfo }),
        });
      } else {
        await getLoginService().login();
      }
    } catch (error) {
      if (options.json) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(JSON.stringify({ success: false, error: msg }));
        process.exit(1);
      }
      handleCommandError(error);
    }
  });

  return command;
}
