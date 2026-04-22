/**
 * 扫码登录命令实现
 *
 * 参考 claude-code 的查询执行模式，实现完整的扫码登录流程：
 * 1. 生成二维码
 * 2. 显示二维码（使用终端 ASCII 艺术或链接）
 * 3. 轮询查询状态
 * 4. 等待用户扫码确认
 * 5. 保存登录凭证
 */

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

// 动态导入（CommonJS 包）
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const QRCode = require("qrcode-terminal");
const QRCodeLib = require("qrcode");

// ==================== 登录服务 ====================

/**
 * 登录服务类
 */
class LoginService {
  private authApi: IQRCodeAuthApi;
  private storage: StorageService;

  constructor(authApi?: IQRCodeAuthApi, storage?: StorageService) {
    this.authApi = authApi ?? new QRCodeAuthApiService(new ApiClientService());
    this.storage = storage ?? createStorageService();
  }

  /**
   * 执行扫码登录
   */
  async login(signal?: AbortSignal): Promise<{ userInfo: UserInfo; token: string }> {
    console.log(chalk.cyan("\n🔐 正在启动扫码登录..."));

    // 1. 生成二维码
    const qrData = await this.authApi.generateQRCode();
    console.log(chalk.green("✅ 二维码已生成\n"));

    // 2. 显示二维码
    await this.displayQRCode(qrData);

    // 3. 轮询登录状态
    const expireTimeMs = Number.parseInt(qrData.expireTime, 10);
    const pollIntervalMs = Number.parseInt(qrData.pollInterval, 10);

    try {
      const result = await poll(
        () => this.authApi.getQRCodeStatus(qrData.qrToken),
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

      // 4. 保存登录凭证
      if (result.token && result.userInfo) {
        await this.saveCredentials(result.token, result.userInfo);

        console.log(chalk.green("\n✅ 登录成功！\n"));
        this.displayUserInfo(result.userInfo);

        return { userInfo: result.userInfo, token: result.token };
      }

      throw new AuthError("登录失败: 未获取到凭证");
    } catch (error) {
      console.log("error", error);
      console.log(chalk.red("\n❌ 登录失败\n"));

      if (error instanceof Error) {
        throw error;
      }

      throw new AuthError("登录失败: 未知错误");
    }
  }

  /**
   * 显示二维码
   */
  private async displayQRCode(qrData: GenerateQRCodeData): Promise<void> {
    const qrContent = `r2://auth/login?qrToken=${qrData.qrContent}`;

    console.log(chalk.yellow("📱 请使用 第二回合 扫描二维码登录\n"));

    // 终端显示
    QRCode.generate(qrContent, { small: true });

    // 保存到 ~/.r2-cli/qrcode.png
    const configDir = path.join(os.homedir(), ".r2-cli");
    fs.mkdirSync(configDir, { recursive: true });
    const qrPath = path.join(configDir, "qrcode.png");
    await QRCodeLib.toFile(qrPath, qrContent, { width: 300, margin: 2 });

    console.log(chalk.gray(`\n  二维码已保存到: ${qrPath}`));
    console.log(chalk.yellow("\n⏳ 等待扫码..."));
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

// ==================== 命令工厂 ====================

/**
 * 创建登录命令
 */
export function createLoginCommand(): Command {
  const command = new Command("login");
  command.description("扫码登录 Round2AI 账户");

  command.option("--timeout <ms>", "超时时间（毫秒）", "300000");
  command.option("--debug", "启用调试模式", false);

  command.action(async (options: { timeout?: string; debug?: boolean }) => {
    try {
      const loginService = new LoginService();
      const controller = new AbortController();

      // 设置超时
      const timeout = setTimeout(
        () => {
          controller.abort();
        },
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
