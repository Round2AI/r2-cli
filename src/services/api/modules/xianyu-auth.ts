/**
 * 闲鱼店铺授权 API — 获取授权链接和轮询授权状态
 */

import { authClient } from "../client.js";
import type { XianyuAuthUrlData, XianyuAuthStatusData } from "../../../types/auth.js";

const client = authClient;

/** 获取闲鱼店铺授权二维码链接，返回 state、授权 URL、过期时间 */
export async function getAuthUrl(): Promise<XianyuAuthUrlData> {
  return client.get<XianyuAuthUrlData>("mms/xianyu/auth/url");
}

/** 轮询闲鱼授权状态，成功时返回 shopId 和 shopName */
export async function getAuthStatus(state: string): Promise<XianyuAuthStatusData> {
  const params = new URLSearchParams({ state });
  return client.get<XianyuAuthStatusData>("mms/xianyu/auth/status", params);
}
