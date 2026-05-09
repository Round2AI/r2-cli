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

async function loadHtml(filename: string): Promise<string> {
  return fs.promises.readFile(path.join(__dirname, "pages", filename), "utf-8");
}

async function generateQRBuffer(content: string): Promise<Buffer> {
  if (!_require) _require = createRequire(import.meta.url);
  const QRCodeLib = _require("qrcode") as typeof import("qrcode");
  return QRCodeLib.toBuffer(content, { width: 300, margin: 2 });
}

export function openUrl(url: string): void {
  const cmd = process.platform === "win32" ? `start "" "${url}"`
    : process.platform === "darwin" ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd);
}

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

export function renderLoginQR(content: string): Promise<QRCodeOutput> {
  return renderQRPage(LOGIN_ROUTE, "login.html", content);
}

export function renderXianyuAuthQR(content: string, authUrl: string): Promise<QRCodeOutput> {
  return renderQRPage(XIANYU_ROUTE, "xianyu-auth.html", content, { authUrl });
}
