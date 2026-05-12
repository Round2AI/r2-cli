/**
 * 版本号读取工具
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** 从 package.json 读取版本号（支持 npm 安装和开发两种路径） */
export function getVersion(): string {
  for (const rel of ["../package.json", "../../package.json"]) {
    try {
      return JSON.parse(readFileSync(join(import.meta.dirname, rel), "utf-8")).version;
    } catch { /* next */ }
  }
  return "0.0.0";
}
