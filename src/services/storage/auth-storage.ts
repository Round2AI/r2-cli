/**
 * 认证存储 — token / 凭证 / 登录状态
 */

import type { UserInfo } from "../../types/auth.js";
import type { StoredCredentials } from "./types.js";
import { getConfigStore } from "./config-store.js";

export const TOKEN_EXPIRY_MARGIN_MS = 5 * 60 * 1000;

export class AuthStorage {
  private store = getConfigStore();

  private isTokenExpired(cred: StoredCredentials): boolean {
    if (!cred.expire) return false;
    return Date.now() >= cred.expire - TOKEN_EXPIRY_MARGIN_MS;
  }

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

  async getCredentials(): Promise<StoredCredentials | null> {
    const config = await this.store.loadConfig();
    if (!config.credentials) return null;
    if (this.isTokenExpired(config.credentials)) return null;
    return config.credentials;
  }

  async clearCredentials(): Promise<void> {
    const config = await this.store.loadConfig();
    config.credentials = null;
    await this.store.saveConfig(config);
  }

  async getToken(): Promise<string | null> {
    const credentials = await this.getCredentials();
    return credentials?.token ?? null;
  }

  async getUserInfo(): Promise<UserInfo | null> {
    const credentials = await this.getCredentials();
    return credentials?.userInfo ?? null;
  }

  async isLoggedIn(): Promise<boolean> {
    const credentials = await this.getCredentials();
    return credentials !== null;
  }
}

let instance: AuthStorage | null = null;

export function getAuthStorage(): AuthStorage {
  if (!instance) instance = new AuthStorage();
  return instance;
}
