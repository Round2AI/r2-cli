/**
 * 二维码渲染工具 — PNG 文件 + Unicode 半块字符 + base64 图片 + 本地 HTTP 预览
 */

import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import http from "node:http";

export type QrPageStatus = "waiting" | "scanning" | "success" | "expired";

export interface QrServerResult {
  qrUrl: string;
  close: () => void;
  setStatus: (status: QrPageStatus) => void;
}

export interface QRCodeOutput {
  unicodeQR: string;
  qrPath: string;
  url: string;
  qrImageBase64: string;
  qrUrl: string;
  setStatus: (status: QrPageStatus) => void;
  closeServer: () => void;
}

function buildHtmlPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>第二回合 - 扫码登录</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--primary:#06d290;--primary-light:#e8faf4;--primary-dark:#05a876;--text:#1a1a1a;--text-muted:#8c8c8c;--bg:#f7f8fa;--card:#fff;--border:#e8e8e8;--radius:16px;--shadow:0 2px 16px rgba(6,210,144,.1);--success:#52c41a;--error:#ff4d4f;--info:#1890ff}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--text)}
.card{background:var(--card);border-radius:var(--radius);padding:40px 32px 32px;box-shadow:var(--shadow);border:1px solid var(--border);text-align:center;max-width:360px;width:90%;transition:all .3s ease}
.brand{margin-bottom:24px}
.brand-name{font-size:22px;font-weight:700;color:var(--text);letter-spacing:2px}
.brand-sub{font-size:10px;color:var(--text-muted);margin-top:4px;letter-spacing:3px;text-transform:uppercase;font-weight:500}
img#qr{max-width:200px;border-radius:12px;transition:all .3s ease}
img#qr.dimmed{opacity:.15;filter:blur(4px);transform:scale(.95)}
.status-text{font-size:16px;font-weight:600;color:var(--text);margin-top:16px}
.hint{color:var(--text-muted);font-size:13px;margin-top:6px}
.scan-methods{display:flex;justify-content:center;gap:8px;margin-top:20px;flex-wrap:wrap}
.scan-methods span{font-size:11px;font-weight:500;padding:4px 12px;border-radius:6px;border:1px solid var(--border);color:var(--text-muted);background:var(--card);transition:all .2s ease}
.scan-methods span:hover{border-color:var(--primary);color:var(--primary-dark)}
.status-icon{font-size:56px;margin-bottom:8px;animation:popIn .4s cubic-bezier(.175,.885,.32,1.275)}
@keyframes popIn{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}
.success-bg .card{border-color:var(--success);box-shadow:0 2px 16px rgba(82,196,26,.12)}
.success-bg .status-text{color:var(--success)}
.expired-bg .card{border-color:var(--error);box-shadow:0 2px 16px rgba(255,77,79,.1)}
.expired-bg .status-text{color:var(--error)}
.scanning-bg .card{border-color:var(--info);box-shadow:0 2px 16px rgba(24,144,255,.1)}
.scanning-bg .status-text{color:var(--info)}
.pulse{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--info);animation:pulse 1.4s infinite;margin-right:6px;vertical-align:middle}
@keyframes pulse{0%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}
.divider{display:flex;align-items:center;gap:12px;margin-top:20px;color:var(--text-muted);font-size:11px}
.divider::before,.divider::after{content:"";flex:1;height:1px;background:var(--border)}
</style></head>
<body>
<div class="card" id="app">
  <div class="brand"><div class="brand-name">第二回合</div><div class="brand-sub">Round2AI</div></div>
  <img id="qr" src="/qr.png" alt="扫码登录"/>
  <p class="status-text" id="statusText">请扫码登录</p>
  <div class="divider">支持扫码方式</div>
  <div class="scan-methods" id="methods"><span>第二回合 APP</span><span>微信</span><span>支付宝</span></div>
  <p class="hint" id="hint"></p>
