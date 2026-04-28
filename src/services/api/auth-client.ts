/**
 * 带认证的 API 客户端
 * 每次请求从 StorageService 读取 token，通过 headers 传递
 */

import { ApiClientService } from "./client.js";
import { createStorageService } from "../storage/index.js";
import { AuthError } from "../../errors/index.js";

export class AuthenticatedApiClient {
  private client: ApiClientService = new ApiClientService();
  private storage = createStorageService();
  private cachedToken: string | null = null;
  private tokenExpiry = 0;

  private async getToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiry) return this.cachedToken;

    const credentials = await this.storage.getCredentials();
    if (!credentials) {
      throw new AuthError("请先运行 r2-cli auth login 登录");
    }

    this.cachedToken = credentials.token;
    this.tokenExpiry = credentials.expire ? credentials.expire - 5 * 60 * 1000 : Date.now() + 30 * 60 * 1000;
    return credentials.token;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return { token };
  }

  private async withAuthRetry<T>(fn: (headers: Record<string, string>) => Promise<T>): Promise<T> {
    const headers = await this.authHeaders();
    try {
      return await fn(headers);
    } catch (error) {
      if (!(error instanceof AuthError)) throw error;

      this.cachedToken = null;
      await this.storage.clearCredentials();
      throw new AuthError("登录已过期，请运行 r2-cli auth login 重新登录");
    }
  }

  async get<T = unknown>(path: string, params?: URLSearchParams): Promise<T> {
    return this.withAuthRetry((headers) => this.client.get<T>(path, params, headers));
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.withAuthRetry((headers) => this.client.post<T>(path, body, headers));
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.withAuthRetry((headers) => this.client.put<T>(path, body, headers));
  }

  async delete<T = unknown>(path: string): Promise<T> {
    return this.withAuthRetry((headers) => this.client.delete<T>(path, headers));
  }
}
