/**
 * 通用轮询工具
 */

export interface PollingOptions<T> {
  /** 轮询间隔（毫秒） */
  interval: number;
  /** 超时时间（毫秒） */
  timeout: number;
  /** 条件函数 — 返回 true 表示完成 */
  condition: (data: T, attempt: number) => boolean;
  /** 进度回调 */
  onProgress?: (attempt: number, elapsed: number) => void;
}

/**
 * 轮询执行器，每隔 interval 调用 fn，直到 condition 返回 true 或超时
 */
export async function poll<T>(
  fn: () => Promise<T>,
  options: PollingOptions<T>,
  signal?: AbortSignal,
): Promise<T> {
  const { interval, timeout, condition, onProgress } = options;
  const startTime = Date.now();
  let attempts = 0;

  while (Date.now() - startTime < timeout) {
    if (signal?.aborted) {
      throw new Error("轮询被中止");
    }

    attempts++;
    const data = await fn();
    onProgress?.(attempts, Date.now() - startTime);

    if (condition(data, attempts)) {
      return data;
    }

    await sleep(interval);
  }

  throw new Error(`轮询超时 (已等待 ${Date.now() - startTime}ms, 共 ${attempts} 次)`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
