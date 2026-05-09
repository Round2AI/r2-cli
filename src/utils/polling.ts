/**
 * 通用轮询工具
 */

import { PollingError } from "../errors/index.js";

export interface PollingOptions<T> {
  /** 轮询间隔（毫秒） */
  interval: number;
  /** 超时时间（毫秒） */
  timeout: number;
  /** 条件函数 — 返回 true 表示完成 */
  condition: (data: T, attempt: number) => boolean;
}

/** 带超时的 fn() 调用包装，防止单次请求挂起 */
async function callWithTimeout<T>(fn: () => Promise<T>, ms: number, parentSignal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const onParentAbort = () => controller.abort();
  parentSignal?.addEventListener("abort", onParentAbort, { once: true });

  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fn();
  } catch (error) {
    if (controller.signal.aborted && !parentSignal?.aborted) {
      throw new PollingError("单次轮询请求超时");
    }
    throw error;
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onParentAbort);
  }
}

/**
 * 轮询执行器，每隔 interval 调用 fn，直到 condition 返回 true 或超时
 */
export async function poll<T>(
  fn: () => Promise<T>,
  options: PollingOptions<T>,
  signal?: AbortSignal,
): Promise<T> {
  const { interval, timeout, condition } = options;
  const startTime = Date.now();
  let attempts = 0;

  while (Date.now() - startTime < timeout) {
    if (signal?.aborted) {
      throw new PollingError("轮询被中止");
    }

    attempts++;
    const remaining = timeout - (Date.now() - startTime);
    const data = await callWithTimeout(fn, remaining, signal);

    if (condition(data, attempts)) {
      return data;
    }

    await sleep(interval, signal);
  }

  throw new PollingError(`轮询超时 (已等待 ${Date.now() - startTime}ms, 共 ${attempts} 次)`);
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new PollingError("轮询被中止"));
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(new PollingError("轮询被中止"));
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
