/**
 * 直接提交上架（无交互）
 * 基于 goodsDetail 全量参数，用 flag 覆盖需要修改的字段
 */

import { Command } from "commander";
import { getXianyuApi } from "../../../services/platform/xianyu-api.service.js";
import { parseJsonArg } from "../../../utils/index.js";
import type { ItemAttr } from "../../../types/xianyu.js";

export function createUpSubmitCommand(): Command {
  const cmd = new Command("submit");
  cmd.description("直接提交上架");

  cmd.requiredOption("--data <json>", "goodsDetail JSON（JSON 字符串或 @file.json 从文件读取）");
  cmd.requiredOption("--division-id <id>", "发货地区 ID");
  cmd.requiredOption("--cat-id <catId>", "主类目 ID");
  cmd.requiredOption("--channel-cat-id <id>", "子类目 ID");
  cmd.option("--price <amount>", "覆盖售价");
  cmd.option("--stuff <status>", "覆盖成色: 100/99/95/90/-1");
  cmd.option("--desc <desc>", "覆盖描述");
  cmd.option("--barcode <code>", "覆盖扣码");
  cmd.option("--title <title>", "覆盖标题");
  cmd.option("--goods-no <no>", "货号");
  cmd.option("--size <size>", "规格/尺码");
  cmd.option("--attrs <json>", "属性列表 JSON（或 @file.json）");
  cmd.option("--services <json>", "服务保障 JSON（或 @file.json）");

  cmd.action(
    async (options: {
      data: string;
      divisionId: string;
      catId: string;
      channelCatId: string;
      price?: string;
      stuff?: string;
      desc?: string;
      barcode?: string;
      title?: string;
      goodsNo?: string;
      size?: string;
      attrs?: string;
      services?: string;
    }) => {
      try {
        const api = getXianyuApi();

        // 读取 goodsDetail 作为基础参数，排除 price 字段
        const raw = (await parseJsonArg(options.data, "--data")) as Record<string, unknown>;
        const { price: _price, ...base } = raw;

        // 属性列表
        let itemAttrList: ItemAttr[] = [];
        if (options.attrs) {
          itemAttrList = (await parseJsonArg(options.attrs, "--attrs")) as ItemAttr[];
        }

        // 服务保障：以 detail 的为基础，覆盖
        const detailServices = (base.apiAfterSalesDo ?? {}) as Record<string, boolean>;
        const apiAfterSalesDo: Record<string, boolean> = {
          supportFd10msPolicy: false,
          supportFd24hsPolicy: false,
          supportFd48hsPolicy: false,
          supportNfrPolicy: false,
          supportSdrPolicy: false,
          supportVnrPolicy: false,
          supportGpaPolicy: false,
          ...detailServices,
        };
        if (options.services) {
          Object.assign(apiAfterSalesDo, await parseJsonArg(options.services, "--services"));
        }

        // flag 覆盖
        const overrides: Record<string, unknown> = {};
        if (options.price) {
          overrides.reservePrice = options.price;
          overrides.originalPrice = options.price;
        }
        if (options.stuff) overrides.stuffStatus = options.stuff;
        if (options.desc) overrides.desc = options.desc;
        if (options.barcode) overrides.barcode = options.barcode;
        if (options.title) overrides.title = options.title;
        if (options.goodsNo) overrides.goodsNo = options.goodsNo;
        if (options.size) overrides.size = options.size;

        const params = {
          ...base,
          ...overrides,
          divisionId: options.divisionId,
          categoryId: options.catId,
          channelCatId: options.channelCatId,
          itemAttrList,
          apiAfterSalesDo,
        };

        const result = await api.upGoods(params as unknown as import("../../../types/xianyu.js").XyGoodsUpParams);
        console.log(JSON.stringify({ success: true, result }, null, 2));
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(JSON.stringify({ success: false, error: msg }));
        process.exit(1);
      }
    },
  );

  return cmd;
}
