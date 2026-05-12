/**
 * QR 扫码 JSON 流程公共辅助函数
 *
 * 统一 login / xianyu 的 --json 分支：
 * 生成 QR → 输出 JSON → 打开浏览器 → 等待结果 → 输出结果 → 关闭 server
 */

import { openUrl } from "../../qr-server/index.js";

interface QRFlowConfig<TWaitArgs, TResult> {
  /** 生成 QR，返回扫码信息 + 传给 waitResult 的参数 */
  generate: () => Promise<{
    qrInfo: unknown;
    qrUrl: string;
    setStatus: (s: string) => void;
    closeServer: () => void;
    waitArgs: TWaitArgs;
  }>;
  /** 等待扫码结果，非成功时应抛出异常 */
  waitResult: (args: TWaitArgs, setStatus?: (s: string) => void) => Promise<TResult>;
  /** 格式化成功结果为 JSON 输出 */
  formatSuccess: (result: TResult) => Record<string, unknown>;
}

export async function runQRJsonFlow<TWaitArgs, TResult>(config: QRFlowConfig<TWaitArgs, TResult>): Promise<void> {
  const { qrInfo, qrUrl, setStatus, closeServer, waitArgs } = await config.generate();
  console.log(JSON.stringify(qrInfo, null, 2));
  openUrl(qrUrl);
  try {
    const result = await config.waitResult(waitArgs, setStatus);
    console.log(JSON.stringify(config.formatSuccess(result)));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(JSON.stringify({ success: false, error: msg }));
    process.exit(1);
  } finally {
    setTimeout(closeServer, 1000);
  }
}
