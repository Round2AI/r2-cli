/**
 * QR 渲染 — 生成二维码图片 + HTML 页面 + 注册到本地服务器
 *
 * 流程：
 *   generateQRBuffer(content)    → 二维码 PNG
 *   loadHtml("login.html")       → 静态页面 HTML
 *   QrServer.registerPage(...)   → 注册路由，浏览器可访问
 *   openUrl(qrUrl)               → 自动打开浏览器展示页面
 *
 * 两个场景共用此流程，只是 HTML 模板和传参不同：
 *   renderLoginQR        → 用户扫码登录
 *   renderXianyuAuthQR   → 闲鱼店铺授权
 */

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";
import { exec } from "node:child_process";
import type { QRCodeOutput } from "./types.js";
import { getQrServer } from "./server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGIN_ROUTE = "/login";
const XIANYU_ROUTE = "/login-xianyu";

let _require: ReturnType<typeof createRequire> | null = null;

/** 读取静态 HTML 页面模板（src/qr-server/pages/ 目录下） */
async function loadHtml(filename: string): Promise<string> {
  return fs.promises.readFile(path.join(__dirname, "pages", filename), "utf-8");
}

/**
 * 生成二维码图片 Buffer
 * qrcode 包是 ESM 兼容的，通过 createRequire 动态加载避免 import 问题
 */
async function generateQRBuffer(content: string): Promise<Buffer> {
  if (!_require) _require = createRequire(import.meta.url);
  const QRCodeLib = _require("qrcode") as typeof import("qrcode");
  return QRCodeLib.toBuffer(content, { width: 300, margin: 2 });
}

/** 跨平台打开浏览器 */
export function openUrl(url: string): void {
  const cmd = process.platform === "win32" ? `start "" "${url}"`
    : process.platform === "darwin" ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd);
}

/**
 * 通用渲染流程
 * 1. 并行加载 HTML + 生成 QR
 * 2. 启动/复用 HTTP 服务器
 * 3. 注册页面路由
 * 4. 返回 URL 和状态控制函数供调用方使用
 */
async function renderQRPage(
  route: string,
  htmlFile: string,
  content: string,
  config?: Record<string, string>,
): Promise<QRCodeOutput> {
  const [html, qrBuffer] = await Promise.all([
    loadHtml(htmlFile),
    generateQRBuffer(content),
  ]);
  const server = getQrServer();
  const port = await server.start();
  server.registerPage(route, html, qrBuffer, config);

  const qrUrl = `http://127.0.0.1:${port}${route}/`;

  return {
    url: content,
    qrUrl,
    setStatus: (status) => server.setStatus(route, status),
    closeServer: () => server.unregisterPage(route),
  };
}

/** 用户扫码登录（auth login）*/
export function renderLoginQR(content: string): Promise<QRCodeOutput> {
  return renderQRPage(LOGIN_ROUTE, "login.html", content);
}

/** 闲鱼店铺授权（auth xianyu）：额外传入 authUrl 供页面 JS 跳转 */
export function renderXianyuAuthQR(content: string, authUrl: string): Promise<QRCodeOutput> {
  return renderQRPage(XIANYU_ROUTE, "xianyu-auth.html", content, { authUrl });
}
