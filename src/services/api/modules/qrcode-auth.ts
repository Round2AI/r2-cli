/**
 * 二维码认证 API
 */

import { ApiClientService } from "../client.js";
import type { GenerateQRCodeData, QRCodeStatusData } from "../../../types/auth.js";

const client = new ApiClientService({ auth: false });

export async function generateQRCode(): Promise<GenerateQRCodeData> {
  return client.post<GenerateQRCodeData>("app/qrcode/generate");
}

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
