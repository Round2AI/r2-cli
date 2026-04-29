/**
 * API 客户端服务实现
 */

import type { ApiConfig, RequestConfig, ApiResponse } from "./client.interface.js";
import { createStorageService } from "../storage/index.js";
import { ApiError, AuthError } from "../../errors/index.js";

const R2_API_URL: string = process.env.R2_API_URL || "https://api.qiuxietang.com";

/** Token 过期安全边际（5 分钟） */
const TOKEN_EXPIRY_MARGIN_MS = 5 * 60 * 1000;

/**
 * API 客户端服务 — 支持 optional auth 模式
 */
export class ApiClientService {
  private config: ApiConfig;
  private storage: ReturnType<typeof createStorageService> | null = null;
  private cachedToken: string | null = null;
  private tokenExpiry = 0;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? R2_API_URL,
      version: config.version ?? "v3",
      debug: config.debug ?? false,
    };
    if (config.auth) {
      this.storage = createStorageService();
    }
  }

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${this.config.baseUrl}/${this.config.version}/${cleanPath}`;
  }

  private async getAuthToken(): Promise<string | undefined> {
    if (!this.storage) return undefined;
    if (this.cachedToken && Date.now() < this.tokenExpiry) return this.cachedToken;

    const credentials = await this.storage.getCredentials();
    if (!credentials) {
      throw new AuthError("请先运行 r2-cli auth login 登录");
    }

    this.cachedToken = credentials.token;
    this.tokenExpiry = credentials.expire
      ? credentials.expire - TOKEN_EXPIRY_MARGIN_MS
      : Date.now() + 30 * 60 * 1000;
    return credentials.token;
  }

  /**
   * 发起请求，返回完整响应信封（含 token 等顶层字段）
   */
  async requestFull<T = unknown>(path: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    const { method, headers: rawHeaders, body, timeout = 30000 } = config;

    const token = await this.getAuthToken();
    const headers = { ...rawHeaders, ...(token ? { token } : {}) };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      signal: controller.signal,
    };

    if (body !== undefined) init.body = JSON.stringify(body);

    if (this.config.debug) {
      console.error(`[API ${method}]`, url, body);
    }

    try {
      const response = await fetch(url, init);

      if (!response.ok) {
        if (response.status === 401) {
          if (this.storage) {
            this.cachedToken = null;
            await this.storage.clearCredentials().catch(() => {});
          }
          throw new AuthError("登录已过期，请运行 r2-cli auth login 重新登录");
        }
        const errorText = await response.text();
        throw new ApiError(errorText || `${response.status} ${response.statusText}`, response.status);
      }

      const result = (await response.json()) as ApiResponse<T>;

      if (this.config.debug) {
        console.error("[API Response]", result);
      }

      if (!result.success || result.status !== 0) {
        throw new ApiError(result.msg || "未知错误", result.status, result);
      }

      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  private async request<T = unknown>(path: string, config: RequestConfig): Promise<T> {
    const result = await this.requestFull<T>(path, config);
    return result.data;
  }

  async get<T = unknown>(path: string, params?: URLSearchParams, headers?: Record<string, string>): Promise<T> {
    const fullPath = params && params.size > 0 ? `${path}?${params.toString()}` : path;
    return this.request<T>(fullPath, { method: "GET", headers });
  }

  async post<T = unknown>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: "POST", body, headers });
  }

  async put<T = unknown>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: "PUT", body, headers });
  }

  async delete<T = unknown>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: "DELETE", headers });
  }
}
