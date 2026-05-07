/**
 * 闲鱼店铺授权命令
 *
 * 支持三种模式：
 * - `auth xianyu`         一键授权（人类用）
 * - `auth xianyu qr`      获取授权二维码，输出 JSON（AI Agent 用）
 * - `auth xianyu poll`    轮询授权状态（AI Agent 用）
 */

import { Command } from "commander";
import { getXianyuAuthService } from "../../services/auth/xianyu-auth.js";
import { handleCommandError } from "../shared.js";

export function createXianyuAuthCommand(): Command {
  const command = new Command("xianyu");
  command.description("闲鱼店铺授权");

  const qrCmd = new Command("qr")
    .description("获取闲鱼授权二维码（返回 JSON，供 AI Agent 使用）")
    .action(async () => {
      try {
        const service = getXianyuAuthService();
        const { authData, unicodeQR, qrPath } = await service.generateAuthQR();
        console.log(
          JSON.stringify(
            {
              state: authData.state,
              url: authData.url,
              expireTimeMs: authData.expireTime ? Number.parseInt(authData.expireTime, 10) : 300000,
              pollIntervalMs: authData.pollInterval ? Number.parseInt(authData.pollInterval, 10) : 1000,
              qrPath,
              unicodeQR,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(JSON.stringify({ success: false, error: msg }));
        process.exit(1);
      }
    });

  const pollCmd = new Command("poll")
    .description("轮询闲鱼授权状态（供 AI Agent 使用）")
    .requiredOption("--state <state>", "授权轮询 token")
    .option("--expire <ms>", "过期时间（毫秒）", "300000")
    .option("--interval <ms>", "轮询间隔（毫秒）", "1000")
    .action(async (options: { state: string; expire: string; interval: string }) => {
      try {
        const service = getXianyuAuthService();
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          Number.parseInt(options.expire, 10),
        );

        const result = await service.waitForAuth(
          options.state,
          Number.parseInt(options.expire, 10),
          Number.parseInt(options.interval, 10),
          controller.signal,
        );
        clearTimeout(timeout);

        if (result.status === "success") {
          console.log(JSON.stringify({ success: true, shopId: result.shopId, shopName: result.shopName }));
        } else {
          console.error(JSON.stringify({ success: false, error: `授权状态: ${result.status}` }));
          process.exit(1);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(JSON.stringify({ success: false, error: msg }));
        process.exit(1);
      }
    });

  command.addCommand(qrCmd);
  command.addCommand(pollCmd);

  command.action(async () => {
    try {
      const service = getXianyuAuthService();
      await service.authorize();
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
