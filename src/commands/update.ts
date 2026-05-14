/**
 * 一键更新命令 — CLI + 技能同步更新
 */

import { Command } from "commander";
import chalk from "chalk";
import { spawn, execSync } from "node:child_process";
import { getVersion } from "../utils/version.js";
import { jsonAction, jsonSuccess } from "./shared.js";

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
    .option("--json", "输出 JSON（供 AI Agent 使用）")
    .action(jsonAction(async (options) => {
      const oldVersion = getVersion();

      if (!options.json) {
        console.log(chalk.cyan(`当前版本: ${oldVersion}`));
        console.log(chalk.cyan("正在更新 CLI..."));
      }

      const code = await run("npm", ["install", "-g", `${PKG_NAME}@latest`]);
      if (code !== 0) {
        throw new Error(`更新失败，请手动运行: npm install -g ${PKG_NAME}@latest`);
      }

      // postinstall 已自动运行 install-skills.js，无需手动执行
      let newVersion = oldVersion;
      try {
        const output = execSync("r2-cli --version", { encoding: "utf-8" }).trim();
        newVersion = output || oldVersion;
      } catch { /* keep old version */ }

      jsonSuccess(options, { oldVersion, newVersion }, `\n✓ 更新完成: ${oldVersion} → ${newVersion}\n✓ 技能已同步更新`);
    }));
}
