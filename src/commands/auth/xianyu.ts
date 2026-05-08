/**
 * 闲鱼店铺授权命令
 *
 * 支持三种模式：
 * - `auth xianyu`         一键授权
 * - `auth xianyu qr`      获取授权二维码，输出 JSON（AI Agent 用）
 * - `auth xianyu poll`    轮询授权状态（AI Agent 用）
 */

import { Command } from "commander";
import { generateAuthQR, waitForAuth, authorize, pollAuthPageStatus } from "../../services/auth/xianyu-auth.js";
import { handleCommandError, agentAction, agentError } from "../shared.js";

export function createXianyuAuthCommand(): Command {
  const command = new Command("xianyu");
  command.description("闲鱼店铺授权");

  const qrCmd = new Command("qr")
    .description("获取闲鱼授权二维码（返回 JSON，供 AI Agent 使用）")
    .action(agentAction(async () => {
      const { authData, ...output } = await generateAuthQR();
      const expireMs = authData.expireTime ? Number.parseInt(authData.expireTime, 10) : 300000;
      const intervalMs = authData.pollInterval ? Number.parseInt(authData.pollInterval, 10) : 1000;
      console.log(JSON.stringify({
        state: authData.state,
        expireTimeMs: expireMs,
        pollIntervalMs: intervalMs,
        ...output,
      }, null, 2));
      // 后台轮询：更新页面状态，完成后延迟关闭服务器
      pollAuthPageStatus(authData.state, expireMs, intervalMs, output.setStatus)
        .then(() => { setTimeout(output.closeServer, 3000); })
        .catch(() => { output.closeServer(); });
    }));

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

  command.addCommand(qrCmd);
  command.addCommand(pollCmd);

  command.action(async () => {
    try {
      await authorize();
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
