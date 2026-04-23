/**
 * CLI 命令公共错误处理
 */

import chalk from "chalk";
import { AuthError, ApiError } from "../errors/index.js";

export function handleCommandError(error: unknown): never {
  if (error instanceof AuthError) {
    console.error(chalk.red(`\n${error.message}`));
    console.error(chalk.yellow("请先运行: r2 auth login\n"));
  } else if (error instanceof ApiError) {
    console.error(chalk.red(`操作失败: ${error.message}`));
    if (error.status) {
      console.error(chalk.gray(`  状态码: ${error.status}`));
    }
  } else {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`操作失败: ${msg}`));
  }
  process.exit(1);
}
