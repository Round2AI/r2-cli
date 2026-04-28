/**
 * 摘要展示 + 发货地址选择
 */

import { select, confirm } from "@inquirer/prompts";
import React from "react";
import { createStorageService } from "../../../services/storage/index.js";
import { renderOnce } from "../../../utils/render.js";
import { SelectionResult } from "../../../components/SelectionResult.js";
import { SubmitSummary } from "../../../components/SubmitSummary.js";
import type { XyShop, XyGoodsUpParams } from "../../../types/xianyu.js";
import { cityData } from "../../../utils/city.js";

export async function selectDivision(): Promise<string> {
  const storage = createStorageService();
  const saved = await storage.getAddress();

  if (saved) {
    renderOnce(React.createElement(SelectionResult, { label: "发货地址", value: `${saved.province} ${saved.city} ${saved.area}` }));
    const useSaved = await confirm({ message: "使用上次地址？", default: true });
    if (useSaved) return saved.divisionId;
  }

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
  await storage.saveAddress({
    divisionId: areaCode,
    province: province.province,
    city: city.city,
    area: areaName,
  });

  return areaCode;
}

export async function displaySummary(shop: XyShop, params: XyGoodsUpParams): Promise<void> {
  const address = await createStorageService().getAddress();
  renderOnce(React.createElement(SubmitSummary, { shop, params, address }));
}
