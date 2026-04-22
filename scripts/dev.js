#!/usr/bin/env node
/**
 * 开发模式 - 直接运行源码
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

const child = spawn('npx', ['tsx', 'src/entrypoints/cli.tsx', ...process.argv.slice(2)], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
