/**
 * CLI 命令公共错误处理
 */

import chalk from "chalk";
import { AuthError, ApiError, StorageError, getErrorType, type ErrorType } from "../errors/index.js";
import { getUpdateNotice } from "../services/update-check/index.js";
import type { Command } from "commander";

export function handleCommandError(error: unknown): never {
  if (error instanceof AuthError) {
    console.error(chalk.red(`\n▲ ${error.message}`));
    console.error(chalk.gray(`→ 请先运行: r2-cli auth login\n`));
  } else if (error instanceof ApiError) {
    console.error(chalk.red(`▲ 操作失败: ${error.message}`));
    if (error.status) {
      console.error(chalk.gray(`  状态码: ${error.status}`));
    }
  } else if (error instanceof StorageError) {
    console.error(chalk.red(`▲ 配置文件异常: ${error.message}`));
    if (error.path) console.error(chalk.gray(`  路径: ${error.path}`));
    console.error(chalk.gray(`→ 请尝试重新登录: r2-cli auth login\n`));
  } else {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`▲ ${msg}`));
  }
  process.exit(1);
}

/** 未实现命令的统一提示 */
export function notImplemented(name: string): void {
  console.log(chalk.yellow(`▲ "${name}" 功能开发中，暂不可用`));
}

/** 在 JSON 输出中注入 _notice 更新通知（如果有） */
export function enrichJson(obj: Record<string, unknown>): Record<string, unknown> {
  const notice = getUpdateNotice();
  if (notice) Object.assign(obj, notice);
  return obj;
}

/** Agent 子命令统一错误输出 */
export function agentError(msg: string, errorType?: ErrorType): never {
  const out: Record<string, string | boolean> = { success: false, error: msg };
  if (errorType) out.errorType = errorType;
  enrichJson(out as Record<string, unknown>);
  console.log(JSON.stringify(out));
  process.exit(1);
}

/**
 * 双模命令 action 包装器：根据 options.json 自动选择错误输出方式。
 * 替代每个命令中重复的 try-catch-if-json 模式。
 *
 * 用法：`.action(jsonAction(async (options) => { ... }))`
 */
export function jsonAction<T extends { json?: boolean }>(fn: (options: T) => Promise<void>): (options: T) => Promise<void> {
  return async (options: T) => {
    try {
      await fn(options);
    } catch (error) {
      if (options.json) {
        const msg = error instanceof Error ? error.message : String(error);
        const errorType = getErrorType(error);
        const status = error instanceof ApiError ? error.status : undefined;
        const out: Record<string, string | number | boolean> = { success: false, error: msg, errorType };
        if (status != null) out.status = status;
        enrichJson(out as Record<string, unknown>);
        console.log(JSON.stringify(out));
        process.exit(1);
      }
      handleCommandError(error);
    }
  };
}

/**
 * 双模验证错误：JSON 模式输出 `{ success: false, error: msg }` + exit(1)，
 * 人类模式输出 chalk.yellow(msg)。调用方需在之后 return。
 *
 * 用法：
 * ```
 * if (!condition) { validationError(options, "信息"); return; }
 * ```
 */
export function validationError(options: { json?: boolean }, msg: string): void {
  if (options.json) {
    console.log(JSON.stringify({ success: false, error: msg, errorType: "validation" }));
    process.exit(1);
  }
  console.log(chalk.yellow(msg));
}

/**
 * 双模成功输出：JSON 模式输出 `{ success: true, data }`，
 * 人类模式输出 chalk.green(successMsg) + JSON.stringify(data)。
 *
 * 用法：
 * ```
 * jsonSuccess(options, result, "✅ 操作成功");
 * ```
 */
export function jsonSuccess<T>(options: { json?: boolean }, data: T, successMsg?: string): void {
  if (options.json) {
    const out: Record<string, unknown> = { success: true, data };
    enrichJson(out);
    console.log(JSON.stringify(out, null, 2));
  } else {
    if (successMsg) console.log(chalk.green(successMsg));
    console.log(JSON.stringify(data, null, 2));
  }
}

/** Agent 纯 JSON 子命令包装器（始终输出 JSON 错误，不区分双模） */
export function agentAction<T extends unknown[]>(fn: (...args: T) => Promise<void>): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const errorType = getErrorType(error);
      agentError(msg, errorType);
    }
  };
}

/** JSON 输出时需要过滤的敏感字段 */
export const SENSITIVE_KEYS = new Set(["accessToken", "refreshExpireIn"]);

/** 过滤敏感字段，用于 --json 输出 */
export function sanitizeShops(shops: readonly object[]): Record<string, unknown>[] {
  return shops.map((shop) => {
    const safe: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(shop)) {
      if (!SENSITIVE_KEYS.has(key)) safe[key] = value;
    }
    return safe;
  });
}

/** 为命令添加公共轮询选项（--expire / --interval），供 poll 子命令使用 */
export function addPollingOptions(cmd: Command): void {
  cmd
    .option("--expire <ms>", "过期时间（毫秒）", "300000")
    .option("--interval <ms>", "轮询间隔（毫秒）", "1000");
}

/** 从 option 中解析 expire/interval 为数字 */
export function parsePollingMs(options: { expire?: string; interval?: string }, defaults?: { expireMs?: number; intervalMs?: number }) {
  return {
    expireMs: Number.parseInt(options.expire ?? String(defaults?.expireMs ?? 300000), 10),
    intervalMs: Number.parseInt(options.interval ?? String(defaults?.intervalMs ?? 1000), 10),
  };
}
