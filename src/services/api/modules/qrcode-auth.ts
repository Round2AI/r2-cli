/**
 * 二维码认证 API 服务
 */

import { ApiClientService } from "../client.js";
import type { GenerateQRCodeData, QRCodeStatusData } from "../../../types/auth.js";

/**
 * 二维码认证 API 接口
 */
export interface IQRCodeAuthApi {
  generateQRCode(): Promise<GenerateQRCodeData>;
  getQRCodeStatus(qrToken: string): Promise<QRCodeStatusData>;
}

/**
 * 二维码认证 API 服务实现
 */
export class QRCodeAuthApiService implements IQRCodeAuthApi {
  private client: ApiClientService;

  constructor(client: ApiClientService) {
    this.client = client;
  }

  /**
   * 生成二维码
   */
  async generateQRCode(): Promise<GenerateQRCodeData> {
    return this.client.post<GenerateQRCodeData>("app/qrcode/generate");
  }

  /**
   * 查询二维码状态（从信封顶层提取 token）
   */
  async getQRCodeStatus(qrToken: string): Promise<QRCodeStatusData> {
    const params = new URLSearchParams();
    params.append("qrToken", qrToken);
    const fullPath = `app/qrcode/status?${params.toString()}`;
    const full = await this.client.requestFull<QRCodeStatusData>(fullPath, { method: "GET" });
    if (full.token && typeof full.data === "object" && full.data !== null) {
      full.data.token = full.token;
    }
    return full.data;
  }
}
