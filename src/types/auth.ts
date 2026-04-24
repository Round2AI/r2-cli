/**
 * 认证相关类型定义
 */

// ==================== 二维码登录相关 ====================

/** 二维码登录状态 */
export type QRCodeStatus = "waiting" | "scanned" | "confirmed" | "expired" | "canceled";

/** 用户信息 */
export interface UserInfo {
  /** 用户ID */
  userId: number;
  /** 用户名（手机号） */
  username: string;
  /** 用户昵称 */
  nickname: string;
  /** 手机号 */
  mobile: string;
  /** 头像URL */
  logo: string;
  /** 过期时间毫秒 */
  expire: string;
  /** 是否注册 */
  reg: boolean;
  /** 邮箱 */
  email: string;
}

/** 生成二维码响应数据 */
export interface GenerateQRCodeData {
  /** 二维码token，用于轮询查询状态 */
  qrToken: string;
  /** 二维码内容（扫码用） */
  qrContent: string;
  /** 过期时间（毫秒） */
  expireTime: string;
  /** 轮询间隔（毫秒） */
  pollInterval: string;
}

/** 查询二维码状态响应数据 */
export interface QRCodeStatusData {
  /** 二维码当前状态 */
  status: QRCodeStatus;
  /** 扫码/确认后的用户信息 */
  userInfo: UserInfo | null;
  /** 登录成功后的token */
  token: string | null;
}

// ==================== 认证相关 ====================

/** 登录凭证 */
export interface AuthToken {
  /** 访问令牌 */
  token: string;
  /** 刷新令牌 */
  refreshToken?: string;
  /** 过期时间（毫秒） */
  expiresIn?: number;
}

/** 认证状态 */
export interface AuthState {
  /** 是否已登录 */
  isLoggedIn: boolean;
  /** 当前登录用户信息 */
  userInfo: UserInfo | null;
  /** 当前访问令牌 */
  token: string | null;
  /** 最后登录时间戳 */
  lastLoginTime: number | null;
}
