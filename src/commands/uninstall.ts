/**
 * 一键卸载命令
 */

import { Command } from "commander";
import chalk from "chalk";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { jsonAction, jsonSuccess } from "./shared.js";

const PKG_NAME = "@round2ai/r2-cli";

function uninstallNpm(): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn("npm", ["uninstall", "-g", PKG_NAME], {
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

export function createUninstallCommand(): Command {
  const command = new Command("uninstall");
  command
    .description("卸载 R2-CLI 并清除所有配置")
    .option("--json", "输出 JSON（供 AI Agent 使用）");

  command.action(jsonAction(async (options) => {
    // Step 1: 删除配置目录
    const configDir = path.join(os.homedir(), ".r2-cli");
    let configCleared = true;
    try {
      await fs.rm(configDir, { recursive: true, force: true });
    } catch {
      configCleared = false;
    }

    // Step 2: npm uninstall -g
    const code = await uninstallNpm();
    const npmSuccess = code === 0;

    if (options.json) {
      jsonSuccess(options, {
        configCleared,
        npmUninstalled: npmSuccess,
        exitCode: code,
      });
      return;
    }

    // 人类模式：显示操作过程
    if (configCleared) {
      console.log(chalk.green("✅ 配置文件已清除"));
    } else {
      console.log(chalk.yellow("⚠️  配置目录不存在或无法删除（可忽略）"));
    }

    if (npmSuccess) {
      console.log(chalk.green(`✅ ${PKG_NAME} 已卸载`));
    } else {
      console.log(chalk.yellow(`⚠️  npm 卸载失败 (exit code: ${code})`));
      console.log(chalk.gray("  如通过 yarn/pnpm 安装，请手动卸载"));
    }
  }));

  return command;
}
