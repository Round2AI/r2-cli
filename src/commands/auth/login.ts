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

import type { Command } from "commander";
import chalk from "chalk";
import type { UserInfo, QRCodeStatus, GenerateQRCodeData } from "../../types/auth.js";
import { executePollingQuery, type QueryDefinition } from "../../query/executor.js";
import { createQRCodeAuthApi, createApiClient } from "../../services/api/client.js";
import { createStorageService } from "../../services/storage/index.js";

// 动态导入 qrcode-terminal（CommonJS）
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const qrcodeTerminal = require("qrcode-terminal");

// ==================== 登录服务 ====================

/**
 * 登录服务类
 */
class LoginService {
  private apiClient: ReturnType<typeof createApiClient>;
  private authApi: ReturnType<typeof createQRCodeAuthApi>;
  private storage = createStorageService();

  constructor() {
    this.apiClient = createApiClient();
    this.authApi = createQRCodeAuthApi(this.apiClient);
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
    this.displayQRCode(qrData);

    // 3. 构建轮询查询
    const query: QueryDefinition<{ status: QRCodeStatus; userInfo: UserInfo | null; token: string | null }> = {
      id: "qrcode-status-poll",
      description: "查询二维码登录状态",
      deps: {
        signal: signal ?? null,
        uuid: () => Math.random().toString(36),
        api: {
          get: async <T = unknown>(url: string): Promise<T> => {
            // 忽略 url 参数，使用内部方法调用
            return this.authApi.getQRCodeStatus(qrData.qrToken) as T;
          },
          post: async <T = unknown>(_url: string, _body?: unknown): Promise<T> => {
            throw new Error("Not implemented");
          },
        },
        log: {
          info: (msg) => console.log(chalk.blue(`[INFO] ${msg}`)),
          error: (msg) => console.error(chalk.red(`[ERROR] ${msg}`)),
          debug: (msg) => console.log(chalk.gray(`[DEBUG] ${msg}`)),
        },
      },
      execute: async () => {
        return this.authApi.getQRCodeStatus(qrData.qrToken);
      },
      options: {
        timeout: Number.parseInt(qrData.expireTime, 10),
        enableProgress: true,
      },
    };

    // 4. 执行轮询查询
    try {
      const result = await this.pollLoginStatus(query, qrData);

      // 5. 保存登录凭证
      if (result.data.token && result.data.userInfo) {
        await this.saveCredentials(result.data.token, result.data.userInfo);

        console.log(chalk.green("\n✅ 登录成功！\n"));
        this.displayUserInfo(result.data.userInfo);

        return {
          userInfo: result.data.userInfo,
          token: result.data.token,
        };
      }

      throw new Error("登录失败: 未获取到凭证");
    } catch (error) {
      console.log(chalk.red("\n❌ 登录失败\n"));
      throw error;
    }
  }

  /**
   * 显示二维码
   */
  private displayQRCode(qrData: GenerateQRCodeData): void {
    console.log(chalk.yellow("📱 请使用 第二回合APP 扫描二维码登录\n"));

    // 使用 qrcode-terminal 显示二维码
    qrcodeTerminal.generate(`r2://auth/login?qrToken=${qrData.qrContent}`, { small: true });

    const expireTimeMs = Number.parseInt(qrData.expireTime, 10);
    const pollIntervalMs = Number.parseInt(qrData.pollInterval, 10);

    console.log(chalk.gray("\n二维码内容: ") + chalk.white(qrData.qrContent));
    console.log(chalk.gray("过期时间: ") + chalk.white(`${expireTimeMs / 1000} 秒`));
    console.log(chalk.gray("轮询间隔: ") + chalk.white(`${pollIntervalMs} 毫秒`));

    console.log(chalk.yellow("\n⏳ 等待扫码..."));
  }

  /**
   * 轮询登录状态
   */
  private async pollLoginStatus(
    query: QueryDefinition<{
      status: QRCodeStatus;
      userInfo: UserInfo | null;
      token: string | null;
    }>,
    qrData: GenerateQRCodeData,
  ): Promise<{ data: { status: QRCodeStatus; userInfo: UserInfo | null; token: string | null } }> {
    let lastStatus: QRCodeStatus = "waiting";

    const expireTimeMs = Number.parseInt(qrData.expireTime, 10);
    const pollIntervalMs = Number.parseInt(qrData.pollInterval, 10);

    const pollingIterator = executePollingQuery(query, {
      interval: pollIntervalMs,
      timeout: expireTimeMs,
      condition: (data) => {
        // 检查状态变化
        if (data.status !== lastStatus) {
          lastStatus = data.status;

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
        }

        return data.status === "confirmed";
      },
    });

    let result: { data: { status: QRCodeStatus; userInfo: UserInfo | null; token: string | null } } | null = null;

    // 手动迭代以获取 AsyncGenerator 的返回值
    let done = false;
    while (!done) {
      const { value, done: iterationDone } = await pollingIterator.next();
      done = iterationDone ?? true;

      // 返回值在最后一次迭代时在 value 中
      if (done) {
        if (value && "data" in value) {
          result = { data: value.data };
        }
      } else {
        // 这是 yield 的 ProgressEvent，不需要处理
      }
    }

    if (result) {
      return result;
    }

    throw new Error("轮询异常终止");
  }

  /**
   * 显示用户信息
   */
  private displayUserInfo(userInfo: UserInfo): void {
    console.log(chalk.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.cyan("用户信息:"));
    console.log(chalk.white("  用户名: ") + chalk.yellow(userInfo.username));
    console.log(chalk.white("  昵称: ") + chalk.yellow(userInfo.nickname));
    console.log(chalk.white("  手机号: ") + chalk.yellow(userInfo.mobile));
    console.log(chalk.white("  用户ID: ") + chalk.yellow(userInfo.userId.toString()));
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
  const { Command } = require("commander");

  const command = new Command("login");
  command.description("扫码登录 Round2AI 账户");

  command.option("--timeout <ms>", "超时时间（毫秒）", "300000");
  command.option("--debug", "启用调试模式", false);

  command.action(async (options: { timeout?: string; debug?: boolean }) => {
    try {
      const loginService = new LoginService();
      const controller = new AbortController();

      // 设置超时
      const timeout = setTimeout(() => {
        controller.abort();
      }, Number.parseInt(options.timeout ?? "300000", 10));

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
  const { Command } = require("commander");

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
  const { Command } = require("commander");

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
