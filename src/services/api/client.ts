/**
 * API 客户端 - 提供 HTTP 请求能力
 */

import type {
  ApiResponse,
  GenerateQRCodeData,
  QRCodeStatusData,
  AuthConfig,
} from "../../types/auth.js";

// ==================== API 客户端 ====================

/**
 * API 客户端类
 */
export class ApiClient {
  private baseUrl: string;
  private version: string;
  private debug: boolean;
  private token: string | null = null;

  constructor(config?: Partial<AuthConfig>) {
    this.baseUrl = config?.baseUrl || "https://api.qiuxietang.com";
    this.version = config?.version || "v3";
    this.debug = config?.debug || false;
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
   * 构建完整 URL
   */
  private buildUrl(path: string): string {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${this.baseUrl}/${this.version}/${cleanPath}`;
  }

  /**
   * 构建 HTTP 头
   */
  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
      );
    }

    const result = (await response.json()) as ApiResponse<T>;

    if (this.debug) {
      console.log("[API Response]", result);
    }

    if (!result.success || result.status !== 0) {
      throw new Error(`API Error: status=${result.status}, success=${result.success}`);
    }

    return result.data;
  }

  /**
   * GET 请求
   */
  async get<T = unknown>(path: string, params?: URLSearchParams): Promise<T> {
    let url = this.buildUrl(path);

    if (params && params.size > 0) {
      url += `?${params.toString()}`;
    }

    if (this.debug) {
      console.log("[API GET]", url);
    }

    const response = await fetch(url, {
      method: "GET",
      headers: this.buildHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST 请求
   */
  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);

    if (this.debug) {
      console.log("[API POST]", url, body);
    }

    const init: RequestInit = {
      method: "POST",
      headers: this.buildHeaders(),
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    const response = await fetch(url, init);

    return this.handleResponse<T>(response);
  }

  /**
   * PUT 请求
   */
  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);

    if (this.debug) {
      console.log("[API PUT]", url, body);
    }

    const init: RequestInit = {
      method: "PUT",
      headers: this.buildHeaders(),
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    const response = await fetch(url, init);

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE 请求
   */
  async delete<T = unknown>(path: string): Promise<T> {
    const url = this.buildUrl(path);

    if (this.debug) {
      console.log("[API DELETE]", url);
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers: this.buildHeaders(),
    });

    return this.handleResponse<T>(response);
  }
}

// ==================== 二维码登录 API ====================

/**
 * 二维码登录 API
 */
export class QRCodeAuthApi {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * 生成二维码
   *
   * @returns 二维码信息
   */
  async generateQRCode(): Promise<GenerateQRCodeData> {
    return this.client.post<GenerateQRCodeData>("app/qrcode/generate");
  }

  /**
   * 查询二维码状态
   *
   * @param qrToken 二维码 token
   * @returns 二维码状态
   */
  async getQRCodeStatus(qrToken: string): Promise<QRCodeStatusData> {
    const params = new URLSearchParams();
    params.append("qrToken", qrToken);
    return this.client.get<QRCodeStatusData>("app/qrcode/status", params);
  }

  /**
   * 确认登录（PC端调用）
   *
   * @param qrToken 二维码 token
   * @returns 确认结果
   */
  async confirmLogin(qrToken: string): Promise<{ token: string }> {
    return this.client.post<{ token: string }>("app/qrcode/confirm", {
      qrToken,
    });
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建 API 客户端
 */
export function createApiClient(
  config: Partial<AuthConfig> = {},
): ApiClient {
  return new ApiClient(config);
}

/**
 * 创建二维码认证 API
 */
export function createQRCodeAuthApi(
  client: ApiClient | null = null,
  config: Partial<AuthConfig> | null = null,
): QRCodeAuthApi {
  const apiClient = client || new ApiClient(config || {});
  return new QRCodeAuthApi(apiClient);
}
