/**
 * 二维码认证 API — 唯一不携带认证 token 的模块
 */

import { HttpClient } from "../client.js";
import type { GenerateQRCodeData, QRCodeStatusData } from "../../../types/auth.js";

/** 二维码登录不需要认证，创建独立的无认证实例 */
const client = HttpClient.createNoAuth();

/** 生成扫码登录二维码，返回 qrToken、过期时间、轮询间隔 */
export async function generateQRCode(): Promise<GenerateQRCodeData> {
  return client.post<GenerateQRCodeData>("app/qrcode/generate");
}

/** 查询二维码扫码状态（waiting/scanned/confirmed/expired），登录成功时附带 token 和用户信息 */
export async function getQRCodeStatus(qrToken: string): Promise<QRCodeStatusData> {
  const params = new URLSearchParams();
  params.append("qrToken", qrToken);
  const fullPath = `app/qrcode/status?${params.toString()}`;
  const full = await client.requestFull<QRCodeStatusData>(fullPath, { method: "GET" });
  if (full.token && typeof full.data === "object" && full.data !== null) {
    full.data.token = full.token;
  }
  return full.data;
}
