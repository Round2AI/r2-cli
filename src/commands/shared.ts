/**
 * CLI 命令公共错误处理
 */

import chalk from "chalk";
import { AuthError, ApiError, StorageError } from "../errors/index.js";

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

/** Agent 子命令统一错误输出 */
export function agentError(msg: string): never {
  console.log(JSON.stringify({ success: false, error: msg }));
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
        console.log(JSON.stringify({ success: false, error: msg }));
        process.exit(1);
      }
      handleCommandError(error);
    }
  };
}

/** @deprecated 使用 jsonAction 代替 */
export function agentAction<T extends unknown[]>(fn: (...args: T) => Promise<void>): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      agentError(msg);
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
