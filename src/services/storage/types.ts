/**
 * 存储服务接口定义
 */

import type { UserInfo } from "../../types/auth.js";

/**
 * 存储的凭证信息接口
 */
export interface StoredCredentials {
  /** 认证令牌 */
  token: string;
  /** 用户信息 */
  userInfo: UserInfo;
  /** 时间戳 */
  timestamp: number;
  /** token 过期时间（毫秒时间戳） */
  expire?: number;
}

/**
 * 本地配置文件内容接口
 */
export interface LocalConfig {
  /** 登录凭证 */
  credentials: StoredCredentials | null;
}
