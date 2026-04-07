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

/** API 响应基础结构 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  data: T;
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

/** 配置信息 */
export interface AuthConfig {
  /** API 基础地址 */
  baseUrl: string;
  /** API 版本 */
  version: string;
  /** 轮询超时时间（毫秒） */
  pollingTimeout: number;
  /** 是否启用调试日志 */
  debug: boolean;
}

/** 默认配置 */
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  baseUrl: process.env.R2_API_BASE_URL || "https://api.round2ai.com",
  version: "v3",
  pollingTimeout: 300000, // 5分钟
  debug: process.env.DEBUG === "true",
};
