/**
 * 上架流程服务 — 编排 7 步交互向导
 * 步骤顺序：店铺(缓存) → 选择商品 → 成色 → 描述 → 类目 → 售价 → 属性 → 服务+确认
 */

import { input, confirm, select } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import React from "react";
import { getXianyuApi } from "../xianyu-api.service.js";
import { renderOnce } from "../../../utils/index.js";
import { StepHeader } from "../../../components/StepHeader.js";
import { SubmitResult } from "../../../components/SubmitResult.js";
import { STUFF_LABELS } from "../../../types/xianyu.js";
import type { XyGoodsUpParams, ItemAttr } from "../../../types/xianyu.js";
import { resolveShop } from "./select-shop.js";
import { selectProduct } from "./select-goods.js";
import { selectCategory } from "./select-category.js";
import { selectProps } from "./select-props.js";
import { selectDivision, displaySummary } from "./summary.js";

export interface UpOptions {
  shop?: string;
  stuffStatus?: string;
  desc?: string;
  price?: string;
  catId?: string;
  channelCatId?: string;
  barcode?: string;
}

const TOTAL_STEPS = 7;

/** 打印上架向导步骤标题 */
function stepHeader(step: number, title: string): void {
  renderOnce(React.createElement(StepHeader, { step, total: TOTAL_STEPS, title }));
}

export class UpFlowService {
  private api = getXianyuApi();

  async run(_goodsInfoId?: string, options?: UpOptions): Promise<void> {
    const opts = options ?? {};

    // 店铺选择（优先缓存，非编号步骤）
    const { shop } = await resolveShop(this.api, opts.shop);

    // 步骤 1: 选择商品
    stepHeader(1, "选择商品");
    const productResult = await selectProduct(this.api);
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
    const stuffStatus =
      opts.stuffStatus ??
      (await select({
        message: "选择成色等级",
        choices: stuffChoices,
        default: stuffChoices.find((c) => c.value === goodsDetail.stuffStatus)?.value,
      }));

    // 步骤 3: 商品描述
    stepHeader(3, "商品描述");
    const descInput: { message: string; default?: string; validate?: (v: string) => string | boolean } = { message: "商品描述" };
    if (goodsDetail.desc) descInput.default = goodsDetail.desc;
    const desc = opts.desc ?? (await input(descInput));

    // 步骤 4: 选择类目
    stepHeader(4, "选择类目");
    const { categoryId, channelCatId } = await selectCategory(this.api, opts.catId, opts.channelCatId);

    // 步骤 5: 售价
    stepHeader(5, "售价");
    const priceInput: { message: string; default?: string; validate: (v: string) => string | boolean } = {
      message: "售价",
      validate: (v) => {
        if (!v) return "请输入售价";
        const n = Number(v);
        if (Number.isNaN(n) || n <= 0) return "售价必须为正数";
        return true;
      },
    };
    if (goodsDetail.reservePrice) priceInput.default = String(goodsDetail.reservePrice);
    const reservePrice = opts.price ?? (await input(priceInput));

    // 步骤 6: 选择属性
    stepHeader(6, "选择属性");
    const itemAttrList = await selectProps(this.api, channelCatId, goodsDetail, selectedItem?.size);

    // 步骤 7: 服务保障 + 确认提交
    stepHeader(7, "确认提交");

    const divisionId = await selectDivision();

    const apiAfterSalesDo = goodsDetail.apiAfterSalesDo ?? {};

    const params: XyGoodsUpParams = {
      ...goodsDetail,
      goodsInfoId: selectedId,
      account: shop.thirdUserId,
      itemBizType,
      reservePrice,
      originalPrice: reservePrice,
      stuffStatus,
      desc,
      divisionId,
      categoryId,
      channelCatId,
      goodsNo: selectedItem?.goodsNo ?? "",
      size: selectedItem?.size ?? "",
      itemAttrList,
      apiAfterSalesDo,
    };

    await displaySummary(shop, params);

    const confirmed = await confirm({ message: "确认提交上架？", default: true });
    if (!confirmed) {
      console.log(chalk.gray("已取消上架"));
      return;
    }

    console.log(chalk.cyan("\n提交上架中..."));
    try {
      const result = await this.api.upGoods(params);
      renderOnce(React.createElement(SubmitResult, { success: true, message: `上架成功！${result.result ?? ""}` }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      renderOnce(React.createElement(SubmitResult, { success: false, message: `上架失败: ${msg}` }));
    }
  }
}
