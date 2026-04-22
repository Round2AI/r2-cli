// #!/usr/bin/env node

/**
 * R2-CLI 主入口
 * 向 AI 开放二手潮奢交易全链路能力
 */

import { Command } from "commander";
import fse from "fs-extra";
import path from "node:path";
import chalk from "chalk";
import figlet from "figlet";
import { setupCommands } from "../commands/setup.js";

function displayWelcomeMessage(): void {
  console.log(
    chalk.cyan(
      figlet.textSync("R2-CLI", {
        font: "Standard",
        horizontalLayout: "full",
      }),
    ),
  );
  console.log(chalk.gray("向 AI 开放二手潮奢交易全链路能力\n"));
}

function setupCliApp(): Command {
  const program = new Command();

  program.name("r2").description("R2-CLI，向 AI 开放二手潮奢交易全链路能力");

  // 从 import.meta.dirname 旁边的 package.json 读版本号
  try {
    const pkgJson = fse.readJSONSync(
      path.join(import.meta.dirname, "../../package.json"),
    );
    program.version(pkgJson.version, "-v, --version");
  } catch {
    program.version("0.0.0", "-v, --version");
  }

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

  program
    .command("chat")
    .description("启动 AI 聊天模式")
    .option("--stream", "使用流式响应")
    .action(async (options) => {
      console.log(chalk.blue("🚀 启动 AI 聊天模式..."));
    });

  setupCommands(program);

  return program;
}

// SIGINT 优雅退出
process.on("SIGINT", () => {
  console.log(chalk.gray("\n操作已取消"));
  process.exit(130);
});

const program = setupCliApp();
program.parse(process.argv);
