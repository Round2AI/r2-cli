/**
 * HTTP 客户端接口定义
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

/**
 * 通用分页结果
 */
export interface PagedResponse<T> {
  /** 数据列表 */
  items: T[];
  /** 总数（后端返回 string 类型） */
  total: string;
  /** 当前页码 */
  page?: number;
  /** 每页数量 */
  perPage?: number;
}
