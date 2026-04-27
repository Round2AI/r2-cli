export { poll, sleep, type PollingOptions } from "./polling.js";
import type { GoodsStatus } from "../types/xianyu.js";
import { CliError } from "../errors/index.js";
import React from "react";
import { render } from "ink";

/**
 * 渲染 Ink 组件并立即卸载（一次性输出，不阻塞 stdout）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderOnce(component: React.ReactElement<any>): void {
  const instance = render(component);
  instance.unmount();
}

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
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(`${label} 格式错误: ${reason}`);
  }
}

/** 有效的商品状态 */
export const VALID_STATUSES = ["wait", "on", "sold", "down"] as const;

/** 校验商品状态 */
export function validateStatus(status: string | undefined): void {
  if (status && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    throw new CliError("状态必须是: wait/on/sold/down");
  }
}

/** 校验正整数参数，返回解析后的数字或 null */
export function validatePositiveInt(value: string | undefined, label: string): number | null {
  if (!value) return null;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    throw new CliError(`${label}必须是正整数`);
  }
  return num;
}
