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
 * 存储的发货地址接口
 */
export interface StoredAddress {
  divisionId: string;
  province: string;
  city: string;
  area: string;
}

/**
 * 存储的店铺信息接口
 */
export interface StoredShop {
  thirdUserId: string;
  name: string;
  platform: string;
}

/**
 * 本地配置文件内容接口
 */
export interface LocalConfig {
  /** 登录凭证 */
  credentials: StoredCredentials | null;
  /** 发货地址 */
  address?: StoredAddress;
  /** 缓存的店铺 */
  shop?: StoredShop;
}