</div>
<script>
const qr=document.getElementById("qr"),st=document.getElementById("statusText"),ht=document.getElementById("hint"),mt=document.getElementById("methods"),app=document.getElementById("app"),bd=document.body;
const states={
  waiting:{icon:"",text:"\\u8BF7\\u626B\\u7801\\u767B\\u5F55",hint:"",showMethods:true,bg:"",dim:false},
  scanning:{icon:"",text:"<span class=\\"pulse\\"></span>\\u5DF2\\u626B\\u7801\\uFF0C\\u8BF7\\u5728\\u624B\\u673A\\u4E0A\\u786E\\u8BA4",hint:"\\u7B49\\u5F85\\u786E\\u8BA4\\u4E2D...",showMethods:false,bg:"scanning-bg",dim:true},
  success:{icon:"\\u2705",text:"\\u767B\\u5F55\\u6210\\u529F\\uFF01",hint:"\\u53EF\\u5173\\u95ED\\u6B64\\u9875\\u9762",showMethods:false,bg:"success-bg",dim:true},
  expired:{icon:"\\u23F0",text:"\\u4E8C\\u7EF4\\u7801\\u5DF2\\u8FC7\\u671F",hint:"\\u8BF7\\u91CD\\u65B0\\u83B7\\u53D6",showMethods:false,bg:"expired-bg",dim:true}
};
function render(s){
  const d=states[s]||states.waiting;
  bd.className=d.bg;
  if(d.icon){
    qr.style.display="none";mt.style.display="none";
    app.innerHTML="<div class=\\"brand\\"><div class=\\"brand-name\\">\\u7B2C\\u4E8C\\u56DE\\u5408</div><div class=\\"brand-sub\\">Round2AI</div></div><div class=\\"status-icon\\">"+d.icon+"</div><p class=\\"status-text\\">"+d.text+"</p>"+(d.hint?"<p class=\\"hint\\">"+d.hint+"</p>":"");
  }else{
    qr.style.display="";qr.classList.toggle("dimmed",d.dim);mt.style.display=d.showMethods?"flex":"none";st.innerHTML=d.text;ht.textContent=d.hint;
  }
}
const es=new EventSource("/events");
es.onmessage=function(e){try{const d=JSON.parse(e.data);if(d.status)render(d.status)}catch(ex){}};
es.onerror=function(){es.close()};
</script></body></html>`;
}

export function startQrServer(qrPath: string): Promise<QrServerResult> {
  return new Promise((resolve, reject) => {
    let currentStatus: QrPageStatus = "waiting";
    const sseClients: http.ServerResponse[] = [];
    const html = buildHtmlPage();

    function broadcast(status: QrPageStatus): void {
      currentStatus = status;
      const payload = `data: ${JSON.stringify({ status })}\n\n`;
      for (const client of sseClients) {
        client.write(payload);
      }
    }

    const server = http.createServer(async (req, res) => {
      const url = req.url ?? "/";

      if (url === "/qr.png") {
        const png = await fs.promises.readFile(qrPath);
        res.writeHead(200, { "Content-Type": "image/png", "Content-Length": png.length });
        res.end(png);
      } else if (url === "/events") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        res.write(`data: ${JSON.stringify({ status: currentStatus })}\n\n`);
        sseClients.push(res);
        req.on("close", () => {
          const idx = sseClients.indexOf(res);
          if (idx >= 0) sseClients.splice(idx, 1);
        });
      } else {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (typeof addr === "object" && addr) {
        resolve({
          qrUrl: `http://127.0.0.1:${addr.port}`,
          close: () => server.close(),
          setStatus: broadcast,
        });
      } else {
        reject(new Error("Failed to get server address"));
      }
    });

    server.on("error", reject);
  });
}

export async function renderQRCode(content: string, filename: string): Promise<QRCodeOutput> {
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

  const pngBuffer = await fs.promises.readFile(qrPath);
  const qrImageBase64 = `data:image/png;base64,${pngBuffer.toString("base64")}`;

  const { qrUrl, close, setStatus } = await startQrServer(qrPath);

  return { unicodeQR, qrPath, url: content, qrImageBase64, qrUrl, setStatus, closeServer: close };
}
