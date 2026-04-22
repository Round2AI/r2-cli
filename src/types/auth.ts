/**
 * 认证相关类型定义
 */

// ==================== 二维码登录相关 ====================

/** 二维码登录状态 */
export type QRCodeStatus = "waiting" | "scanned" | "confirmed" | "expired" | "canceled";

/** 用户信息 */
export interface UserInfo {
  userId: number;
  username: string;
  nickname: string;
  mobile: string;
  logo: string;
}

/** 生成二维码响应数据 */
export interface GenerateQRCodeData {
  qrToken: string; // 二维码token
  qrContent: string; // 二维码内容
  expireTime: string; // 过期时间（毫秒）
  pollInterval: string; // 轮询间隔（毫秒）
}

/** 查询二维码状态响应数据 */
export interface QRCodeStatusData {
  status: QRCodeStatus;
  userInfo: UserInfo | null;
  token: string | null;
}

// ==================== 认证相关 ====================

/** 登录凭证 */
export interface AuthToken {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

/** 认证状态 */
export interface AuthState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  token: string | null;
  lastLoginTime: number | null;
}
