#!/usr/bin/env node
/**
 * 开发模式 - 使用 tsx 直接运行 TypeScript 源码
 *
 * 相比构建后再运行，跳过 esbuild 打包步骤，保留源码映射，
 * 支持交互式 TTY（Ink/Inquirer）并透传子命令参数。
 *
 * 用法: npm run dev -- goods up
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

// tsx 支持 TTY 继承，确保 Ink 组件和 Inquirer prompt 正常工作
const child = spawn("npx", ["tsx", "src/entrypoints/r2-cli.tsx", ...process.argv.slice(2)], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
