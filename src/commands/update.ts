/**
 * 一键更新命令 — CLI + 技能同步更新
 */

import { Command } from "commander";
import chalk from "chalk";
import { spawn, execSync } from "node:child_process";
import { getVersion } from "../utils/version.js";

const PKG_NAME = "@round2ai/r2-cli";

/** spawn 封装，返回 exit code */
function run(cmd: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

export function createUpdateCommand(): Command {
  return new Command("update")
    .description("一键更新 CLI 和技能")
    .action(async () => {
      const oldVersion = getVersion();
      console.log(chalk.cyan(`当前版本: ${oldVersion}`));
      console.log(chalk.cyan("正在更新 CLI..."));

      const code = await run("npm", ["install", "-g", `${PKG_NAME}@latest`]);
      if (code !== 0) {
        console.error(chalk.red(`\n✗ update failed · Try: npm install -g ${PKG_NAME}@latest`));
        process.exit(1);
      }

      // postinstall 已自动运行 install-skills.js，无需手动执行
      let newVersion = oldVersion;
      try {
        const output = execSync("r2-cli --version", { encoding: "utf-8" }).trim();
        newVersion = output || oldVersion;
      } catch { /* keep old version */ }

      console.log(chalk.green(`\n✓ 更新完成: ${oldVersion} → ${newVersion}`));
      console.log(chalk.green("✓ 技能已同步更新"));
    });
}
