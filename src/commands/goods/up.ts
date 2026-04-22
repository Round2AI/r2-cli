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
            goodsDetail: { ...detail, goodsInfoId },
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
          },
          null,
          2,
        ),
      );
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
      const map = new Map<string, (typeof groups)[number]>();

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
        const entry: {
          propId: string;
          propName: string;
          propsValues: { valueId: string; valueName: string }[];
          matched?: { valueId: string; valueName: string }[];
        } = {
          propId: prop.propId,
          propName: prop.propName,
          propsValues: prop.propsValues.map((v) => ({ valueId: v.valueId, valueName: v.valueName })),
        };

        if (prop.propName === "品牌" && options.brand) {
          try {
            const values = await api.getPropValues(channelCatId, prop.propId, options.brand);
            if (values.length) {
              entry.matched = values.map((v) => ({ valueId: v.valueId, valueName: v.valueName }));
            }
          } catch {
            /* skip */
          }
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
 * 基于 goodsDetail 全量参数，用 flag 覆盖需要修改的字段
 */
function createUpSubmitCommand(): Command {
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
        const fs = await import("node:fs/promises");

        const parseJsonArg = async (arg: string, label: string): Promise<unknown> => {
          try {
            if (arg.startsWith("@")) {
              return JSON.parse(await fs.readFile(arg.slice(1), "utf-8"));
            }
            return JSON.parse(arg);
          } catch {
            console.log(JSON.stringify({ success: false, error: `${label} 格式错误或文件不存在` }));
            process.exit(1);
          }
        };

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

        const result = await api.upGoods(params);
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

/**
 * 查看/设置发货地址
 */
function createUpAddressCommand(): Command {
  const cmd = new Command("address");
  cmd.description("查看或设置发货地址（JSON 输出）");
  cmd.option("--set", "交互选择地址并保存");
  cmd.option("--provinces", "列出所有省份");
  cmd.option("--cities <province>", "列出指定省份的城市");
  cmd.option("--areas <city>", "列出指定城市的地区（需配合 --province）");
  cmd.option("--save", "直接保存地址（需配合 --province, --city, --area-code）");
  cmd.option("--province <name>", "省份名称（配合 --areas 或 --save）");
  cmd.option("--city <name>", "城市名称（配合 --save）");
  cmd.option("--area-code <code>", "地区编码（配合 --save）");

  cmd.action(
    async (options: {
      set?: boolean;
      provinces?: boolean;
      cities?: string;
      areas?: string;
      save?: boolean;
      province?: string;
      city?: string;
      areaCode?: string;
    }) => {
      try {
        const storage = createStorageService();

        if (options.provinces) {
          console.log(
            JSON.stringify(
              cityData.map((p) => ({ name: p.province, code: p.code })),
              null,
              2,
            ),
          );
          return;
        }

        if (options.cities) {
          const prov = cityData.find((p) => p.province === options.cities);
          if (!prov) {
            console.log(JSON.stringify({ error: `未找到省份: ${options.cities}` }));
            return;
          }
          console.log(
            JSON.stringify(
              prov.citys.map((c) => ({ name: c.city, code: c.code })),
              null,
              2,
            ),
          );
          return;
        }

        if (options.areas) {
          const provName = options.province;
          if (!provName) {
            console.log(JSON.stringify({ error: "请用 --province 指定省份" }));
            return;
          }
          const prov = cityData.find((p) => p.province === provName);
          if (!prov) {
            console.log(JSON.stringify({ error: `未找到省份: ${provName}` }));
            return;
          }
          const city = prov.citys.find((c) => c.city === options.areas);
          if (!city) {
            console.log(JSON.stringify({ error: `未找到城市: ${options.areas}` }));
            return;
          }
          console.log(
            JSON.stringify(
              city.areas.map((a) => ({ name: a.area, code: a.code })),
              null,
              2,
            ),
          );
          return;
        }

        if (options.save) {
          if (!options.province || !options.city || !options.areaCode) {
            console.log(JSON.stringify({ error: "保存地址需要 --province, --city, --area-code" }));
            return;
          }
          const prov = cityData.find((p) => p.province === options.province);
          if (!prov) {
            console.log(JSON.stringify({ error: `未找到省份: ${options.province}` }));
            return;
          }
          const city = prov.citys.find((c) => c.city === options.city);
          if (!city) {
            console.log(JSON.stringify({ error: `未找到城市: ${options.city}` }));
            return;
          }
          const area = city.areas.find((a) => a.code === options.areaCode);
          if (!area) {
            console.log(JSON.stringify({ error: `未找到地区编码: ${options.areaCode}` }));
            return;
          }
          const saved = {
            divisionId: area.code,
            province: prov.province,
            city: city.city,
            area: area.area,
          };
          await storage.saveAddress(saved);
          console.log(JSON.stringify({ saved }, null, 2));
          return;
        }

        if (options.set) {
          const province = await select({
            message: "选择省份",
            choices: cityData.map((p) => ({ name: p.province, value: p })),
          });

          const city = await select({
            message: "选择城市",
            choices: province.citys.map((c) => ({ name: c.city, value: c })),
          });

          const areaCode = await select({
            message: "选择地区",
            choices: city.areas.map((a) => ({ name: a.area, value: a.code })),
          });

          const areaName = city.areas.find((a) => a.code === areaCode)?.area ?? "";
          const saved = {
            divisionId: areaCode,
            province: province.province,
            city: city.city,
            area: areaName,
          };

          await storage.saveAddress(saved);
          console.log(JSON.stringify({ saved }, null, 2));
          return;
        }

        const address = await storage.getAddress();
        console.log(JSON.stringify({ address }, null, 2));
      } catch (error) {
        handleCommandError(error);
      }
    },
  );

  return cmd;
}
