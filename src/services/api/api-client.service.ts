/**
 * API 客户端服务实现
 */

import type { IApiClient, IQRCodeAuthApi, ApiConfig, RequestConfig, ApiResponse } from "./api-client.interface.js";
import { ApiError, AuthError } from "../../errors/index.js";
import type { GenerateQRCodeData, QRCodeStatusData } from "../../types/auth.js";

/**
 * API 基础地址 - 构建时通过 esbuild define 替换 process.env.R2_API_URL
 * dev 模式下 tsx 不做替换，需要兜底值
 */
const R2_API_URL: string = process.env.R2_API_URL || "https://api.qiuxietang.com";

/**
 * API 客户端服务实现
 */
export class ApiClientService implements IApiClient {
  private config: ApiConfig;
  private token: string | null = null;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? R2_API_URL,
      version: config.version ?? "v3",
      debug: config.debug ?? false,
    };
  }

  /**
   * 设置认证令牌
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * 获取认证令牌
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * 检查是否已设置 token
   */
  isTokenSet(): boolean {
    return this.token !== null;
  }

  /**
   * 构建 URL
   */
  private buildUrl(path: string): string {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${this.config.baseUrl}/${this.config.version}/${cleanPath}`;
  }

  /**
   * 构建 HTTP 头
   */
  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["token"] = this.token;
    }

    return headers;
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthError("登录已过期或未登录，请运行 r2-cli auth login");
      }
      const errorText = await response.text();
      throw new ApiError(errorText || `${response.status} ${response.statusText}`, response.status);
    }

    const result = (await response.json()) as ApiResponse<T>;

    if (this.config.debug) {
      console.log("[API Response]", result);
    }

    if (!result.success || result.status !== 0) {
      throw new ApiError(result.msg || "未知错误", result.status, result);
    }

    return result.data;
  }

  /**
   * 执行请求
   */
  private async request<T = unknown>(path: string, config: RequestConfig): Promise<T> {
    const url = this.buildUrl(path);
    const { method, headers, body, timeout = 30000 } = config;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const init: RequestInit = {
      method,
      headers: { ...this.buildHeaders(), ...headers },
      signal: controller.signal,
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    if (this.config.debug) {
      console.log(`[API ${method}]`, url, body);
    }

    try {
      const response = await fetch(url, init);
      return this.handleResponse<T>(response);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * GET 请求
   */
  async get<T = unknown>(path: string, params?: URLSearchParams): Promise<T> {
    const fullPath = params && params.size > 0 ? `${path}?${params.toString()}` : path;
    return this.request<T>(fullPath, { method: "GET" });
  }

  /**
   * POST 请求
   */
  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const config: RequestConfig = { method: "POST", body };
    return this.request<T>(path, config);
  }

  /**
   * PUT 请求
   */
  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    const config: RequestConfig = { method: "PUT", body };
    return this.request<T>(path, config);
  }

  /**
   * DELETE 请求
   */
  async delete<T = unknown>(path: string): Promise<T> {
    const config: RequestConfig = { method: "DELETE" };
    return this.request<T>(path, config);
  }

  /**
   * 刷新 token（不经过 handleResponse，避免 401 循环）
   */
  async refreshToken(token: string): Promise<{ token: string; expire?: number }> {
    const url = this.buildUrl("user/refresh");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        signal: controller.signal,
      });
      if (!response.ok) throw new AuthError("Token 刷新失败");
      const result = (await response.json()) as ApiResponse<{ token: string; expire?: number }>;
      if (!result.success || result.status !== 0) {
        throw new AuthError(result.msg || "Token 刷新失败");
      }
      return result.data;
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * 二维码认证 API 服务实现
 */
export class QRCodeAuthApiService implements IQRCodeAuthApi {
  private client: IApiClient;

  constructor(client: IApiClient) {
    this.client = client;
  }

  /**
   * 生成二维码
   */
  async generateQRCode(): Promise<GenerateQRCodeData> {
    return this.client.post<GenerateQRCodeData>("app/qrcode/generate");
  }

  /**
   * 查询二维码状态
   */
  async getQRCodeStatus(qrToken: string): Promise<QRCodeStatusData> {
    const params = new URLSearchParams();
    params.append("qrToken", qrToken);
    return this.client.get<QRCodeStatusData>("app/qrcode/status", params);
  }

  /**
   * 确认登录
   */
  async confirmLogin(qrToken: string): Promise<{ token: string }> {
    return this.client.post<{ token: string }>("app/qrcode/confirm", {
      qrToken,
    });
  }
}
