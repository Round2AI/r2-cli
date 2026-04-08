#!/usr/bin/env node

/**
 * R2-CLI 主入口
 * 向 AI 开放二手潮奢交易全链路能力
 */

import { Command } from "commander";
import fse from "fs-extra";
import path from "node:path";
import chalk from "chalk";
import figlet from "figlet";
import { setupCommands } from "./commands/setup.js";

// 显示欢迎信息
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

// 设置 CLI 应用
function setupCliApp(): Command {
  displayWelcomeMessage();

  const pkgJson = fse.readJSONSync(path.join(import.meta.dirname, "../package.json"));
  const program = new Command();

  program
    .name("r2")
    .description("R2-CLI，向 AI 开放二手潮奢交易全链路能力")
    .version(pkgJson.version, "-v, --version");

  // 设置全局错误处理
  program.configureOutput({
    writeErr: (str) => {
      const error = str.replace("error:", "").trim();
      console.error(`❌ 错误: ${error}`);
    },
  });

  // 设置命令
  setupCommands(program);

  return program;
}

// 启动应用
const program = setupCliApp();
program.parse(process.argv);