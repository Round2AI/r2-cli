/**
 * 查询执行器 - 参考 claude-code 的 query.ts 设计
 * 支持异步流式输出、进度报告、状态管理
 */

// AbortSignal 是全局类型，无需导入

// ==================== 类型定义 ====================

/** 查询进度事件类型 */
export type ProgressEventType = "start" | "update" | "complete" | "error";

/** 查询进度事件 */
export interface ProgressEvent {
  type: ProgressEventType;
  message: string;
  progress?: number; // 0-100
  timestamp?: number;
}

/** 查询结果元数据 */
export interface QueryMetadata {
  duration: number; // 执行时长（毫秒）
  success: boolean;
  errors?: string[];
  [key: string]: unknown;
}

/** 查询结果 */
export interface QueryResult<T = unknown> {
  data: T;
  metadata: QueryMetadata;
  progress?: ProgressEvent[];
}

/** 查询定义 */
export interface QueryDefinition<T = unknown> {
  /** 查询唯一标识 */
  id: string;
  /** 查询描述 */
  description: string;
  /** 查询执行依赖 */
  deps: QueryDeps;
  /** 查询执行函数 */
  execute: (deps: QueryDeps, signal?: AbortSignal) => Promise<T>;
  /** 查询选项 */
  options?: {
    /** 超时时间（毫秒） */
    timeout?: number;
    /** 是否启用进度报告 */
    enableProgress?: boolean;
  };
}

/** 查询依赖 */
export interface QueryDeps {
  /** 信号控制器 */
  signal: AbortSignal | null;
  /** 生成 UUID */
  uuid: () => string;
  /** API 客户端 */
  api: {
    get: <T = unknown>(url: string) => Promise<T>;
    post: <T = unknown>(url: string, body?: unknown) => Promise<T>;
  };
  /** 日志记录 */
  log: {
    info: (message: string) => void;
    error: (message: string, error?: unknown) => void;
    debug: (message: string) => void;
  };
}

/** 查询状态 */
export type QueryStatus = "idle" | "running" | "completed" | "error" | "aborted";

/** 查询上下文 - 查询执行过程中的状态管理 */
export interface QueryContext<T = unknown> {
  /** 查询 ID */
  id: string;
  /** 查询状态 */
  status: QueryStatus;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
  /** 当前进度 */
  progress: number;
  /** 进度事件历史 */
  progressEvents: ProgressEvent[];
  /** 结果数据 */
  result?: QueryResult<T>;
  /** 错误信息 */
  error?: Error;
}

// ==================== 查询执行器 ====================

/**
 * 异步查询执行器
 *
 * 参考 claude-code 的 query 函数设计，使用 AsyncGenerator 模式
 * 支持流式输出进度事件和最终结果
 *
 * @example
 * ```typescript
 * const query: QueryDefinition<UserInfo> = {
 *   id: "qrcode-login",
 *   description: "扫码登录",
 *   deps: deps,
 *   execute: async (deps, signal) => {
 *     return await loginWithQrcode(deps, signal);
 *   }
 * };
 *
 * for await (const event of executeQuery(query)) {
 *   if (event.type === "progress") {
 *     console.log(event.message, event.progress);
 *   } else if (event.type === "result") {
 *     console.log("完成:", event.data);
 *   }
 * }
 * ```
 */
export async function* executeQuery<T = unknown>(
  query: QueryDefinition<T>,
  customDeps?: Partial<QueryDeps>,
): AsyncGenerator<ProgressEvent | QueryResult<T>, QueryResult<T>, unknown> {
  const deps: QueryDeps = {
    ...query.deps,
    ...customDeps,
  };

  const ctx: QueryContext<T> = {
    id: query.id,
    status: "idle",
    startTime: Date.now(),
    progress: 0,
    progressEvents: [],
  };

  ctx.status = "running";

  try {
    // 发送开始事件
    const startEvent: ProgressEvent = {
      type: "start",
      message: `开始执行: ${query.description}`,
      timestamp: Date.now(),
    };
    ctx.progressEvents.push(startEvent);
    yield startEvent;

    // 执行查询
    const startTime = Date.now();
    const data = await query.execute(deps, deps.signal ?? undefined);
    const duration = Date.now() - startTime;

    // 发送完成事件
    const completeEvent: ProgressEvent = {
      type: "complete",
      message: `${query.description} 完成`,
      progress: 100,
      timestamp: Date.now(),
    };
    ctx.progressEvents.push(completeEvent);
    yield completeEvent;

    // 构建结果
    const result: QueryResult<T> = {
      data,
      metadata: {
        duration,
        success: true,
      },
      progress: ctx.progressEvents,
    };

    ctx.status = "completed";
    ctx.endTime = Date.now();
    ctx.result = result;

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 发送错误事件
    const errorEvent: ProgressEvent = {
      type: "error",
      message: `执行失败: ${errorMessage}`,
      timestamp: Date.now(),
    };
    ctx.progressEvents.push(errorEvent);
    yield errorEvent;

    ctx.status = "error";
    ctx.endTime = Date.now();
    ctx.error = error instanceof Error ? error : new Error(errorMessage);

    // 返回错误结果
    const errorResult: QueryResult<T> = {
      data: null as T,
      metadata: {
        duration: Date.now() - ctx.startTime,
        success: false,
        errors: [errorMessage],
      },
      progress: ctx.progressEvents,
    };

    throw error;
  }
}

