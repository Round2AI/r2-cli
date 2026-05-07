/**
 * 闲鱼店铺授权 API
 */

import { ApiClientService } from "../client.js";
import type { XianyuAuthUrlData, XianyuAuthStatusData } from "../../../types/auth.js";

const client = new ApiClientService();

export async function getAuthUrl(): Promise<XianyuAuthUrlData> {
  return client.get<XianyuAuthUrlData>("mms/xianyu/auth/url");
}

export async function getAuthStatus(state: string): Promise<XianyuAuthStatusData> {
  const params = new URLSearchParams({ state });
  return client.get<XianyuAuthStatusData>("mms/xianyu/auth/status", params);
}
