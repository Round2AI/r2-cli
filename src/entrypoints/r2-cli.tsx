// #!/usr/bin/env node

/**
 * R2-CLI 主入口
 * 向 AI 开放二手潮奢交易全链路能力
 */

import { Command } from "commander";
import { readFileSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { setupCommands } from "../commands/setup.js";
import { checkForUpdate } from "../services/update-check/index.js";

async function displayWelcomeMessage(): Promise<void> {
  const { default: figlet } = await import("figlet");
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

  let version = "0.0.0";
  // npm 安装后：dist/ → ../package.json；开发模式：src/entrypoints/ → ../../package.json
  for (const rel of ["../package.json", "../../package.json"]) {
    try {
      version = JSON.parse(readFileSync(path.join(import.meta.dirname, rel), "utf-8")).version;
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
  program.action(async () => {
    await displayWelcomeMessage();
    program.help();
  });

  setupCommands(program);

  return { program, updateCheckPromise };
}

// 信号优雅退出
function handleSignal() {
  console.log(chalk.gray("\n操作已取消"));
  process.exit(130);
}
process.on("SIGINT", handleSignal);
process.on("SIGTERM", handleSignal);

const { program, updateCheckPromise } = setupCliApp();
program.parse(process.argv);
updateCheckPromise.catch((e) => { console.error(chalk.gray(`[update-check] ${e instanceof Error ? e.message : String(e)}`)); });
