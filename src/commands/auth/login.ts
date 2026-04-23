import { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import type { UserInfo, GenerateQRCodeData } from "../../types/auth.js";
import { poll } from "../../utils/polling.js";
import { type IQRCodeAuthApi, ApiClientService, QRCodeAuthApiService } from "../../services/api/index.js";
import { createStorageService, StorageService } from "../../services/storage/index.js";
import { AuthError } from "../../errors/index.js";

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const QRCodeLib = require("qrcode");

// ==================== 类型 ====================

export interface QRCodeResult {
  qrData: GenerateQRCodeData;
  unicodeQR: string;
  qrPath: string;
}

export interface LoginResult {
  userInfo: UserInfo;
  token: string;
}

// ==================== 登录服务 ====================

class LoginService {
  private authApi: IQRCodeAuthApi;
  private storage: StorageService;

  constructor(authApi?: IQRCodeAuthApi, storage?: StorageService) {
    this.authApi = authApi ?? new QRCodeAuthApiService(new ApiClientService());
    this.storage = storage ?? createStorageService();
  }

  /**
   * 步骤1: 生成二维码，返回 unicode 文本 + qrData（不含轮询）
   */
  async generateQR(): Promise<QRCodeResult> {
    const qrData = await this.authApi.generateQRCode();
    const { unicodeQR, qrPath } = await this.renderQRCode(qrData);
    return { qrData, unicodeQR, qrPath };
  }

  /**
   * 步骤2: 轮询登录状态，确认后保存凭证
   */
  async waitForLogin(
    qrToken: string,
    expireTimeMs: number,
    pollIntervalMs: number,
    signal?: AbortSignal,
  ): Promise<LoginResult> {
    try {
      const result = await poll(
        () => this.authApi.getQRCodeStatus(qrToken),
        {
          interval: pollIntervalMs,
          timeout: expireTimeMs,
          condition: (data) => {
            switch (data.status) {
              case "scanned":
                console.log(chalk.cyan(`\n🔍 已扫码: ${data.userInfo?.nickname || "未知用户"}`));
                console.log(chalk.yellow("请在 APP 上确认登录"));
                break;
              case "confirmed":
                console.log(chalk.green("\n✅ 用户已确认登录"));
                break;
              case "expired":
                console.log(chalk.red("\n⏰ 二维码已过期"));
                break;
              case "canceled":
                console.log(chalk.red("\n🚫 用户已取消登录"));
                break;
            }
            return data.status === "confirmed";
          },
        },
        signal ?? undefined,
      );

      if (result.token && result.userInfo) {
        await this.saveCredentials(result.token, result.userInfo);
        return { userInfo: result.userInfo, token: result.token };
      }

      throw new AuthError("登录失败: 未获取到凭证");
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new AuthError("登录失败: 未知错误");
    }
  }

  /**
   * 一键登录（CLI 用：串联 generateQR + waitForLogin）
   */
  async login(signal?: AbortSignal): Promise<LoginResult> {
    console.log(chalk.cyan("\n🔐 正在启动扫码登录..."));

    const { qrData, unicodeQR, qrPath } = await this.generateQR();
    console.log(chalk.green("✅ 二维码已生成\n"));
    console.log("\n📱 请使用 第二回合 扫描二维码登录\n");
    console.log(unicodeQR);
    console.log(chalk.gray(`  二维码已保存到: ${qrPath}`));
    console.log(chalk.yellow("\n⏳ 等待扫码...\n"));

    const expireTimeMs = Number.parseInt(qrData.expireTime, 10);
    const pollIntervalMs = Number.parseInt(qrData.pollInterval, 10);

    try {
      const result = await this.waitForLogin(qrData.qrToken, expireTimeMs, pollIntervalMs, signal);
      console.log(chalk.green("\n✅ 登录成功！\n"));
      this.displayUserInfo(result.userInfo);
      return result;
    } catch (error) {
      console.log("error", error);
      console.log(chalk.red("\n❌ 登录失败\n"));
      throw error;
    }
  }

  /**
   * 渲染二维码（PNG + Unicode 半块字符）
   */
  private async renderQRCode(qrData: GenerateQRCodeData): Promise<{ unicodeQR: string; qrPath: string }> {
    const qrContent = `r2://auth/login?qrToken=${qrData.qrContent}`;

    const configDir = path.join(os.homedir(), ".r2-cli");
    fs.mkdirSync(configDir, { recursive: true });
    const qrPath = path.join(configDir, "qrcode.png");
    await QRCodeLib.toFile(qrPath, qrContent, { width: 300, margin: 2 });

    const qrMatrix = QRCodeLib.create(qrContent, { errorCorrectionLevel: "L" });
    const size = qrMatrix.modules.size;
    const data = qrMatrix.modules.data;

    let unicodeQR = "";
    for (let row = 0; row < size; row += 2) {
      for (let col = 0; col < size; col++) {
        const top = data[row * size + col];
        const bottom = row + 1 < size ? data[(row + 1) * size + col] : false;
        if (top && bottom) unicodeQR += "█";
        else if (top) unicodeQR += "▀";
        else if (bottom) unicodeQR += "▄";
        else unicodeQR += " ";
      }
      unicodeQR += "\n";
    }

    return { unicodeQR, qrPath };
  }

  /**
   * 显示用户信息
   */
  private displayUserInfo(userInfo: UserInfo): void {
    const maskedMobile = userInfo.mobile.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");

    console.log(chalk.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.cyan("用户信息:"));
    console.log(chalk.white("  昵称:   ") + chalk.yellow(userInfo.nickname));
    console.log(chalk.white("  手机号: ") + chalk.yellow(maskedMobile));
    console.log(chalk.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  }

  /**
   * 保存登录凭证
   */
  private async saveCredentials(token: string, userInfo: UserInfo): Promise<void> {
    await this.storage.saveCredentials(token, userInfo);

    const credentials = await this.storage.getCredentials();
    // console.log(chalk.gray("\n💾 凭证已保存到: " + this.storage.getConfigPath()));
    // console.log(chalk.gray(`   Token: ${token.substring(0, 20)}...`));
    // console.log(chalk.gray(`   用户: ${userInfo.nickname} (${userInfo.username})`));
    // console.log(chalk.gray(`   保存时间: ${new Date(credentials!.timestamp).toLocaleString()}`));
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    console.log(chalk.cyan("\n🚪 正在退出登录..."));

    // 清除本地凭证
    await this.clearCredentials();

    console.log(chalk.green("✅ 已退出登录\n"));
  }

  /**
   * 查看登录状态
   */
  async status(): Promise<void> {
    console.log(chalk.cyan("\n📊 查看登录状态...\n"));

    const isLoggedIn = await this.storage.isLoggedIn();

    if (!isLoggedIn) {
      console.log(chalk.yellow("⚠️  尚未登录或凭证已过期\n"));
      return;
    }

    const credentials = await this.storage.getCredentials();
    const userInfo = credentials!.userInfo;
    const lastLogin = new Date(credentials!.timestamp);
    const daysSinceLogin = Math.floor((Date.now() - credentials!.timestamp) / (1000 * 60 * 60 * 24));

    console.log(chalk.green("✅ 已登录\n"));
    this.displayUserInfo(userInfo);
    console.log(chalk.gray("\n📅 最后登录: " + lastLogin.toLocaleString()));
    console.log(chalk.gray("   距离今天: " + daysSinceLogin + " 天前"));
    // console.log(chalk.gray("\n💾 配置文件: " + this.storage.getConfigPath()));
  }

  /**
   * 清除登录凭证
   */
  private async clearCredentials(): Promise<void> {
    await this.storage.clearCredentials();
    // console.log(chalk.gray("💾 凭证已从 " + this.storage.getConfigPath() + " 清除"));
  }
}

export { LoginService };

// ==================== 命令工厂 ====================

/**
 * 创建登录命令
 *
 * - `auth login`          一键登录（人类用）
 * - `auth login qr`       生成二维码，输出 JSON（AI Agent 用）
 * - `auth login poll`     轮询登录状态（AI Agent 用）
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`❌ ${errorMessage}`));
      process.exit(1);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`❌ ${errorMessage}`));
      process.exit(1);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`❌ ${errorMessage}`));
      process.exit(1);
    }
  });

  return command;
}
