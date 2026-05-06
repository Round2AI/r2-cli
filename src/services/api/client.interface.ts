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
  auth?: boolean;
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
  /** 是否成功 */
  success: boolean;
  /** 状态码 0 表示成功 999 表示失败 401表示登录过期或者未登录  */
  status: number;
  /** 数据 */
  data: T;
  /** 错误信息 */
  msg?: string;
  /** 登录成功token */
  token?: string;
}
