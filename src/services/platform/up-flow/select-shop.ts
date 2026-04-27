/**
 * 店铺选择步骤（含缓存逻辑）
 */

import { select, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import React from "react";
import { createStorageService } from "../../storage/index.js";
import { CliError } from "../../../errors/index.js";
import { renderOnce } from "../../../utils/index.js";
import { SelectionResult } from "../../../components/SelectionResult.js";
import type { XyShop } from "../../../types/xianyu.js";
import { getXianyuApi } from "../xianyu-api.service.js";

type XyApi = ReturnType<typeof getXianyuApi>;

export async function resolveShop(api: XyApi, preferredShopId?: string): Promise<{ shop: XyShop; platform: string }> {
  const storage = createStorageService();
  const cached = await storage.getShop();

  if (cached && !preferredShopId) {
    console.log(chalk.gray(`  缓存店铺: ${cached.name} (${cached.thirdUserId}) [${cached.platform}]`));
    const useCached = await confirm({ message: "使用缓存的店铺？", default: true });
    if (useCached) {
      const shops = await api.getShops(cached.platform);
      const found = shops.find((s) => s.thirdUserId === cached.thirdUserId);
      if (found && Date.now() <= found.expiresIn) {
        renderOnce(React.createElement(SelectionResult, { label: "已选择店铺", value: `${found.name} (${found.thirdUserId})` }));
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
  const shops = await api.getShops(platform);
  if (!shops.length) {
    throw new CliError("未找到已授权的店铺，请先在第二回合 APP 中授权");
  }

  const shop = await selectShop(shops, preferredShopId);
  if (Date.now() > shop.expiresIn) {
    throw new CliError(`店铺 "${shop.name}" 授权已过期，请在第二回合 APP 中重新授权`);
  }

  await storage.saveShop({
    thirdUserId: shop.thirdUserId,
    name: shop.name,
    platform,
  });
  renderOnce(React.createElement(SelectionResult, { label: "已选择店铺", value: `${shop.name} (${shop.thirdUserId})` }));

  return { shop, platform };
}

export async function selectShop(shops: XyShop[], preferredShopId?: string): Promise<XyShop> {
  const activeShops = shops.filter((s) => Date.now() <= s.expiresIn);
  const shopList = activeShops.length > 0 ? activeShops : shops;

  if (preferredShopId) {
    const found = shopList.find((s) => s.thirdUserId === preferredShopId || s.id === preferredShopId);
    if (found) {
      renderOnce(React.createElement(SelectionResult, { label: "已选择店铺", value: found.name }));
      return found;
    }
    console.log(chalk.yellow(`  未找到指定店铺 "${preferredShopId}"，请从列表中选择`));
  }

  if (shopList.length === 1) {
    const only = shopList[0];
    if (!only) throw new CliError("店铺列表为空");
    renderOnce(React.createElement(SelectionResult, { label: "已选择店铺", value: only.name }));
    return only;
  }

  return select({
    message: "选择店铺",
    choices: shopList.map((s) => ({
      name: `${s.name} (ID: ${s.thirdUserId})${Date.now() > s.expiresIn ? " [已过期]" : ""}`,
      value: s,
    })),
  }) as Promise<XyShop>;
}
