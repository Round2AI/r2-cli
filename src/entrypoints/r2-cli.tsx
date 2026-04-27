// #!/usr/bin/env node

/**
 * R2-CLI 主入口
 * 向 AI 开放二手潮奢交易全链路能力
 */

import { Command } from "commander";
import { readFileSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import figlet from "figlet";
import { setupCommands } from "../commands/setup.js";
import { checkForUpdate } from "../services/update-check/index.js";

function displayWelcomeMessage(): void {
  console.log(
    chalk.cyan.bold(
      figlet.textSync("R2-CLI", {
        font: "Standard",
        horizontalLayout: "full",
      }),
    ),
  );
  console.log(chalk.gray("  向 AI 开放二手潮奢交易全链路能力\n"));
}

function setupCliApp(): { program: Command; updateCheckPromise: Promise<void> } {
  const program = new Command();

  program.name("r2-cli").description("R2-CLI，向 AI 开放二手潮奢交易全链路能力");

  const pkgPaths = [
    path.join(import.meta.dirname, "../../package.json"),  // 项目根目录
    path.join(import.meta.dirname, "package.json"),        // dist 目录下
  ];
  let version = "0.0.0";
  for (const p of pkgPaths) {
    try {
      version = JSON.parse(readFileSync(p, "utf-8")).version;
      break;
    } catch { /* next */ }
  }
  if (version === "0.0.0") {
    console.error(chalk.yellow("Warning: unable to read version from package.json"));
  }
  program.version(version, "-v, --version");

  // 异步版本更新检查（不阻塞命令执行）
  const updateCheckPromise = checkForUpdate(version);

  program.configureOutput({
    writeErr: (str) => {
      console.error(chalk.red(str.replace("error:", "").trim()));
    },
  });

  // 仅在无子命令时显示欢迎信息
  program.action(() => {
    displayWelcomeMessage();
    program.help();
  });

  setupCommands(program);

  return { program, updateCheckPromise };
}

// SIGINT 优雅退出
process.on("SIGINT", () => {
  console.log(chalk.gray("\n操作已取消"));
  process.exit(130);
});

const { program, updateCheckPromise } = setupCliApp();
program.parse(process.argv);
updateCheckPromise.catch(() => {});
