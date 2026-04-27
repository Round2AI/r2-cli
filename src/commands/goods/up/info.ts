/**
 * 获取商品详情 + 店铺 + 地址
 */

import { Command } from "commander";
import { getXianyuApi } from "../../../services/platform/xianyu-api.service.js";
import { createStorageService } from "../../../services/storage/index.js";

export function createUpInfoCommand(): Command {
  const cmd = new Command("info");
  cmd.description("获取商品详情（JSON 输出，供 AI Agent 读取）");
  cmd.argument("<goodsInfoId>", "商品 ID");
  cmd.option("--shop <shopId>", "店铺 ID（不传则自动选择第一个）");
  cmd.option("-p, --platform <platform>", "平台: xianyu/douyin", "xianyu");

  cmd.action(async (goodsInfoId: string, options: { shop?: string; platform: string }) => {
    try {
      const api = getXianyuApi();
      const storage = createStorageService();

      // 从缓存读取店铺
      const cached = await storage.getShop();
      const shopId = options.shop ?? cached?.thirdUserId;
      const platform = options.platform !== "xianyu" ? options.platform : (cached?.platform ?? options.platform);

      const shops = await api.getShops(platform);
      let shop = shops[0];
      if (shopId) {
        shop = shops.find((s) => s.thirdUserId === shopId || s.id === shopId) ?? shop;
      }
      if (!shop) {
        console.log(JSON.stringify({ error: "没有授权店铺" }));
        return;
      }

      const detail = await api.getXyGoodsInfo(goodsInfoId, shop.thirdUserId);
      const address = await storage.getAddress();

      console.log(
        JSON.stringify(
          {
            shops: shops.map((s) => ({
              name: s.name,
              thirdUserId: s.thirdUserId,
              expired: Date.now() > s.expiresIn,
            })),
            selectedShop: { name: shop.name, thirdUserId: shop.thirdUserId },
            goodsDetail: { ...detail, goodsInfoId, itemBizType: "2" },
            prefill: {
              itemBizType: "2",
              stuffStatus: detail.stuffStatus,
              reservePrice: detail.reservePrice,
              desc: detail.desc,
              barcode: detail.barcode,
              brandName: detail.brandName,
              title: detail.title,
            },
            address: address ?? null,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(JSON.stringify({ success: false, error: msg }));
      process.exit(1);
    }
  });

  return cmd;
}
