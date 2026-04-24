/**
 * 带认证的 API 客户端
 * 自动从 StorageService 读取 token，401 时尝试刷新 token 并重试
 */

import { ApiClientService } from "./api-client.service.js";
import { createStorageService } from "../storage/index.js";
import { AuthError } from "../../errors/index.js";

export class AuthenticatedApiClient {
  private client: ApiClientService;
  private tokenLoaded = false;
  private isRefreshing = false;

  constructor() {
    this.client = new ApiClientService();
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.tokenLoaded && this.client.isTokenSet()) return;

    const storage = createStorageService();
    const token = await storage.getToken();

    if (!token) {
      throw new AuthError("请先运行 r2-cli auth login 登录");
    }

    this.client.setToken(token);
    this.tokenLoaded = true;
  }

  private async onAuthExpired(): Promise<void> {
    this.tokenLoaded = false;
    this.client.setToken(null);
    const storage = createStorageService();
    await storage.clearCredentials();
  }

  private async withAuthRefresh<T>(fn: () => Promise<T>): Promise<T> {
    await this.ensureAuthenticated();
    try {
      return await fn();
    } catch (error) {
      if (!(error instanceof AuthError)) throw error;

      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const oldToken = this.client.getToken()!;
          const { token: newToken, expire } = await this.client.refreshToken(oldToken);
          const storage = createStorageService();
          await storage.updateToken(newToken, expire);
          this.client.setToken(newToken);
          this.isRefreshing = false;
          return await fn();
        } catch {
          this.isRefreshing = false;
          await this.onAuthExpired();
          throw new AuthError("登录已过期，请运行 r2-cli auth login 重新登录");
        }
      }

      await this.onAuthExpired();
      throw new AuthError("登录已过期，请运行 r2-cli auth login 重新登录");
    }
  }

  async get<T = unknown>(path: string, params?: URLSearchParams): Promise<T> {
    return this.withAuthRefresh(() => this.client.get<T>(path, params));
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.withAuthRefresh(() => this.client.post<T>(path, body));
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.withAuthRefresh(() => this.client.put<T>(path, body));
  }

  async delete<T = unknown>(path: string): Promise<T> {
    return this.withAuthRefresh(() => this.client.delete<T>(path));
  }
}
