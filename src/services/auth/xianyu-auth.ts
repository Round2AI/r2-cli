/**
 * 闲鱼店铺授权服务
 */

import chalk from "chalk";
import * as xianyuAuthApi from "../api/modules/xianyu-auth.js";
import { poll } from "../../utils/polling.js";
import { renderQRCode } from "../../utils/qrcode.js";
import { AuthError } from "../../errors/index.js";
import type { XianyuAuthUrlData, XianyuAuthStatusData } from "../../types/auth.js";

export interface XianyuAuthResult {
  authData: XianyuAuthUrlData;
  unicodeQR: string;
  qrPath: string;
}

export class XianyuAuthService {
  async generateAuthQR(): Promise<XianyuAuthResult> {
    const authData = await xianyuAuthApi.getAuthUrl();
    const { unicodeQR, qrPath } = await renderQRCode(authData.url, "xianyu-auth-qrcode.png");
    return { authData, unicodeQR, qrPath };
  }

  async waitForAuth(
    state: string,
    expireMs: number,
    intervalMs: number,
    signal?: AbortSignal,
  ): Promise<XianyuAuthStatusData> {
    return poll(
      () => xianyuAuthApi.getAuthStatus(state),
      {
        interval: intervalMs,
        timeout: expireMs,
        condition: (data) => {
          if (data.status === "success") {
            console.log(chalk.green(`\n✅ 授权成功！店铺: ${data.shopName} (${data.shopId})`));
            return true;
          }
          if (data.status === "expired") {
            console.log(chalk.red("\n⏰ 授权链接已过期"));
            return true;
          }
          return false;
        },
      },
      signal,
    );
  }

  async authorize(signal?: AbortSignal): Promise<XianyuAuthStatusData> {
    console.log(chalk.cyan("\n🔗 正在获取闲鱼授权地址..."));

    const { authData, unicodeQR, qrPath } = await this.generateAuthQR();

    console.log(chalk.green("✅ 授权二维码已生成\n"));
    console.log("📱 请使用微信扫描二维码授权\n");
    console.log(unicodeQR);
    console.log(chalk.gray(`  二维码已保存到: ${qrPath}`));
    console.log(chalk.gray(`  或复制链接打开: ${authData.url}`));
    console.log(chalk.yellow("\n⏳ 等待授权...\n"));

    const expireMs = authData.expireTime ? Number.parseInt(authData.expireTime, 10) : 300000;
    const intervalMs = authData.pollInterval ? Number.parseInt(authData.pollInterval, 10) : 1000;
    const result = await this.waitForAuth(
      authData.state,
      expireMs,
      intervalMs,
      signal,
    );

    if (result.status === "success") return result;
    throw new AuthError("闲鱼授权失败: " + (result.status === "expired" ? "链接已过期" : "未知状态"));
  }

}

let instance: XianyuAuthService | null = null;

export function getXianyuAuthService(): XianyuAuthService {
  if (!instance) instance = new XianyuAuthService();
  return instance;
}
