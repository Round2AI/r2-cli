/**
 * 一键卸载命令
 */

import { Command } from "commander";
import chalk from "chalk";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { handleCommandError } from "./shared.js";

const PKG_NAME = "@round2ai/r2-cli";

export function createUninstallCommand(): Command {
  const command = new Command("uninstall");
  command.description("卸载 R2-CLI 并清除所有配置");

  command.action(async () => {
    try {
      console.log(chalk.yellow("\n⚠️  即将执行以下操作："));
      console.log(chalk.gray(`  1. 删除配置目录 ~/.r2-cli/`));
      console.log(chalk.gray(`  2. 全局卸载 ${PKG_NAME}\n`));

      const { confirm } = await import("@inquirer/prompts");
      const confirmed = await confirm({ message: "确认卸载？", default: false });
      if (!confirmed) {
        console.log(chalk.gray("已取消卸载"));
        return;
      }

      // Step 1: 删除配置目录
      const configDir = path.join(os.homedir(), ".r2-cli");
      try {
        await fs.rm(configDir, { recursive: true, force: true });
        console.log(chalk.green("✅ 配置文件已清除"));
      } catch {
        console.log(chalk.yellow("⚠️  配置目录不存在或无法删除（可忽略）"));
      }

      // Step 2: npm uninstall -g
      console.log(chalk.cyan(`正在卸载 ${PKG_NAME}...`));
      const child = spawn("npm", ["uninstall", "-g", PKG_NAME], {
        stdio: "inherit",
        shell: true,
      });

      child.on("exit", (code) => {
        if (code === 0) {
          console.log(chalk.green(`\n✅ ${PKG_NAME} 已卸载`));
        } else {
          console.log(chalk.yellow(`\n⚠️  npm 卸载失败 (exit code: ${code})`));
          console.log(chalk.gray("  如通过 yarn/pnpm 安装，请手动卸载"));
        }
        process.exit(code ?? 1);
      });
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
