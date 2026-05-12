/**
 * postinstall: 通过 skills CLI 将本地 skills 安装到所有 Agent 目录
 * 自动适配 Claude Code / Codex / Gemini CLI 等所有 Agent
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.join(__dirname, "..", "skills");

try {
  execSync(`npx skills add "${skillsDir}" --all -g`, {
    stdio: "inherit",
    timeout: 60_000,
  });
} catch {
  // 网络不可用或 skills CLI 失败时静默跳过
}
