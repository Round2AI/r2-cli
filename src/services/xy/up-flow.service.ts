/**
 * 上架流程交互服务
 * 步骤顺序：店铺(缓存) → 选择商品 → 成色 → 描述 → 类目 → 售价 → 属性 → 服务+确认
 */

import { select, input, confirm, checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import { getXianyuApi } from "./xianyu-api.service.js";
import { createStorageService } from "../storage/index.js";
import type {
  XyShop,
  SellerGoodsItem,
  XyGoodsDetail,
  XyCategoryGroup,
  XyProp,
  XyPropValue,
  XyGoodsUpParams,
  ItemAttr,
  StuffLevel,
} from "../../types/xianyu.js";
import { STUFF_LABELS, ITEM_BIZ_TYPES } from "../../types/xianyu.js";
import cityData from "./citys.json" with { type: "json" };

export interface UpOptions {
  shop?: string;
  bizType?: string;
  stuffStatus?: string;
  desc?: string;
  price?: string;
  catId?: string;
  channelCatId?: string;
  barcode?: string;
}

const SERVICE_KEYS = ["supportFd24hsPolicy", "supportFd48hsPolicy", "supportNfrPolicy", "supportSdrPolicy"] as const;
type ServiceKey = (typeof SERVICE_KEYS)[number];

const TOTAL_STEPS = 7;

function stepHeader(step: number, title: string): void {
  console.log(chalk.cyan(`\n━━━ 步骤 ${step}/${TOTAL_STEPS}: ${title} ━━━\n`));
}

export class UpFlowService {
  private api = getXianyuApi();

  async run(_goodsInfoId?: string, options?: UpOptions): Promise<void> {
    const opts = options ?? {};

    // 店铺选择（优先缓存，非编号步骤）
    const { shop } = await this.resolveShop(opts.shop);

    // 步骤 1: 选择商品
    stepHeader(1, "选择商品");
    const productResult = await this.selectProduct();
    if (!productResult) return;
    const { id: selectedId, item: selectedItem } = productResult;

    // 获取商品详情
    const detailSpinner = ora("获取商品信息...").start();
    const goodsDetail = await this.api.getXyGoodsInfo(selectedId, shop.thirdUserId);
    detailSpinner.succeed("商品信息已获取");

    // 步骤 2: 选择成色
    stepHeader(2, "选择成色等级");
    const itemBizType = "2";

    const stuffChoices = Object.entries(STUFF_LABELS).map(([value, label]) => ({ name: label, value }));
    const stuffStatus = opts.stuffStatus
      ?? await select({
        message: "选择成色等级",
        choices: stuffChoices,
        default: stuffChoices.find(c => c.value === goodsDetail.stuffStatus)?.value,
      });

    // 步骤 3: 商品描述
    stepHeader(3, "商品描述");
    const descInput: { message: string; default?: string; validate?: (v: string) => string | boolean } = { message: "商品描述" };
    if (goodsDetail.desc) descInput.default = goodsDetail.desc;
    const desc = opts.desc ?? await input(descInput);

    // 步骤 4: 选择类目
    stepHeader(4, "选择类目");
    const { categoryId, channelCatId } = await this.selectCategory(opts.catId, opts.channelCatId);

    // 步骤 5: 售价
    stepHeader(5, "售价");
    const priceInput: { message: string; default?: string; validate: (v: string) => string | boolean } = { message: "售价", validate: v => v ? true : "请输入售价" };
    if (goodsDetail.reservePrice) priceInput.default = goodsDetail.reservePrice;
    const reservePrice = opts.price ?? await input(priceInput);

    let barcode: string | undefined;
    if (itemBizType === "15") {
      const barcodeInput: { message: string; default?: string; validate: (v: string) => string | boolean } = { message: "商品扣码", validate: v => v ? true : "严选商品必须输入扣码" };
      if (goodsDetail.barcode) barcodeInput.default = goodsDetail.barcode;
      barcode = opts.barcode ?? await input(barcodeInput);
    }

    // 步骤 6: 选择属性
    stepHeader(6, "选择属性");
    const itemAttrList = await this.selectProps(channelCatId, goodsDetail);

    // 步骤 7: 服务保障 + 确认提交
    stepHeader(7, "确认提交");

    const divisionId = await this.selectDivision();

    const apiAfterSalesDo = {
      supportFd24hsPolicy: false,
      supportFd48hsPolicy: false,
      supportNfrPolicy: false,
      supportSdrPolicy: false,
    };

    if (itemBizType !== "2") {
      const services = await checkbox({
        message: "选择服务保障",
        choices: [
          { name: "24小时发货", value: "supportFd24hsPolicy" },
          { name: "48小时发货", value: "supportFd48hsPolicy" },
          { name: "描述不符包退", value: "supportNfrPolicy" },
          { name: "七天无理由", value: "supportSdrPolicy" },
        ],
      });
      for (const key of services as ServiceKey[]) {
        apiAfterSalesDo[key] = true;
      }
    }

    const { price: _price, ...detailRest } = goodsDetail;
    const params: XyGoodsUpParams = {
      ...detailRest,
      goodsInfoId: selectedId,
      account: shop.thirdUserId,
      itemBizType: itemBizType as string,
      reservePrice: reservePrice as string,
      originalPrice: reservePrice as string,
      stuffStatus: stuffStatus as string,
      desc: desc as string,
      divisionId,
      categoryId,
      channelCatId,
      goodsNo: goodsDetail.goodsNo ?? selectedItem?.goodsNo ?? "",
      size: goodsDetail.size ?? selectedItem?.size ?? "",
      itemAttrList,
      apiAfterSalesDo,
      ...(barcode ? { barcode } : {}),
    };

    await this.displaySummary(shop, params);

    const confirmed = await confirm({ message: "确认提交上架？", default: true });
    if (!confirmed) {
      console.log(chalk.gray("已取消上架"));
      return;
    }

    console.log(chalk.cyan("\n提交上架中..."));
    try {
      const result = await this.api.upGoods(params);
      console.log(chalk.green(`\n上架成功！${result.result ?? ""}`));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(chalk.red(`\n上架失败: ${msg}`));
    }
  }

  // ==================== 店铺选择（缓存优先） ====================

  private async resolveShop(preferredShopId?: string): Promise<{ shop: XyShop; platform: string }> {
    const storage = createStorageService();
    const cached = await storage.getShop();

    if (cached && !preferredShopId) {
      console.log(chalk.gray(`  缓存店铺: ${cached.name} (${cached.thirdUserId}) [${cached.platform}]`));
      const useCached = await confirm({ message: "使用缓存的店铺？", default: true });
      if (useCached) {
        const shops = await this.api.getShops(cached.platform);
        const found = shops.find(s => s.thirdUserId === cached.thirdUserId);
        if (found && Date.now() <= found.expiresIn) {
          console.log(chalk.green(`  已选择店铺: { name: "${found.name}", thirdUserId: "${found.thirdUserId}" }\n`));
          return { shop: found, platform: cached.platform };
        }
        console.log(chalk.yellow("  缓存店铺已过期或不可用，请重新选择"));
      }
    }

    const platform = await select({
      message: "选择平台",
      choices: [
        { name: "闲鱼", value: "xianyu" },
        { name: "抖音", value: "douyin" },
      ],
    });
    const shops = await this.api.getShops(platform);
    if (!shops.length) {
      console.log(chalk.red("未找到已授权的店铺，请先在小程序中授权"));
      process.exit(1);
    }

    const shop = await this.selectShop(shops, preferredShopId);
    if (Date.now() > shop.expiresIn) {
      console.log(chalk.red(`店铺 "${shop.name}" 授权已过期，请重新授权`));
      process.exit(1);
    }

    await storage.saveShop({
      thirdUserId: shop.thirdUserId,
      name: shop.name,
      platform,
    });
    console.log(chalk.green(`  已选择店铺: { name: "${shop.name}", thirdUserId: "${shop.thirdUserId}" }\n`));

    return { shop, platform };
  }

  // ==================== 步骤 1: 选择商品 ====================

  private async selectProduct(): Promise<{ id: string; item: SellerGoodsItem } | null> {
    const spinner = ora("加载商品列表...").start();

    let page = 1;
    const allItems: SellerGoodsItem[] = [];
    let hasMore = true;

    while (hasMore) {
      const result = await this.api.getSellerGoodsList({ status: "wait", page, size: 20 });
      allItems.push(...result.items);
      hasMore = result.items.length >= 20;
      page++;
    }

    if (!allItems.length) {
      spinner.warn("没有可上架的商品（未同步到闲鱼）");
      return null;
    }
    spinner.succeed(`加载 ${allItems.length} 个待同步商品`);

    const selected = await select({
      message: "请选择要上架的商品",
      choices: allItems.map(item => ({
        name: `${item.name ?? ""}  ${chalk.gray(`ID:${item.id}`)}  ${chalk.gray(`货号:${item.goodsNo || "-"}`)}  ${chalk.gray(`规格:${item.size || "-"}`)}  ${chalk.green(`¥${item.price}`)}`,
        value: item.id,
      })),
      pageSize: 15,
    });

    const item = allItems.find(i => i.id === selected)!;
    console.log(chalk.green(`\n  已选择: { id: "${item.id}", name: "${item.name}" }`));
    console.log(chalk.gray(`  货号: ${item.goodsNo || "-"}  规格: ${item.size || "-"}  售价: ¥${item.price}`));

    return { id: selected, item };
  }

  // ==================== 选择店铺 ====================

  private async selectShop(shops: XyShop[], preferredShopId?: string): Promise<XyShop> {
    const activeShops = shops.filter(s => Date.now() <= s.expiresIn);
    const shopList = activeShops.length > 0 ? activeShops : shops;

    if (preferredShopId) {
      const found = shopList.find(s => s.thirdUserId === preferredShopId || s.id === preferredShopId);
      if (found) {
        console.log(chalk.green(`  已选择店铺: ${found.name}`));
        return found;
      }
      console.log(chalk.yellow(`  未找到指定店铺 "${preferredShopId}"，请从列表中选择`));
    }

    if (shopList.length === 1) {
      const only = shopList[0]!;
      console.log(chalk.green(`  已选择店铺: ${only.name}`));
      return only;
    }

    return select({
      message: "选择店铺",
      choices: shopList.map(s => ({
        name: `${s.name} (ID: ${s.thirdUserId})${Date.now() > s.expiresIn ? " [已过期]" : ""}`,
        value: s,
      })),
    }) as Promise<XyShop>;
  }

  // ==================== 选择发货地址 ====================

  private async selectDivision(): Promise<string> {
    const storage = createStorageService();
    const saved = await storage.getAddress();

    if (saved) {
      console.log(chalk.gray(`  发货地址: ${saved.province} ${saved.city} ${saved.area}`));
      const useSaved = await confirm({ message: "使用上次地址？", default: true });
      if (useSaved) return saved.divisionId;
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
    await storage.saveAddress({
      divisionId: areaCode,
      province: province.province,
      city: city.city,
      area: areaName,
    });

    return areaCode;
  }

  // ==================== 步骤 4: 选择类目 ====================

  private async selectCategory(
    preferredCatId?: string,
    preferredChannelCatId?: string,
  ): Promise<{ categoryId: string; channelCatId: string }> {
    if (preferredCatId && preferredChannelCatId) {
      return { categoryId: preferredCatId, channelCatId: preferredChannelCatId };
    }

    const catSpinner = ora("加载类目...").start();
    const categories = await this.api.getCategories(16);
    const groups = this.groupCategories(categories);
    catSpinner.succeed(`加载 ${categories.length} 个类目`);

    const group = await select({
      message: "选择分类",
      choices: groups.map(g => ({ name: g.label, value: g })),
    }) as XyCategoryGroup;

    if (group.children.length <= 1) {
      const child = group.children[0];
      return { categoryId: group.value, channelCatId: child?.value ?? "" };
    }

    const sub = await select({
      message: "选择子分类",
      choices: group.children.map(c => ({ name: c.label, value: c })),
    });

    return { categoryId: group.value, channelCatId: (sub as { value: string }).value };
  }

  private groupCategories(categories: import("../../types/xianyu.js").XyCategory[]): XyCategoryGroup[] {
    const map = new Map<string, XyCategoryGroup>();
    for (const cat of categories) {
      if (!map.has(cat.catId)) {
        map.set(cat.catId, { label: cat.catName, value: cat.catId, children: [] });
      }
      map.get(cat.catId)!.children.push({
        label: cat.channel,
        value: cat.channelCatId,
        channelCatId: cat.channelCatId,
      });
    }
    return Array.from(map.values());
  }

  // ==================== 步骤 6: 选择属性 ====================

  private async selectProps(channelCatId: string, detail: XyGoodsDetail): Promise<ItemAttr[]> {
    const propsSpinner = ora("加载属性...").start();
    const props = await this.api.getProps(channelCatId);
    if (!props.length) { propsSpinner.warn("无属性"); return []; }
    propsSpinner.succeed(`加载 ${props.length} 个属性`);

    const stuffMap: Record<string, string> = {
      "100": "全新", "-1": "全新", "99": "几乎全新",
      "95": "轻微穿着痕迹", "90": "明显穿着痕迹",
    };

    const attrList: (ItemAttr | undefined)[] = new Array(props.length);

    for (let i = 0; i < props.length; i++) {
      const prop = props[i]!;

      if (prop.propName === "品牌") {
        const attr = await this.selectBrand(prop, detail.brandName);
        if (attr) attrList[i] = attr;
        continue;
      }

      if (["尺码", "鞋码"].includes(prop.propName) && detail.size) {
        const matched = prop.propsValues.find(v => v.valueName === detail.size);
        if (matched) {
          const pv = await select({
            message: `确认${prop.propName}（已匹配 ${chalk.green(detail.size)}）`,
            choices: prop.propsValues.map(v => ({ name: v.valueName, value: v })),
            default: matched,
          });
          attrList[i] = { propId: prop.propId, valueId: pv.valueId, valueName: pv.valueName };
          continue;
        }
      }

      if (prop.propName === "成色" && detail.stuffStatus) {
        const label = stuffMap[detail.stuffStatus];
        if (label) {
          const matched = prop.propsValues.find(v => v.valueName === label);
          if (matched) {
            const pv = await select({
              message: `确认成色（已匹配 ${chalk.green(label)}）`,
              choices: prop.propsValues.map(v => ({ name: v.valueName, value: v })),
              default: matched,
            });
            attrList[i] = { propId: prop.propId, valueId: pv.valueId, valueName: pv.valueName };
            continue;
          }
        }
      }

      if (prop.propsValues.length > 0) {
        const value = await select<XyPropValue | null>({
          message: `选择${prop.propName}`,
          choices: [
            { name: "（跳过）", value: null },
            ...prop.propsValues.map(v => ({ name: v.valueName, value: v as XyPropValue | null })),
          ],
        });
        if (value) {
          attrList[i] = { propId: prop.propId, valueId: value.valueId, valueName: value.valueName };
        }
      }
    }

    return attrList.filter((a): a is ItemAttr => a !== undefined);
  }

  private async selectBrand(prop: XyProp, brandName?: string): Promise<ItemAttr | null> {
    if (brandName) {
      try {
        const values = await this.api.getPropValues(prop.channelCatId, prop.propId, brandName);
        if (values.length > 0) {
          const MANUAL = "__manual__" as const;
          const value = await select({
            message: `确认品牌（已匹配 ${chalk.green(values[0]!.valueName)}）`,
            choices: [
              ...values.map(v => ({ name: v.valueName, value: v as XyPropValue | typeof MANUAL })),
              { name: "（手动搜索其他品牌）", value: MANUAL as unknown as XyPropValue },
            ],
            default: values[0]! as XyPropValue | typeof MANUAL,
          });
          if (value !== MANUAL) {
            const v = value as XyPropValue;
            return { propId: prop.propId, valueId: v.valueId, valueName: v.valueName };
          }
        }
      } catch {
        // fall through to manual
      }
    }

    const keyword = await input({ message: "输入品牌关键词搜索（留空跳过）" });
    if (!keyword) return null;

    const values = await this.api.getPropValues(prop.channelCatId, prop.propId, keyword);
    if (!values.length) {
      console.log(chalk.yellow("  未找到匹配品牌"));
      return null;
    }

    const brand = await select({
      message: "选择品牌",
      choices: values.map(v => ({ name: v.valueName, value: v })),
    });

    return { propId: prop.propId, valueId: brand.valueId, valueName: brand.valueName };
  }

  // ==================== 步骤 7: 确认摘要 ====================

  private async displaySummary(shop: XyShop, params: XyGoodsUpParams): Promise<void> {
    console.log(chalk.white("  店铺:   ") + chalk.yellow(shop.name));
    console.log(chalk.white("  类型:   ") + chalk.yellow(ITEM_BIZ_TYPES.find(t => t.value === params.itemBizType)?.label ?? params.itemBizType));
    console.log(chalk.white("  成色:   ") + chalk.yellow(STUFF_LABELS[params.stuffStatus as StuffLevel] ?? params.stuffStatus));
    console.log(chalk.white("  售价:   ") + chalk.yellow(`¥${params.reservePrice}`));
    const savedAddr = await createStorageService().getAddress();
    if (savedAddr) {
      console.log(chalk.white("  地址:   ") + chalk.yellow(`${savedAddr.province} ${savedAddr.city} ${savedAddr.area}`));
    }
    if (params.desc) {
      console.log(chalk.white("  描述:   ") + chalk.yellow(params.desc.length > 50 ? params.desc.slice(0, 50) + "..." : params.desc));
    }
    if (params.barcode) {
      console.log(chalk.white("  扣码:   ") + chalk.yellow(params.barcode));
    }
    if (params.channelCatId) {
      console.log(chalk.white("  分类ID: ") + chalk.yellow(params.channelCatId));
    }
    if (params.itemAttrList.length) {
      const attrStr = params.itemAttrList.map(a => a.valueName).join(", ");
      console.log(chalk.white("  属性:   ") + chalk.yellow(attrStr));
    }
    const svcKeys = SERVICE_KEYS.filter(k => params.apiAfterSalesDo[k]);
    if (svcKeys.length) {
      const labels: Record<string, string> = {
        supportFd24hsPolicy: "24小时发货",
        supportFd48hsPolicy: "48小时发货",
        supportNfrPolicy: "描述不符包退",
        supportSdrPolicy: "七天无理由",
      };
      console.log(chalk.white("  保障:   ") + chalk.yellow(svcKeys.map(k => labels[k]).join(", ")));
    }
    console.log();
  }
}
