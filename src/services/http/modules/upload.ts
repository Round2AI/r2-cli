/**
 * 闲鱼图片上传 API
 */

import { authClient } from "../client.js";
import { basename } from "node:path";
import { compressImageIfNeeded } from "../../../utils/image.js";
import type { ImageUploadResult, UploadImagesResult } from "../../../types/goods.js";

const client = authClient;

/** 批量上传图片到闲鱼，返回图片 ID 列表 */
export async function uploadXyImages(shopId: string, filePaths: string[]): Promise<UploadImagesResult> {
  const uploadOne = async (filePath: string, retries = 1): Promise<ImageUploadResult> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const fileBuffer = await compressImageIfNeeded(filePath);
        const fileName = basename(filePath);
        const formData = new FormData();
        formData.append("file", new Blob([new Uint8Array(fileBuffer)]), fileName);
        return await client.upload<ImageUploadResult>(
          `platform/xy/media/upload?shopId=${encodeURIComponent(shopId)}`,
          formData,
        );
      } catch (err) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw err;
      }
    }
    throw new Error("unreachable");
  };

  const settled = await Promise.allSettled(filePaths.map(uploadOne));
  const images: ImageUploadResult[] = [];
  const failed: { file: string; error: string }[] = [];

  for (let i = 0; i < settled.length; i++) {
    const r = settled[i]!;
    if (r.status === "fulfilled") {
      images.push(r.value);
    } else {
      const reason = r.reason;
      failed.push({ file: filePaths[i]!, error: reason instanceof Error ? reason.message : `${reason}` });
    }
  }

  return { images, failed };
}
