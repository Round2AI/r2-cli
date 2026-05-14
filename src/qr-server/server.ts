/**
 * 本地 HTTP 服务器 — 展示二维码页面 + SSE 推送扫码状态
 *
 * 每个注册的页面提供 4 个端点：
 *   GET  /login/         → 静态 HTML 页面（含二维码图片和 SSE 客户端）
 *   GET  /login/qr.png   → 二维码 PNG
 *   GET  /login/events   → SSE 流，推送 status 变化
 *   GET  /login/config   → 页面配置 JSON（如 authUrl）
 *
 * 生命周期：registerPage → 浏览器访问 → 用户扫码 → setStatus 推 SSE → unregisterPage
 * idel 超时（10 秒无 SSE 连接）自动关闭服务器释放端口。
 */

import http from "node:http";
import type { QrPageStatus } from "./types.js";
import { createSingleton } from "../utils/singleton.js";

/** 单个页面的服务端状态 */
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
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly IDLE_TIMEOUT_MS = 10_000;

  /** 启动 HTTP 服务（端口 0 = 系统自动分配），返回实际端口号 */
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

  /**
   * 注册一个页面路由
   * - 如果路由已存在（如扫码超时后重新生成），只更新 QR 和状态，已连接的 SSE 客户端自动收到 waiting 状态
   * - 每次调用重置 idle 超时
   */
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
    this.resetIdleTimer();
  }

  /** 移除页面，关闭 SSE 连接；所有页面都移除后自动关闭服务器 */
  unregisterPage(route: string): void {
    const page = this.pages.get(route);
    if (!page) return;
    for (const client of page.sseClients) client.end();
    page.sseClients.length = 0;
    this.pages.delete(route);
    if (this.pages.size === 0) this.close();
  }

  /** 更新页面状态并通过 SSE 推送给所有连接的浏览器客户端 */
  setStatus(route: string, status: QrPageStatus): void {
    const page = this.pages.get(route);
    if (!page) return;
    page.status = status;
    const payload = `data: ${JSON.stringify({ status })}\n\n`;
    for (const client of page.sseClients) client.write(payload);
  }

  /** 销毁服务器：断开全部 SSE 客户端，清空页面，释放端口 */
  close(): void {
    if (!this.server) return;
    if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; }
    for (const page of this.pages.values()) {
      for (const client of page.sseClients) client.end();
      page.sseClients.length = 0;
    }
    this.pages.clear();
    this.server.close();
    this.server = null;
    this.port = 0;
  }

  /**
   * 重置 idle 超时
   * 每次注册页面时调用。10 秒内无 SSE 连接时自动关闭服务器，
   * 避免用户打开了二维码页面但不扫码导致进程挂起。
   */
  private resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      const hasClients = [...this.pages.values()].some(p => p.sseClients.length > 0);
      if (!hasClients) this.close();
    }, QrServer.IDLE_TIMEOUT_MS);
  }

  /**
   * 路由请求到对应页面的端点：
   *   /route/       → HTML 页面
   *   /route/qr.png → 二维码图片
   *   /route/events → SSE 流
   *   /route/config → 配置 JSON
   *   /route        → 302 跳转到 /route/
   */
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

// ─── 进程级清理 ──────────────────────────────────────────

let listenersRegistered = false;

function cleanup(instance: QrServer) {
  instance.close();
}

/** 注册退出信号监听，确保进程退出时服务器释放端口 */
function ensureProcessListeners(instance: QrServer) {
  if (listenersRegistered) return;
  listenersRegistered = true;
  process.on("exit", () => cleanup(instance));
  process.on("SIGINT", () => cleanup(instance));
  process.on("SIGTERM", () => cleanup(instance));
  /**
   * stdin 轮询检测父进程断开
   * Windows 下 SIGINT/SIGTERM 可能不可靠（如 Git Bash 中 Ctrl+C），
   * 但 stdin 的 destroyed 状态可以反映父进程是否已终止。
   * 每 3 秒检测一次，unref 不阻塞进程退出。
   */
  setInterval(() => {
    if (process.stdin?.destroyed) cleanup(instance);
  }, 3_000).unref();
}

/** 共享单例 — 整个进程共用一个 HTTP 服务器 */
export const getQrServer = createSingleton(
  () => new QrServer(),
  ensureProcessListeners,
);