// ==================== 轮询查询执行器 ====================

/**
 * 轮询查询执行器 - 适用于需要轮询检查状态的场景
 * 如：扫码登录状态轮询
 */
export interface PollingQueryOptions<T> {
  /** 轮询间隔（毫秒） */
  interval: number;
  /** 超时时间（毫秒） */
  timeout: number;
  /** 条件函数 - 判断是否完成 */
  condition: (data: T) => boolean;
  /** 进度回调 */
  onProgress?: (progress: number, message: string) => void;
}

export async function* executePollingQuery<T = unknown>(
  query: QueryDefinition<T>,
  options: PollingQueryOptions<T>,
): AsyncGenerator<ProgressEvent | QueryResult<T>, QueryResult<T>, unknown> {
  const { interval, timeout, condition, onProgress } = options;
  const startTime = Date.now();

  yield {
    type: "start",
    message: `开始轮询: ${query.description}`,
    timestamp: startTime,
  };

  let attempts = 0;
  let lastData: T | null = null;

  while (Date.now() - startTime < timeout) {
    attempts++;

    // 检查是否被中止
    if (query.deps.signal?.aborted) {
      throw new Error("查询被中止");
    }

    try {
      const data = await query.execute(query.deps);
      lastData = data;

      // 计算进度
      const progress = Math.min(
        Math.floor(((Date.now() - startTime) / timeout) * 100),
        99,
      );

      // 触发进度回调
      onProgress?.(progress, `轮询中... (第 ${attempts} 次)`);

      yield {
        type: "update",
        message: `轮询中... (第 ${attempts} 次)`,
        progress,
        timestamp: Date.now(),
      };

      // 检查条件是否满足
      if (condition(data)) {
        const duration = Date.now() - startTime;

        yield {
          type: "complete",
          message: `轮询完成 (共 ${attempts} 次)`,
          progress: 100,
          timestamp: Date.now(),
        };

        return {
          data,
          metadata: {
            duration,
            success: true,
            attempts,
          },
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      yield {
        type: "error",
        message: `轮询错误: ${errorMessage}`,
        timestamp: Date.now(),
      };

      throw error;
    }

    // 等待下一次轮询
    await sleep(interval);
  }

  // 超时
  throw new Error(
    `轮询超时: ${query.description} (已等待 ${timeout}ms, 共 ${attempts} 次)`,
  );
}

// ==================== 工具函数 ====================

/**
 * 延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成 UUID
 */
export function createUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 创建默认的查询依赖
 */
export function createDefaultDeps(
  signal: AbortSignal | null = null,
): QueryDeps {
  return {
    signal,
    uuid: createUUID,
    api: {
      get: async <T = unknown>(url: string): Promise<T> => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json() as Promise<T>;
      },
      post: async <T = unknown>(
        url: string,
        body?: unknown,
      ): Promise<T> => {
        const init: RequestInit = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        };
        if (body !== undefined) {
          init.body = JSON.stringify(body);
        }
        const response = await fetch(url, init);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json() as Promise<T>;
      },
    },
    log: {
      info: (message: string) => console.log(`[INFO] ${message}`),
      error: (message: string, error?: unknown) => {
        console.error(`[ERROR] ${message}`, error);
      },
      debug: (message: string) => {
        if (process.env.DEBUG === "true") {
          console.log(`[DEBUG] ${message}`);
        }
      },
    },
  };
}
