/**
 * 闲鱼商品上架命令
 */

import { Command } from "commander";
import { UpFlowService } from "../../services/xy/up-flow.service.js";
import { handleCommandError } from "./shared.js";

export function createUpCommand(): Command {
  const command = new Command("up");
  command.description("上架商品到闲鱼（不传 ID 则从列表选择）");

  command.argument("[goodsInfoId]", "商品 ID（可选，不传则从列表选择）");
  command.option("--shop <shopId>", "闲鱼店铺 ID");
  command.option("--biz-type <type>", "商品类型: 15=闲鱼严选, 2=普通商品");
  command.option("--stuff <status>", "成色: 100/99/95/90/-1");
  command.option("--desc <desc>", "商品描述");
  command.option("--price <price>", "售价");
  command.option("--cat-id <catId>", "主类目 ID");
  command.option("--channel-cat-id <id>", "子类目 ID");
  command.option("--barcode <barcode>", "商品扣码（严选商品）");

  command.action(async (goodsInfoId: string | undefined, options: Record<string, string>) => {
    try {
      const flow = new UpFlowService();
      const upOpts: Record<string, string> = {};
      if (options.shop) upOpts.shop = options.shop;
      if (options.bizType) upOpts.bizType = options.bizType;
      if (options.stuff) upOpts.stuffStatus = options.stuff;
      if (options.desc) upOpts.desc = options.desc;
      if (options.price) upOpts.price = options.price;
      if (options.catId) upOpts.catId = options.catId;
      if (options.channelCatId) upOpts.channelCatId = options.channelCatId;
      if (options.barcode) upOpts.barcode = options.barcode;
      await flow.run(goodsInfoId, upOpts as import("../../services/xy/up-flow.service.js").UpOptions);
    } catch (error) {
      handleCommandError(error);
    }
  });

  return command;
}
