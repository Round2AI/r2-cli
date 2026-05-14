/**
 * QR 服务入口 — 导出类型和渲染函数
 *
 * 使用方式：
 *   const { qrUrl, url, setStatus } = await renderLoginQR("https://...");
 *   openUrl(qrUrl);  // 自动打开浏览器展示二维码页面
 */

export type { QrPageStatus, QRCodeOutput } from "./types.js";
export { renderLoginQR, renderXianyuAuthQR, openUrl } from "./render.js";
