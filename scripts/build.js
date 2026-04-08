#!/usr/bin/env node
/**
 * 构建脚本
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

// API URL
const apiUrl = process.env.R2_API_URL || 'https://api.qiuxietang.com';

// 读取并替换 api-client.service.ts 中的 R2_API_URL
const serviceFilePath = path.join(rootDir, 'src/services/api/api-client.service.ts');
let content = fs.readFileSync(serviceFilePath, 'utf-8');
content = content.replace(
  /const R2_API_URL = "https:\/\/[^"]+"/,
  `const R2_API_URL = "${apiUrl}"`
);
fs.writeFileSync(serviceFilePath, content);

// 构建
await execAsync('npx esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js --format=esm --sourcemap --external:fs-extra --external:chalk --external:inquirer --external:open --external:qrcode-terminal --external:commander --external:figlet --external:mammoth');

console.log('[Build] Complete');
