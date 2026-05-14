#!/usr/bin/env node
/**
 * 从 CHANGELOG.md 中提取指定版本的发布说明
 * 用法: node scripts/extract-changelog.mjs <version>
 * 示例: node scripts/extract-changelog.mjs 1.0.15
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const version = process.argv[2];

if (!version) {
  console.error("Usage: node scripts/extract-changelog.mjs <version>");
  process.exit(1);
}

const changelogPath = join(rootDir, "CHANGELOG.md");
let content;
try {
  content = readFileSync(changelogPath, "utf-8");
} catch {
  console.log(`CHANGELOG.md not found`);
  process.exit(0);
}

// 匹配 "## v{VERSION}" 头部
const headerRegex = new RegExp(`^## v${escapeRegex(version)}\\b`, "m");
const headerMatch = content.match(headerRegex);

if (!headerMatch) {
  console.log(`Changes for version v${version}`);
  process.exit(0);
}

// 从版本头部开始，到下一个 "## v" 头部或 "---" 分隔符或 EOF 结束
const startIndex = headerMatch.index;
const remaining = content.slice(startIndex + headerMatch[0].length);
const nextVersionMatch = remaining.match(/^## v/m);
const separatorMatch = remaining.match(/^---$/m);
let endIndex;

if (nextVersionMatch && separatorMatch) {
  endIndex = startIndex + headerMatch[0].length + Math.min(nextVersionMatch.index, separatorMatch.index);
} else if (nextVersionMatch) {
  endIndex = startIndex + headerMatch[0].length + nextVersionMatch.index;
} else if (separatorMatch) {
  endIndex = startIndex + headerMatch[0].length + separatorMatch.index;
} else {
  endIndex = content.length;
}

// 提取并去掉前导/尾部空白
const section = content.slice(startIndex, endIndex).trim();
console.log(section);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
