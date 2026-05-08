/**
 * 闲鱼店铺授权服务
 */

import chalk from "chalk";
import * as xianyuAuthApi from "../api/modules/xianyu-auth.js";
import { poll } from "../../utils/polling.js";
import { renderQRCode, type QRCodeOutput, type QrPageStatus } from "../../utils/qrcode.js";
import { AuthError } from "../../errors/index.js";
import type { XianyuAuthUrlData, XianyuAuthStatusData } from "../../types/auth.js";

type XianyuAuthResult = QRCodeOutput & { authData: XianyuAuthUrlData };

export async function generateAuthQR(): Promise<XianyuAuthResult> {
  const authData = await xianyuAuthApi.getAuthUrl();
  const rendered = await renderQRCode(authData.url, "xianyu-auth-qrcode.png");
  return { authData, ...rendered };
}

/**
 * 轻量级状态轮询：仅更新页面状态，不打印日志
 */
export async function pollAuthPageStatus(state: string, expireMs: number, intervalMs: number, setStatus: (status: QrPageStatus) => void, signal?: AbortSignal): Promise<void> {
  await poll(
    () => xianyuAuthApi.getAuthStatus(state),
    {
      interval: intervalMs,
      timeout: expireMs,
      condition: (data) => {
        if (data.status === "success") { setStatus("success"); return true; }
        if (data.status === "expired") { setStatus("expired"); return true; }
        return false;
      },
    },
    signal,
  );
}

export async function waitForAuth(
  state: string,
  expireMs: number,
  intervalMs: number,
  signal?: AbortSignal,
  setStatus?: (status: QrPageStatus) => void,
): Promise<XianyuAuthStatusData> {
  return poll(
    () => xianyuAuthApi.getAuthStatus(state),
    {
      interval: intervalMs,
      timeout: expireMs,
      condition: (data) => {
        if (data.status === "success") {
          console.log(chalk.green(`\n✅ 授权成功！店铺: ${data.shopName} (${data.shopId})`));
          setStatus?.("success");
          return true;
        }
        if (data.status === "expired") {
          console.log(chalk.red("\n⏰ 授权链接已过期"));
          setStatus?.("expired");
          return true;
        }
        return false;
      },
    },
    signal,
  );
}

export async function authorize(signal?: AbortSignal): Promise<XianyuAuthStatusData> {
  console.log(chalk.cyan("\n🔗 正在获取闲鱼授权地址..."));

  const { authData, unicodeQR, qrPath, qrUrl, setStatus, closeServer } = await generateAuthQR();

  console.log(chalk.green("✅ 授权二维码已生成\n"));
  console.log("📱 请使用微信扫描二维码授权\n");
  console.log(unicodeQR);
  console.log(chalk.cyan(`  或打开链接: ${qrUrl}`));
  console.log(chalk.gray(`  二维码已保存到: ${qrPath}`));
  console.log(chalk.gray(`  或复制链接打开: ${authData.url}`));
  console.log(chalk.yellow("\n⏳ 等待授权...\n"));

  const expireMs = authData.expireTime ? Number.parseInt(authData.expireTime, 10) : 300000;
  const intervalMs = authData.pollInterval ? Number.parseInt(authData.pollInterval, 10) : 1000;

  try {
    const result = await waitForAuth(authData.state, expireMs, intervalMs, signal, setStatus);
    if (result.status === "success") return result;
    throw new AuthError("闲鱼授权失败: " + (result.status === "expired" ? "链接已过期" : "未知状态"));
  } finally {
    closeServer();
  }
}
