/** QR 服务类型定义 */

/** 二维码页面状态 — SSE 推送给浏览器，前端据此切换显示 */
export type QrPageStatus = "waiting" | "scanning" | "success" | "expired";

/**
 * 二维码生成结果
 * - url: 二维码内容（通常是登录链接或授权链接）
 * - qrUrl: 本地展示页 URL，浏览器打开后显示二维码图片 + SSE 实时状态
 * - setStatus: 外部控制页面状态（如扫码成功时调用 setStatus("success")）
 * - closeServer: 销毁页面，释放端口
 */
export interface QRCodeOutput {
  url: string;
  qrUrl: string;
  setStatus: (status: QrPageStatus) => void;
  closeServer: () => void;
}
