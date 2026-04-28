/**
 * Ink 一次性渲染工具
 * 通过 Writable 缓冲流捕获输出，清理控制序列
 */

import React from "react";
import chalk from "chalk";
import { render } from "ink";
import { Writable } from "node:stream";

/**
 * 渲染 Ink 组件并立即卸载（一次性输出）
 * 默认输出 ANSI 颜色码（chalk.level=3，truecolor），用户可通过 NO_COLOR=1 关闭
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderOnce(component: React.ReactElement<any>): void {
  const prevLevel = chalk.level;
  if (!process.env.NO_COLOR) {
    chalk.level = 3;
  }

  try {
    const chunks: Buffer[] = [];
    const buffer = new Writable({
      write(chunk, _, done) {
        chunks.push(Buffer.from(chunk));
        done();
      },
    });
    (buffer as any).isTTY = true;
    (buffer as any).columns = process.stdout.columns || 80;
    (buffer as any).rows = process.stdout.rows || 24;

    const instance = render(component, {
      stdout: buffer as any,
      patchConsole: false,
    });
    instance.unmount();

    const raw = Buffer.concat(chunks).toString("utf8");
    const lastRender = raw.split(/\x1B\[2J\x1B\[3J\x1B\[H/).at(-1) || raw;
    const cleaned = lastRender.replace(/\x1B\[\?[\d;]+[hl]/g, "").trimEnd() + "\n";
    process.stdout.write(cleaned);
  } finally {
    chalk.level = prevLevel;
  }
}
