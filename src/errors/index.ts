/**
 * 错误处理模块 - 提供自定义错误类
 */

/**
 * 错误类型枚举 — JSON 输出时用于机器判断
 */
export type ErrorType =
  | "auth_expired"
  | "timeout"
  | "network"
  | "business"
  | "polling"
  | "validation"
  | "storage"
  | "unknown";

/**
 * R2 CLI 基础错误类
 */
export class R2Error extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
    public readonly errorType: ErrorType = "unknown",
  ) {
    super(message);
    this.name = "R2Error";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, R2Error);
    }
  }
}

/**
 * API 错误类 — 业务逻辑错误（后端返回 success:false / status!=0）
 */
export class ApiError extends R2Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly response?: unknown,
    errorType?: ErrorType,
  ) {
    super(message, "API_ERROR", response, errorType ?? (status === 401 ? "auth_expired" : "business"));
    this.name = "ApiError";
  }
}

/**
 * 存储错误类
 */
export class StorageError extends R2Error {
  constructor(
    message: string,
    public readonly path?: string,
    public readonly code?: string,
  ) {
    super(message, "STORAGE_ERROR", { path, code }, "storage");
    this.name = "StorageError";
  }
}

/**
 * 认证错误类
 */
export class AuthError extends R2Error {
  constructor(message: string) {
    super(message, "AUTH_ERROR", undefined, "auth_expired");
    this.name = "AuthError";
  }
}

/**
 * 轮询错误类
 */
export class PollingError extends R2Error {
  constructor(
    message: string,
    public readonly attempts?: number,
    public readonly timeout?: number,
  ) {
    super(message, "POLLING_ERROR", { attempts, timeout }, "polling");
    this.name = "PollingError";
  }
}

/**
 * 从任意错误对象推断错误类型。
 * - DOMException AbortError → "timeout"
 * - TypeError → "network"
 * - R2Error → 使用实例自身的 errorType
 * - 其他 → "unknown"
 */
export function getErrorType(error: unknown): ErrorType {
  if (error instanceof R2Error) return error.errorType;
  if (error instanceof DOMException && error.name === "AbortError") return "timeout";
  if (error instanceof TypeError) return "network";
  return "unknown";
}