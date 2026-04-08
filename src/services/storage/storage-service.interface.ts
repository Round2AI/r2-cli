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
}

/**
 * 本地配置文件内容接口
 */
export interface LocalConfig {
  /** 登录凭证 */
  credentials: StoredCredentials | null;
}

/**
 * 存储服务接口
 */
export interface IStorageService {
  /**
   * 获取配置文件路径
   */
  getConfigPath(): string;

  /**
   * 保存登录凭证
   */
  saveCredentials(token: string, userInfo: UserInfo): Promise<void>;

  /**
   * 获取登录凭证
   */
  getCredentials(): Promise<StoredCredentials | null>;

  /**
   * 清除登录凭证
   */
  clearCredentials(): Promise<void>;

  /**
   * 获取 token
   */
  getToken(): Promise<string | null>;

  /**
   * 获取用户信息
   */
  getUserInfo(): Promise<UserInfo | null>;

  /**
   * 检查是否已登录
   */
  isLoggedIn(): Promise<boolean>;
}