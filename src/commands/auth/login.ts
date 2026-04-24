/**
 * 认证命令 — login / logout / status
 *
 * login 支持三种模式：
 * - `auth login`          一键登录（人类用）
 * - `auth login qr`       生成二维码，输出 JSON（AI Agent 用）
 * - `auth login poll`     轮询登录状态（AI Agent 用）
 */

import { Command } from "commander";
import { LoginService } from "../../services/auth/index.js";
import { handleCommandError } from "../shared.js";

/**
 * 创建登录命令
 */
export function createLoginCommand(): Command {
  const command = new Command("login");
  command.description("扫码登录 Round2AI 账户");

  // ---- qr 子命令 ----
  const qrCmd = new Command("qr")
    .description("生成登录二维码（返回 JSON，供 AI Agent 使用）")
    .action(async () => {
      try {
        const service = new LoginService();
        const { qrData, unicodeQR, qrPath } = await service.generateQR();
        const output = {
          qrToken: qrData.qrToken,
          expireTimeMs: Number.parseInt(qrData.expireTime, 10),
          pollIntervalMs: Number.parseInt(qrData.pollInterval, 10),
          qrPath,
          unicodeQR,
        };
        console.log(JSON.stringify(output, null, 2));
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(JSON.stringify({ success: false, error: msg }));
        process.exit(1);
      }
    });

  // ---- poll 子命令 ----
  const pollCmd = new Command("poll")
    .description("轮询登录状态（供 AI Agent 使用）")
    .requiredOption("--token <qrToken>", "二维码 token")
    .option("--expire <ms>", "过期时间（毫秒）", "300000")
    .option("--interval <ms>", "轮询间隔（毫秒）", "1000")
    .action(async (options: { token: string; expire: string; interval: string }) => {
      try {
        const service = new LoginService();
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          Number.parseInt(options.expire, 10),
        );

        const result = await service.waitForLogin(
          options.token,
          Number.parseInt(options.expire, 10),
          Number.parseInt(options.interval, 10),
          controller.signal,
        );
        clearTimeout(timeout);
        console.log(JSON.stringify({ success: true, ...result }));
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(JSON.stringify({ success: false, error: msg }));
        process.exit(1);
      }
    });

  command.addCommand(qrCmd);
  command.addCommand(pollCmd);

  // ---- 默认 action（无子命令时走一键登录）----
  command.option("--timeout <ms>", "超时时间（毫秒）", "300000");

  command.action(async (options: { timeout?: string }) => {
    try {
      const loginService = new LoginService();
      const controller = new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        Number.parseInt(options.timeout ?? "300000", 10),
      );

      await loginService.login(controller.signal);
      clearTimeout(timeout);
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}

/**
 * 创建登出命令
 */
export function createLogoutCommand(): Command {
  const command = new Command("logout");
  command.description("退出登录");

  command.action(async () => {
    try {
      const loginService = new LoginService();
      await loginService.logout();
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}

/**
 * 创建状态命令
 */
export function createStatusCommand(): Command {
  const command = new Command("status");
  command.description("查看登录状态");

  command.action(async () => {
    try {
      const loginService = new LoginService();
      await loginService.status();
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
