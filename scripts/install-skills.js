/**
 * postinstall: 将 skills/ 复制到 ~/.agents/skills/ + 确保 ~/.claude/skills/ 符号链接存在
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgSkillsDir = path.join(__dirname, "..", "skills");
const agentsDir = path.join(os.homedir(), ".agents", "skills");
const claudeDir = path.join(os.homedir(), ".claude", "skills");

if (!fs.existsSync(pkgSkillsDir)) process.exit(0);

fs.mkdirSync(agentsDir, { recursive: true });

for (const name of fs.readdirSync(pkgSkillsDir)) {
  const rawSrc = path.join(pkgSkillsDir, name);
  // npm 包内是真实目录，本地开发可能是 symlink → 解析真实路径
  let src;
  try { src = fs.realpathSync(rawSrc); } catch { continue; }
  if (!fs.statSync(src).isDirectory()) continue;

  const dest = path.join(agentsDir, name);
  // 清空目标目录中的旧残留文件
  if (fs.existsSync(dest)) {
    for (const old of fs.readdirSync(dest)) {
      fs.unlinkSync(path.join(dest, old));
    }
  }
  fs.mkdirSync(dest, { recursive: true });

  for (const file of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  }

  // 确保 ~/.claude/skills/<name> 指向 ~/.agents/skills/<name>
  const link = path.join(claudeDir, name);
  if (!fs.existsSync(link)) {
    fs.mkdirSync(claudeDir, { recursive: true });
    const target = dest;
    try {
      fs.symlinkSync(target, link, "junction");
    } catch {
      // Windows 权限不足时 fallback：直接复制
      fs.mkdirSync(link, { recursive: true });
      for (const file of fs.readdirSync(dest)) {
        fs.copyFileSync(path.join(dest, file), path.join(link, file));
      }
    }
  }
}
