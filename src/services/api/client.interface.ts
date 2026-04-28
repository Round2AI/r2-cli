/**
 * API 客户端接口定义
 */

/**
 * API 配置接口
 */
export interface ApiConfig {
  baseUrl: string;
  version: string;
  debug: boolean;
}

/**
 * HTTP 请求配置
 */
export interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string> | undefined;
  body?: unknown;
  timeout?: number;
}

/**
 * API 响应类型
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  data: T;
  msg?: string;
  token?: string;
}

/**
 * API 客户端接口
 */
export interface IApiClient {
  get<T = unknown>(path: string, params?: URLSearchParams): Promise<T>;
  post<T = unknown>(path: string, body?: unknown): Promise<T>;
  put<T = unknown>(path: string, body?: unknown): Promise<T>;
  delete<T = unknown>(path: string): Promise<T>;
}
