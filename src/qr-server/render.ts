import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { QRCodeOutput } from "./types.js";
import { getQrServer } from "./server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGIN_ROUTE = "/login";
const XIANYU_ROUTE = "/login-xianyu";

function loadHtml(filename: string): string {
  return fs.readFileSync(path.join(__dirname, "pages", filename), "utf-8");
}

async function generateQR(content: string): Promise<{ qrBuffer: Buffer; unicodeQR: string }> {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const QRCodeLib = require("qrcode") as typeof import("qrcode");

  const qrBuffer = await QRCodeLib.toBuffer(content, { width: 300, margin: 2 });

  const qrMatrix = QRCodeLib.create(content, { errorCorrectionLevel: "L" });
  const size = qrMatrix.modules.size;
  const data = qrMatrix.modules.data;

  let unicodeQR = "";
  for (let row = 0; row < size; row += 2) {
    for (let col = 0; col < size; col++) {
      const top = data[row * size + col];
      const bottom = row + 1 < size ? data[(row + 1) * size + col] : false;
      if (top && bottom) unicodeQR += "█";
      else if (top) unicodeQR += "▀";
      else if (bottom) unicodeQR += "▄";
      else unicodeQR += " ";
    }
    unicodeQR += "\n";
  }

  return { qrBuffer, unicodeQR };
}

export async function renderLoginQR(content: string): Promise<QRCodeOutput> {
  const { qrBuffer, unicodeQR } = await generateQR(content);
  const server = getQrServer();
  const port = await server.start();
  server.registerPage(LOGIN_ROUTE, loadHtml("login.html"), qrBuffer);

  return {
    unicodeQR,
    url: content,
    qrUrl: `http://127.0.0.1:${port}${LOGIN_ROUTE}/`,
    setStatus: (status) => server.setStatus(LOGIN_ROUTE, status),
    closeServer: () => server.unregisterPage(LOGIN_ROUTE),
  };
}

export async function renderXianyuAuthQR(content: string, authUrl: string): Promise<QRCodeOutput> {
  const { qrBuffer, unicodeQR } = await generateQR(content);
  const server = getQrServer();
  const port = await server.start();
  server.registerPage(XIANYU_ROUTE, loadHtml("xianyu-auth.html"), qrBuffer, { authUrl });

  return {
    unicodeQR,
    url: content,
    qrUrl: `http://127.0.0.1:${port}${XIANYU_ROUTE}/`,
    setStatus: (status) => server.setStatus(XIANYU_ROUTE, status),
    closeServer: () => server.unregisterPage(XIANYU_ROUTE),
  };
}
