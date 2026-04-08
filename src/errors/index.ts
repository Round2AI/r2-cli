/**
 * 错误处理模块 - 提供自定义错误类
 */

/**
 * R2 CLI 基础错误类
 */
export class R2Error extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "R2Error";
    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, R2Error);
    }
  }
}

/**
 * API 错误类
 */
export class ApiError extends R2Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly response?: unknown,
  ) {
    super(message, "API_ERROR", response);
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
    super(message, "STORAGE_ERROR", { path, code });
    this.name = "StorageError";
  }
}

/**
 * 认证错误类
 */
export class AuthError extends R2Error {
  constructor(message: string) {
    super(message, "AUTH_ERROR");
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
    super(message, "POLLING_ERROR", { attempts, timeout });
    this.name = "PollingError";
  }
}

/**
 * 命令行错误类
 */
export class CliError extends R2Error {
  constructor(message: string, public readonly command?: string) {
    super(message, "CLI_ERROR", { command });
    this.name = "CliError";
  }
}