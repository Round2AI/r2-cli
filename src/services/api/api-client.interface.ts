/**
 * API 客户端接口定义
 */

import type { GenerateQRCodeData, QRCodeStatusData } from "../../types/auth.js";

/**
 * API 配置接口
 */
export interface ApiConfig {
  /** API 基础 URL */
  baseUrl: string;
  /** API 版本 */
  version: string;
  /** 调试模式 */
  debug: boolean;
}

/**
 * HTTP 请求配置
 */
export interface RequestConfig {
  /** 请求方法 */
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求体 */
  body?: unknown;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * API 响应类型
 */
export interface ApiResponse<T = unknown> {
  /** 请求是否成功 */
  success: boolean;
  /** 状态码 */
  status: number;
  /** 响应数据 */
  data: T;
  /** 错误信息 */
  msg?: string;
}

/**
 * API 客户端接口
 */
export interface IApiClient {
  /**
   * 设置认证令牌
   */
  setToken(token: string | null): void;

  /**
   * 获取认证令牌
   */
  getToken(): string | null;

  /**
   * 执行 GET 请求
   */
  get<T = unknown>(path: string, params?: URLSearchParams): Promise<T>;

  /**
   * 执行 POST 请求
   */
  post<T = unknown>(path: string, body?: unknown): Promise<T>;

  /**
   * 执行 PUT 请求
   */
  put<T = unknown>(path: string, body?: unknown): Promise<T>;

  /**
   * 执行 DELETE 请求
   */
  delete<T = unknown>(path: string): Promise<T>;
}

/**
 * 二维码认证 API 接口
 */
export interface IQRCodeAuthApi {
  /**
   * 生成二维码
   */
  generateQRCode(): Promise<GenerateQRCodeData>;

  /**
   * 查询二维码状态
   */
  getQRCodeStatus(qrToken: string): Promise<QRCodeStatusData>;

  /**
   * 确认登录
   */
  confirmLogin(qrToken: string): Promise<{ token: string }>;
}