/**
 * 通用惰性单例工厂
 */

/**
 * 创建一个惰性单例访问函数。首次调用时执行 factory 创建实例，
 * 之后始终返回同一实例。可选 init 在首次创建后立即执行。
 *
 * @example
 * ```ts
 * export const getStore = createSingleton(() => new Store());
 * // 使用: const store = getStore();
 * ```
 */
export function createSingleton<T>(factory: () => T, init?: (instance: T) => void): () => T {
  let instance: T | null = null;
  return () => {
    if (!instance) {
      instance = factory();
      init?.(instance);
    }
    return instance;
  };
}
