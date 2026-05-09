/**
 * 闲鱼店铺授权命令
 *
 * 支持两种模式：
 * - `auth xianyu`          一键授权（人类）
 * - `auth xianyu --json`   获取授权二维码并自动轮询，输出 JSON（AI Agent）
 * - `auth xianyu poll`     轮询授权状态（AI Agent 备选）
 */

import { Command } from "commander";
import { generateAuthQR, waitForAuth, authorize } from "../../services/auth/xianyu-auth.js";
import { openUrl } from "../../qr-server/index.js";
import { handleCommandError, agentAction, agentError } from "../shared.js";

export function createXianyuAuthCommand(): Command {
  const command = new Command("xianyu");
  command
    .description("闲鱼店铺授权")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

  const pollCmd = new Command("poll")
    .description("轮询闲鱼授权状态（供 AI Agent 使用）")
    .requiredOption("--state <state>", "授权轮询 token")
    .option("--expire <ms>", "过期时间（毫秒）", "300000")
    .option("--interval <ms>", "轮询间隔（毫秒）", "1000")
    .action(agentAction(async (options: { state: string; expire: string; interval: string }) => {
      const result = await waitForAuth(
        options.state,
        Number.parseInt(options.expire, 10),
        Number.parseInt(options.interval, 10),
      );

      if (result.status === "success") {
        console.log(JSON.stringify({ success: true, shopId: result.shopId, shopName: result.shopName }));
      } else {
        agentError(`授权状态: ${result.status}`);
      }
    }));

  command.addCommand(pollCmd);

  command.action(async (options: { json?: boolean }) => {
    try {
      if (options.json) {
        const { authData, qrUrl, setStatus, closeServer } = await generateAuthQR();
        const expireMs = authData.expireTime ? Number.parseInt(authData.expireTime, 10) : 300000;
        const intervalMs = authData.pollInterval ? Number.parseInt(authData.pollInterval, 10) : 1000;
        console.log(JSON.stringify({
          state: authData.state,
          expireTimeMs: expireMs,
          pollIntervalMs: intervalMs,
          qrUrl,
        }, null, 2));
        openUrl(qrUrl);
        try {
          const result = await waitForAuth(authData.state, expireMs, intervalMs, undefined, setStatus);
          if (result.status === "success") {
            console.log(JSON.stringify({ success: true, shopId: result.shopId, shopName: result.shopName }));
          } else {
            console.log(JSON.stringify({ success: false, error: `授权状态: ${result.status}` }));
            process.exit(1);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.log(JSON.stringify({ success: false, error: msg }));
          process.exit(1);
        } finally {
          setTimeout(closeServer, 1000);
        }
      } else {
        await authorize();
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
