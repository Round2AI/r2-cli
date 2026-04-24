/**
 * 登录服务
 */

import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import React from "react";
import chalk from "chalk";
import type { UserInfo, GenerateQRCodeData } from "../../types/auth.js";
import { poll } from "../../utils/polling.js";
import { type IQRCodeAuthApi, ApiClientService, QRCodeAuthApiService } from "../api/index.js";
import { createStorageService, StorageService } from "../storage/index.js";
import { AuthError } from "../../errors/index.js";
import { renderOnce } from "../../utils/index.js";
import { UserInfoCard } from "../../components/UserInfoCard.js";

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

export class LoginService {
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
    renderOnce(React.createElement(UserInfoCard, { userInfo }));
  }

  /**
   * 保存登录凭证
   */
  private async saveCredentials(token: string, userInfo: UserInfo): Promise<void> {
    await this.storage.saveCredentials(token, userInfo);
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
    renderOnce(React.createElement(UserInfoCard, { userInfo, lastLogin, daysSinceLogin }));
  }

  /**
   * 清除登录凭证
   */
  private async clearCredentials(): Promise<void> {
    await this.storage.clearCredentials();
  }
}
