/**
 * 图片压缩工具 - 上传前自动压缩到限制以内
 */

import { statSync, readFileSync } from "node:fs";
import sharp from "sharp";

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * 压缩图片到指定大小以下（如果已达标则不做任何处理）
 *
 * @param filePath - 图片文件路径
 * @param maxBytes - 目标大小上限，默认 2MB
 * @returns Buffer - 压缩后的图片数据
 */
export async function compressImageIfNeeded(
  filePath: string,
  maxBytes: number = DEFAULT_MAX_BYTES,
): Promise<Buffer> {
  // 1. 检查文件大小
  const { size } = statSync(filePath);
  if (size <= maxBytes) {
    // 未超限，直接返回原始数据
    return readFileSync(filePath);
  }

  // 2. 超限 → 用 sharp 压缩
  const image = sharp(filePath);
  await image.metadata();

  // JPEG quality 逐渐降低，直到大小达标
  const qualities = [100, 90, 80, 70, 60, 50, 40, 30];
  let bestBuffer: Buffer | null = null;

  for (const quality of qualities) {
    const compressed = await image
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    if (compressed.length <= maxBytes) {
      return compressed;
    }
    bestBuffer = compressed;
  }

  // 降到最低 quality 仍然超限 → 返回结果中 size 最小的
  return bestBuffer ?? readFileSync(filePath);
}
