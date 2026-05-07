/**
 * 二维码渲染工具 — PNG 文件 + Unicode 半块字符
 */

import path from "node:path";
import os from "node:os";
import fs from "node:fs";

export async function renderQRCode(
  content: string,
  filename: string,
): Promise<{ unicodeQR: string; qrPath: string }> {
  const configDir = path.join(os.homedir(), ".r2-cli");
  fs.mkdirSync(configDir, { recursive: true });
  const qrPath = path.join(configDir, filename);

  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const QRCodeLib = require("qrcode") as typeof import("qrcode");

  await QRCodeLib.toFile(qrPath, content, { width: 300, margin: 2 });

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

  return { unicodeQR, qrPath };
}
