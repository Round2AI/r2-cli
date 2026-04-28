/**
 * API 客户端服务实现
 */

import type { ApiConfig, RequestConfig, ApiResponse } from "./client.interface.js";
import { ApiError, AuthError } from "../../errors/index.js";

const R2_API_URL: string = process.env.R2_API_URL || "https://api.qiuxietang.com";

/**
 * API 客户端服务 — 纯 HTTP 层，不关心认证
 */
export class ApiClientService {
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? R2_API_URL,
      version: config.version ?? "v3",
      debug: config.debug ?? false,
    };
  }

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${this.config.baseUrl}/${this.config.version}/${cleanPath}`;
  }

  /**
   * 底层请求方法（单一实现，返回完整信封）
   */
  private async rawRequest<T>(path: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    const { method, headers, body, timeout = 30000 } = config;

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
          throw new AuthError("登录已过期或未登录，请运行 r2-cli auth login");
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

  /**
   * 返回完整信封（含 token 等顶层字段）
   */
  async requestFull<T = unknown>(path: string, config: RequestConfig): Promise<ApiResponse<T>> {
    return this.rawRequest<T>(path, config);
  }

  private async request<T = unknown>(path: string, config: RequestConfig): Promise<T> {
    const result = await this.rawRequest<T>(path, config);
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
