export { poll, sleep, type PollingOptions } from "./polling.js";

/**
 * 解析 JSON 命令行参数
 * 支持 @file.json 从文件读取，或直接传 JSON 字符串
 */
export async function parseJsonArg<T = unknown>(arg: string, label: string): Promise<T> {
  try {
    if (arg.startsWith("@")) {
      const { readFile } = await import("node:fs/promises");
      return JSON.parse(await readFile(arg.slice(1), "utf-8"));
    }
    return JSON.parse(arg);
  } catch {
    throw new Error(`${label} 格式错误或文件不存在`);
  }
}
