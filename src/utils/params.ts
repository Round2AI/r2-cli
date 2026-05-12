/**
 * URL 参数构建工具
 */

/** 将对象转为 URLSearchParams，过滤掉 undefined/null/空字符串（GET 请求专用） */
export function toParams(obj: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  }
  return params;
}
