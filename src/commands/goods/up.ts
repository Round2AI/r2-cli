/**
 * 商品上架命令
 *
 * 支持两种模式：
 * 1. 交互式向导：`r2 goods up`（人类使用）
 * 2. 分步执行：`r2 goods up info|categories|props|submit`（AI Agent 使用）
 */

import { Command } from "commander";
import { select, confirm } from "@inquirer/prompts";
import { UpFlowService } from "../../services/xy/up-flow.service.js";
import { getXianyuApi } from "../../services/xy/xianyu-api.service.js";
import { createStorageService } from "../../services/storage/index.js";
import { handleCommandError } from "./shared.js";
import type { ItemAttr } from "../../types/xianyu.js";
import cityData from "../../services/xy/citys.json" with { type: "json" };

export function createUpCommand(): Command {
  const command = new Command("up");
  command.description("上架商品（交互式向导）");

  // 父命令不加选项，避免与子命令选项冲突（Commander.js 父子选项同名会被父级截获）
  command.action(async () => {
    try {
      const flow = new UpFlowService();
      await flow.run();
    } catch (error) {
      handleCommandError(error);
    }
  });

  // AI Agent 子命令
  command.addCommand(createUpInfoCommand());
  command.addCommand(createUpCategoriesCommand());
  command.addCommand(createUpPropsCommand());
  command.addCommand(createUpSubmitCommand());
  command.addCommand(createUpAddressCommand());

  return command;
}

// ==================== AI Agent 子命令 ====================

/**
 * 获取商品详情 + 店铺 + 地址
 */
function createUpInfoCommand(): Command {
  const cmd = new Command("info");
  cmd.description("获取商品详情（JSON 输出，供 AI Agent 读取）");
  cmd.argument("[goodsInfoId]", "商品 ID（不传则列出待上架商品）");
  cmd.option("--shop <shopId>", "店铺 ID（不传则自动选择第一个）");
  cmd.option("-p, --platform <platform>", "平台: xianyu/douyin", "xianyu");

  cmd.action(async (goodsInfoId: string | undefined, options: { shop?: string; platform: string }) => {
    try {
      const api = getXianyuApi();
      const storage = createStorageService();

      if (!goodsInfoId) {
        const result = await api.getSellerGoodsList({ status: "wait", page: 1, size: 50 });
        console.log(JSON.stringify({
          goods: result.items.map(item => ({
            id: item.id,
            name: item.name,
            image: item.image,
            goodsNo: item.goodsNo,
            size: item.size,
            price: item.price,
            status: item.status,
          })),
          total: result.total,
        }, null, 2));
        return;
      }

      // 从缓存读取店铺
      const cached = await storage.getShop();
      const shopId = options.shop ?? cached?.thirdUserId;
      const platform = options.platform !== "xianyu" ? options.platform : (cached?.platform ?? options.platform);

      const shops = await api.getShops(platform);
      let shop = shops[0];
      if (shopId) {
        shop = shops.find(s => s.thirdUserId === shopId || s.id === shopId) ?? shop;
      }
      if (!shop) {
        console.log(JSON.stringify({ error: "没有授权店铺" }));
        return;
      }

      const detail = await api.getXyGoodsInfo(goodsInfoId, shop.thirdUserId);
      const address = await storage.getAddress();

      console.log(JSON.stringify({
        shops: shops.map(s => ({
          name: s.name,
          thirdUserId: s.thirdUserId,
          expired: Date.now() > s.expiresIn,
        })),
        selectedShop: { name: shop.name, thirdUserId: shop.thirdUserId },
        goodsDetail: detail,
        prefill: {
          itemBizType: detail.itemBizType,
          stuffStatus: detail.stuffStatus,
          reservePrice: detail.reservePrice,
          desc: detail.desc,
          barcode: detail.barcode,
          brandName: detail.brandName,
          size: detail.size,
          goodsNo: detail.goodsNo,
          title: detail.title,
        },
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
  cmd.option("--attrs <json>", "属性列表 JSON（或 @file.txt 从文件读取）");
  cmd.option("--attrs-file <path>", "属性列表 JSON 文件路径");
  cmd.option("--services <json>", "服务保障 JSON");
  cmd.option("--services-file <path>", "服务保障 JSON 文件路径");

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
    attrsFile?: string;
    services?: string;
    servicesFile?: string;
  }) => {
    try {
      const api = getXianyuApi();
      const fs = await import("node:fs/promises");

      let itemAttrList: ItemAttr[] = [];
      if (options.attrsFile) {
        itemAttrList = JSON.parse(await fs.readFile(options.attrsFile, "utf-8")) as ItemAttr[];
      } else if (options.attrs) {
        itemAttrList = JSON.parse(options.attrs) as ItemAttr[];
      }

      let servicesObj = {};
      if (options.servicesFile) {
        servicesObj = JSON.parse(await fs.readFile(options.servicesFile, "utf-8"));
      } else if (options.services) {
        servicesObj = JSON.parse(options.services);
      }

      const apiAfterSalesDo = {
        supportFd24hsPolicy: false,
        supportFd48hsPolicy: false,
        supportNfrPolicy: false,
        supportSdrPolicy: false,
        ...servicesObj,
      };

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
        apiAfterSalesDo,
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

/**
 * 查看/设置发货地址
 */
function createUpAddressCommand(): Command {
  const cmd = new Command("address");
  cmd.description("查看或设置发货地址（JSON 输出）");
  cmd.option("--set", "交互选择地址并保存");

  cmd.action(async (options: { set?: boolean }) => {
    try {
      const storage = createStorageService();

      if (!options.set) {
        const address = await storage.getAddress();
        console.log(JSON.stringify({ address }, null, 2));
        return;
      }

      const province = await select({
        message: "选择省份",
        choices: cityData.map(p => ({ name: p.province, value: p })),
      });

      const city = await select({
        message: "选择城市",
        choices: province.citys.map(c => ({ name: c.city, value: c })),
      });

      const areaCode = await select({
        message: "选择地区",
        choices: city.areas.map(a => ({ name: a.area, value: a.code })),
      });

      const areaName = city.areas.find(a => a.code === areaCode)?.area ?? "";
      const saved = {
        divisionId: areaCode,
        province: province.province,
        city: city.city,
        area: areaName,
      };

      await storage.saveAddress(saved);
      console.log(JSON.stringify({ saved }, null, 2));
    } catch (error) {
      handleCommandError(error);
    }
  });

  return cmd;
}
