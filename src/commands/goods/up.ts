/**
 * 商品上架命令
 *
 * 支持两种模式：
 * 1. 交互式向导：`r2 goods up wizard`（人类使用）
 * 2. 分步执行：`r2 goods up info|categories|props|submit`（AI Agent 使用）
 */

import { Command } from "commander";
import { UpFlowService } from "../../services/xy/up-flow.service.js";
import { getXianyuApi } from "../../services/xy/xianyu-api.service.js";
import { createStorageService } from "../../services/storage/index.js";
import { handleCommandError } from "./shared.js";
import type { ItemAttr } from "../../types/xianyu.js";

export function createUpCommand(): Command {
  const command = new Command("up");
  command.description("上架商品");

  // 交互式向导
  command.addCommand(createUpWizardCommand());

  // AI Agent 子命令
  command.addCommand(createUpInfoCommand());
  command.addCommand(createUpCategoriesCommand());
  command.addCommand(createUpPropsCommand());
  command.addCommand(createUpSubmitCommand());

  return command;
}

// ==================== 交互式向导 ====================

function createUpWizardCommand(): Command {
  const cmd = new Command("wizard");
  cmd.description("交互式上架向导（人类使用）");
  cmd.argument("[goodsInfoId]", "商品 ID（可选，不传则从列表选择）");
  cmd.option("--shop <shopId>", "店铺 ID");
  cmd.option("--biz-type <type>", "商品类型: 15=严选, 2=普通商品");
  cmd.option("--stuff <status>", "成色: 100/99/95/90/-1");
  cmd.option("--desc <desc>", "商品描述");
  cmd.option("--price <price>", "售价");
  cmd.option("--cat-id <catId>", "主类目 ID");
  cmd.option("--channel-cat-id <id>", "子类目 ID");
  cmd.option("--barcode <barcode>", "商品扣码（严选商品）");

  cmd.action(async (goodsInfoId: string | undefined, options: Record<string, string>) => {
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

  return cmd;
}

// ==================== AI Agent 子命令 ====================

/**
 * 获取商品详情 + 店铺 + 地址
 */
function createUpInfoCommand(): Command {
  const cmd = new Command("info");
  cmd.description("获取商品详情（JSON 输出，供 AI Agent 读取）");
  cmd.argument("<goodsInfoId>", "商品 ID");
  cmd.option("--shop <shopId>", "店铺 ID（不传则自动选择第一个）");
  cmd.option("-p, --platform <platform>", "平台: xianyu/douyin", "xianyu");

  cmd.action(async (goodsInfoId: string, options: { shop?: string; platform: string }) => {
    try {
      const api = getXianyuApi();
      const storage = createStorageService();

      const shops = await api.getShops(options.platform);
      let shop = shops[0];
      if (options.shop) {
        shop = shops.find(s => s.thirdUserId === options.shop || s.id === options.shop) ?? shop;
      }
      if (!shop) {
        console.log(JSON.stringify({ error: "没有授权店铺" }));
        return;
      }

      const detail = await api.getXyGoodsInfo(goodsInfoId, shop.thirdUserId);
      const address = await storage.getAddress();

      console.log(JSON.stringify({
        ...detail,
        shop: { name: shop.name, thirdUserId: shop.thirdUserId, expired: Date.now() > shop.expiresIn },
        address: address ?? null,
      }, null, 2));
    } catch (error) {
      handleCommandError(error);
    }
  });

  return cmd;
}

/**
 * 获取分类树
 */
function createUpCategoriesCommand(): Command {
  const cmd = new Command("categories");
  cmd.description("获取商品分类列表（JSON 输出）");

  cmd.action(async () => {
    try {
      const api = getXianyuApi();
      const categories = await api.getCategories(16);

      const groups: { catId: string; catName: string; children: { channel: string; channelCatId: string }[] }[] = [];
      const map = new Map<string, typeof groups[number]>();

      for (const cat of categories) {
        if (!map.has(cat.catId)) {
          const group = { catId: cat.catId, catName: cat.catName, children: [] as { channel: string; channelCatId: string }[] };
          map.set(cat.catId, group);
          groups.push(group);
        }
        map.get(cat.catId)!.children.push({ channel: cat.channel, channelCatId: cat.channelCatId });
      }

      console.log(JSON.stringify(groups, null, 2));
    } catch (error) {
      handleCommandError(error);
    }
  });

  return cmd;
}

/**
 * 获取属性列表
 */
function createUpPropsCommand(): Command {
  const cmd = new Command("props");
  cmd.description("获取分类属性列表（JSON 输出）");
  cmd.argument("<channelCatId>", "渠道分类 ID");
  cmd.option("--brand <keyword>", "搜索品牌关键词");

  cmd.action(async (channelCatId: string, options: { brand?: string }) => {
    try {
      const api = getXianyuApi();
      const props = await api.getProps(channelCatId);

      const result = [];
      for (const prop of props) {
        const entry: { propId: string; propName: string; propsValues: { valueId: string; valueName: string }[]; matched?: { valueId: string; valueName: string }[] } = {
          propId: prop.propId,
          propName: prop.propName,
          propsValues: prop.propsValues.map(v => ({ valueId: v.valueId, valueName: v.valueName })),
        };

        if (prop.propName === "品牌" && options.brand) {
          try {
            const values = await api.getPropValues(channelCatId, prop.propId, options.brand);
            if (values.length) {
              entry.matched = values.map(v => ({ valueId: v.valueId, valueName: v.valueName }));
            }
          } catch { /* skip */ }
        }

        result.push(entry);
      }

      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      handleCommandError(error);
    }
  });

  return cmd;
}

/**
 * 直接提交上架（无交互）
 */
function createUpSubmitCommand(): Command {
  const cmd = new Command("submit");
  cmd.description("直接提交上架（所有参数通过 flag 传入，无交互）");

  cmd.requiredOption("--goods-id <id>", "商品 ID");
  cmd.requiredOption("--account <shopId>", "店铺 thirdUserId");
  cmd.requiredOption("--biz-type <type>", "商品类型: 15=严选, 2=普通");
  cmd.requiredOption("--price <amount>", "售价");
  cmd.requiredOption("--stuff <status>", "成色: 100/99/95/90/-1");
  cmd.requiredOption("--desc <desc>", "商品描述");
  cmd.requiredOption("--division-id <id>", "发货地区 ID");
  cmd.requiredOption("--cat-id <catId>", "主类目 ID");
  cmd.requiredOption("--channel-cat-id <id>", "子类目 ID");
  cmd.option("--barcode <barcode>", "商品扣码");
  cmd.option("--goods-no <no>", "货号");
  cmd.option("--size <size>", "规格");
  cmd.option("--title <title>", "商品标题");
  cmd.option("--attrs <json>", "属性列表 JSON");

  cmd.action(async (options: {
    goodsId: string;
    account: string;
    bizType: string;
    price: string;
    stuff: string;
    desc: string;
    divisionId: string;
    catId: string;
    channelCatId: string;
    barcode?: string;
    goodsNo?: string;
    size?: string;
    title?: string;
    attrs?: string;
  }) => {
    try {
      const api = getXianyuApi();

      let itemAttrList: ItemAttr[] = [];
      if (options.attrs) {
        itemAttrList = JSON.parse(options.attrs) as ItemAttr[];
      }

      const params = {
        goodsInfoId: options.goodsId,
        account: options.account,
        itemBizType: options.bizType,
        reservePrice: options.price,
        originalPrice: options.price,
        stuffStatus: options.stuff,
        desc: options.desc,
        divisionId: options.divisionId,
        categoryId: options.catId,
        channelCatId: options.channelCatId,
        itemAttrList,
        apiAfterSalesDo: {
          supportFd24hsPolicy: false,
          supportFd48hsPolicy: false,
          supportNfrPolicy: false,
          supportSdrPolicy: false,
        },
        ...(options.barcode ? { barcode: options.barcode } : {}),
        ...(options.goodsNo ? { goodsNo: options.goodsNo } : {}),
        ...(options.size ? { size: options.size } : {}),
        ...(options.title ? { title: options.title } : {}),
      };

      const result = await api.upGoods(params);
      console.log(JSON.stringify({ success: true, result }, null, 2));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(JSON.stringify({ success: false, error: msg }));
      process.exit(1);
    }
  });

  return cmd;
}
