/**
 * 登录服务
 */

import chalk from "chalk";
import type { UserInfo, GenerateQRCodeData } from "../../types/auth.js";
import { poll } from "../../utils/polling.js";
import { renderLoginQR, openUrl, type QRCodeOutput, type QrPageStatus } from "../../qr-server/index.js";
import * as qrcodeAuth from "../api/modules/qrcode-auth.js";
import { getAuthStorage, AuthStorage } from "../storage/index.js";
import { AuthError } from "../../errors/index.js";

export type QRCodeResult = QRCodeOutput & { qrData: GenerateQRCodeData };

export interface LoginResult {
  userInfo: UserInfo;
  token: string;
}

async function displayUserInfo(userInfo: UserInfo, lastLogin?: Date, daysSinceLogin?: number): Promise<void> {
  const { UserInfoCard } = await import("../../components/UserInfoCard.js");
  const { renderComponent } = await import("../../utils/render.js");
  const props = lastLogin != null ? { userInfo, lastLogin, daysSinceLogin: daysSinceLogin ?? 0 } : { userInfo };
  renderComponent(UserInfoCard, props);
}

export class LoginService {
  private storage: AuthStorage;

  constructor(storage?: AuthStorage) {
    this.storage = storage ?? getAuthStorage();
  }

  async generateQR(): Promise<QRCodeResult> {
    const qrData = await qrcodeAuth.generateQRCode();
    const qrContent = `https://m.puresnake.com/r2/auth/login?qrToken=${qrData.qrContent}&from=wechat`;
    const rendered = await renderLoginQR(qrContent);
    return { qrData, ...rendered };
  }

  async waitForLogin(qrToken: string, expireTimeMs: number, pollIntervalMs: number, signal?: AbortSignal, setStatus?: (status: QrPageStatus) => void, silent?: boolean): Promise<LoginResult> {
    const result = await poll(
      () => qrcodeAuth.getQRCodeStatus(qrToken),
      {
        interval: pollIntervalMs,
        timeout: expireTimeMs,
        condition: (data) => {
          switch (data.status) {
            case "scanned":
              if (!silent) {
                console.log(chalk.cyan(`\n🔍 已扫码: ${data.userInfo?.nickname || "未知用户"}`));
                console.log(chalk.yellow("请在 APP 上确认登录"));
              }
              setStatus?.("scanning");
              return false;
            case "confirmed":
              if (!silent) console.log(chalk.green("\n✅ 用户已确认登录"));
              setStatus?.("success");
              return true;
            case "expired":
              if (!silent) console.log(chalk.red("\n⏰ 二维码已过期"));
              setStatus?.("expired");
              return true;
            case "canceled":
              if (!silent) console.log(chalk.red("\n🚫 用户已取消登录"));
              setStatus?.("expired");
              return true;
            default:
              return false;
          }
        },
      },
      signal ?? undefined,
    );

    if (result.status === "confirmed" && result.token && result.userInfo) {
      await this.storage.saveCredentials(result.token, result.userInfo);
      return { userInfo: result.userInfo, token: result.token };
    }

    if (result.status === "expired") throw new AuthError("二维码已过期，请重新登录");
    if (result.status === "canceled") throw new AuthError("用户已取消登录");
    throw new AuthError("登录失败: 未获取到凭证");
  }

  async login(signal?: AbortSignal): Promise<LoginResult> {
    console.log(chalk.cyan("\n🔐 正在启动扫码登录..."));

    const { qrData, qrUrl, setStatus, closeServer } = await this.generateQR();
    console.log(chalk.green("✅ 二维码已生成\n"));
    console.log(chalk.cyan(`  链接: ${qrUrl}\n`));
    openUrl(qrUrl);
    console.log(chalk.yellow("⏳ 等待扫码...\n"));

    const expireTimeMs = Number.parseInt(qrData.expireTime, 10);
    const pollIntervalMs = Number.parseInt(qrData.pollInterval, 10);

    try {
      const result = await this.waitForLogin(qrData.qrToken, expireTimeMs, pollIntervalMs, signal, setStatus);
      console.log(chalk.green("\n✅ 登录成功！\n"));
      displayUserInfo(result.userInfo);
      return result;
    } catch (error) {
      console.log(chalk.red("\n❌ 登录失败\n"));
      throw error;
    } finally {
      closeServer();
    }
  }

  async logout(): Promise<void> {
    console.log(chalk.cyan("\n🚪 正在退出登录..."));
    await this.storage.clearCredentials();
    console.log(chalk.green("✅ 已退出登录\n"));
  }

  async status(): Promise<void> {
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
    await displayUserInfo(userInfo, lastLogin, daysSinceLogin);
  }
}

let loginInstance: LoginService | null = null;

export function getLoginService(): LoginService {
  if (!loginInstance) loginInstance = new LoginService();
  return loginInstance;
}
