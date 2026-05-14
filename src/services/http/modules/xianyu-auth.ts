/**
 * 闲鱼店铺授权 API — 获取授权链接和轮询授权状态
 * 与 qrcode-auth.ts 不同，此模块使用带认证的 client
 */

import { authClient } from "../client.js";
import type { XianyuAuthUrlData, XianyuAuthStatusData } from "../../../types/auth.js";

const client = authClient;

/** 获取闲鱼店铺授权二维码链接，返回 state（轮询 token）和 url（用户扫码链接） */
export async function getAuthUrl(): Promise<XianyuAuthUrlData> {
  return client.get<XianyuAuthUrlData>("mms/xianyu/auth/url");
}

/** 轮询闲鱼授权状态，成功时返回 shopId 和 shopName */
export async function getAuthStatus(state: string): Promise<XianyuAuthStatusData> {
  const params = new URLSearchParams({ state });
  return client.get<XianyuAuthStatusData>("mms/xianyu/auth/status", params);
}
