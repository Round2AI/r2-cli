/**
 * postinstall: 将 skills/ 复制到 ~/.agents/skills/
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgSkillsDir = path.join(__dirname, "..", "skills");
const agentsDir = path.join(os.homedir(), ".agents", "skills");

if (!fs.existsSync(pkgSkillsDir)) process.exit(0);

fs.mkdirSync(agentsDir, { recursive: true });

for (const name of fs.readdirSync(pkgSkillsDir)) {
  const rawSrc = path.join(pkgSkillsDir, name);
  let src;
  try { src = fs.realpathSync(rawSrc); } catch { continue; }
  if (!fs.statSync(src).isDirectory()) continue;

  const dest = path.join(agentsDir, name);
  if (fs.existsSync(dest)) {
    for (const old of fs.readdirSync(dest)) {
      fs.unlinkSync(path.join(dest, old));
    }
  }
  fs.mkdirSync(dest, { recursive: true });

  for (const file of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  }
}
