/**
 * HTTP 客户端服务实现
 */

import type { ApiConfig, RequestConfig, ApiResponse } from "./interface.js";
import { getAuthStorage } from "../storage/index.js";
import { TOKEN_EXPIRY_MARGIN_MS } from "../storage/auth-storage.js";
import { ApiError, AuthError } from "../../errors/index.js";

const SERVER_BASEURL = process.env.SERVER_BASEURL || "https://api.qiuxietang.com";

/**
 * API 客户端服务
 */
export class HttpClient {
  private config: ApiConfig;
  private authStorage: ReturnType<typeof getAuthStorage> | null = null;
  private cachedToken: string | null = null;
  private tokenExpiry = 0;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? SERVER_BASEURL,
      version: config.version ?? "v3",
      debug: config.debug ?? false,
    };
    this.authStorage = getAuthStorage();
  }

  /** 创建无认证的客户端实例（用于二维码登录等无需 token 的场景） */
  static createNoAuth(): HttpClient {
    const instance = new HttpClient();
    instance.authStorage = null;
    return instance;
  }

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${this.config.baseUrl}/${this.config.version}/${cleanPath}`;
  }

  private async getAuthToken(): Promise<string | undefined> {
    if (!this.authStorage) return undefined;
    if (this.cachedToken && Date.now() < this.tokenExpiry) return this.cachedToken;

    const credentials = await this.authStorage.getCredentials();
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
   * 底层请求方法：处理 token 注入、超时、响应解析、错误处理
   */
  private async requestRaw<T = unknown>(
    path: string,
    init: RequestInit,
    options: { timeout?: number } = {},
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    const timeout = options.timeout ?? 30000;

    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string>),
      ...(token ? { token } : {}),
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const requestInit: RequestInit = {
      ...init,
      headers,
      signal: controller.signal,
    };

    if (this.config.debug) {
      console.error(`[API ${init.method ?? "GET"}]`, url, init.body);
    }

    try {
      const response = await fetch(url, requestInit);

      if (!response.ok) {
        if (response.status === 401) {
          if (this.authStorage) {
            this.cachedToken = null;
            await this.authStorage.clearCredentials().catch(() => {});
          }
          throw new AuthError("登录已过期，请运行 r2-cli auth login 重新登录");
        }
        if (response.status === 413) {
          throw new ApiError("图片太大，上传失败（服务端限制约 2MB）", 413);
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
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError(`请求超时 (${timeout}ms)`, 408, undefined, "timeout");
      }
      if (error instanceof TypeError) {
        throw new ApiError(`网络错误: ${error.message}`, 0, undefined, "network");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 发起请求，返回完整响应信封（含 token 等顶层字段）
   */
  async requestFull<T = unknown>(path: string, reqConfig: RequestConfig): Promise<ApiResponse<T>> {
    const { method, headers: rawHeaders, body, timeout = 30000 } = reqConfig;
    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json", ...rawHeaders },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    };
    return this.requestRaw<T>(path, init, { timeout });
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

  /** 上传文件（multipart/form-data），不设置 Content-Type 让运行时自动处理 boundary */
  async upload<T = unknown>(path: string, formData: FormData, headers?: Record<string, string>): Promise<T> {
    const init: RequestInit = { method: "POST", body: formData, headers };
    const result = await this.requestRaw<T>(path, init, { timeout: 60000 });
    return result.data;
  }
}

/** 共享实例（默认启用认证） */
export const authClient = new HttpClient();
