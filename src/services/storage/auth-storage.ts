/**
 * 认证存储 — token / 凭证 / 登录状态
 */

import type { UserInfo } from "../../types/auth.js";
import type { StoredCredentials } from "./types.js";
import { getConfigStore } from "./config-store.js";
import { createSingleton } from "../../utils/singleton.js";

export const TOKEN_EXPIRY_MARGIN_MS = 5 * 60 * 1000;

export class AuthStorage {
  private store = getConfigStore();

  private isTokenExpired(cred: StoredCredentials): boolean {
    if (!cred.expire) return false;
    return Date.now() >= cred.expire - TOKEN_EXPIRY_MARGIN_MS;
  }

  /** 保存登录凭证（token + 用户信息） */
  async saveCredentials(token: string, userInfo: UserInfo): Promise<void> {
    const now = Date.now();
    const durationMs = userInfo.expire ? Number.parseInt(userInfo.expire, 10) : 0;
    const credentials: StoredCredentials = {
      token,
      userInfo,
      timestamp: now,
      ...(durationMs > 0 && { expire: now + durationMs }),
    };

    let config = await this.store.loadConfig();
    config.credentials = credentials;
    await this.store.saveConfig(config);
  }

  /** 获取凭证（自动检查过期，过期返回 null） */
  async getCredentials(): Promise<StoredCredentials | null> {
    const config = await this.store.loadConfig();
    if (!config.credentials) return null;
    if (this.isTokenExpired(config.credentials)) return null;
    return config.credentials;
  }

  /** 清除凭证（退出登录） */
  async clearCredentials(): Promise<void> {
    const config = await this.store.loadConfig();
    config.credentials = null;
    await this.store.saveConfig(config);
  }

  /** 获取 token（快捷方法） */
  async getToken(): Promise<string | null> {
    const credentials = await this.getCredentials();
    return credentials?.token ?? null;
  }

  /** 获取用户信息（快捷方法） */
  async getUserInfo(): Promise<UserInfo | null> {
    const credentials = await this.getCredentials();
    return credentials?.userInfo ?? null;
  }

  /** 检查是否已登录（凭证存在且未过期） */
  async isLoggedIn(): Promise<boolean> {
    const credentials = await this.getCredentials();
    return credentials !== null;
  }
}

export const getAuthStorage = createSingleton(() => new AuthStorage());
