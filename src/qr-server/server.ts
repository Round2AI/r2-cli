import http from "node:http";
import type { QrPageStatus } from "./types.js";

interface PageState {
  html: string;
  qrBuffer: Buffer;
  status: QrPageStatus;
  sseClients: http.ServerResponse[];
  config?: Record<string, string> | undefined;
}

export class QrServer {
  private server: http.Server | null = null;
  private pages = new Map<string, PageState>();
  private port = 0;

  async start(): Promise<number> {
    if (this.server) return this.port;

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));
      this.server.listen(0, "127.0.0.1", () => {
        const addr = this.server!.address();
        if (typeof addr === "object" && addr) {
          this.port = addr.port;
          resolve(this.port);
        } else {
          reject(new Error("Failed to get server address"));
        }
      });
      this.server.on("error", reject);
    });
  }

  registerPage(route: string, html: string, qrBuffer: Buffer, config?: Record<string, string>): void {
    const existing = this.pages.get(route);
    if (existing) {
      existing.qrBuffer = qrBuffer;
      existing.status = "waiting";
      existing.config = config;
      const payload = `data: ${JSON.stringify({ status: "waiting" })}\n\n`;
      for (const client of existing.sseClients) client.write(payload);
    } else {
      this.pages.set(route, { html, qrBuffer, status: "waiting", sseClients: [], config });
    }
  }

  unregisterPage(route: string): void {
    const page = this.pages.get(route);
    if (!page) return;
    for (const client of page.sseClients) client.end();
    page.sseClients.length = 0;
    this.pages.delete(route);
    if (this.pages.size === 0) this.close();
  }

  setStatus(route: string, status: QrPageStatus): void {
    const page = this.pages.get(route);
    if (!page) return;
    page.status = status;
    const payload = `data: ${JSON.stringify({ status })}\n\n`;
    for (const client of page.sseClients) client.write(payload);
  }

  close(): void {
    if (!this.server) return;
    for (const page of this.pages.values()) {
      for (const client of page.sseClients) client.end();
      page.sseClients.length = 0;
    }
    this.pages.clear();
    this.server.close();
    this.server = null;
    this.port = 0;
    instance = null;
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = req.url ?? "/";

    for (const [route, page] of this.pages) {
      if (url === route) {
        res.writeHead(302, { Location: route + "/" });
        res.end();
        return;
      }
      if (url === route + "/") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(page.html);
        return;
      }
      if (url === route + "/qr.png") {
        res.writeHead(200, { "Content-Type": "image/png", "Content-Length": page.qrBuffer.length });
        res.end(page.qrBuffer);
        return;
      }
      if (url === route + "/events") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        res.write(`data: ${JSON.stringify({ status: page.status })}\n\n`);
        page.sseClients.push(res);
        req.on("close", () => {
          const idx = page.sseClients.indexOf(res);
          if (idx >= 0) page.sseClients.splice(idx, 1);
        });
        return;
      }
      if (url === route + "/config") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(page.config ?? {}));
        return;
      }
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
}

let instance: QrServer | null = null;

function cleanup() {
  if (instance) instance.close();
}

export function getQrServer(): QrServer {
  if (!instance) {
    instance = new QrServer();
    process.on("exit", cleanup);
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }
  return instance;
}
