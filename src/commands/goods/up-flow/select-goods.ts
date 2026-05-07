/**
 * 商品选择步骤（含分页加载）
 */

import { select } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import { CliError } from "../../../errors/index.js";
import { renderComponent } from "../../../utils/render.js";
import { SelectionResult } from "../../../components/SelectionResult.js";
import type { SellerGoodsItem } from "../../../types/xianyu.js";
import * as xianyuApi from "../../../services/api/modules/xianyu.js";

const MAX_PAGES = 50;

export async function selectProduct(api: typeof xianyuApi): Promise<{ id: string; item: SellerGoodsItem } | null> {
  const spinner = ora("加载商品列表...").start();

  let page = 1;
  const allItems: SellerGoodsItem[] = [];
  let hasMore = true;

  while (hasMore && page <= MAX_PAGES) {
    const result = await api.getSellerGoodsList({ status: "wait", page, size: 20 });
    if (!result?.items) break;
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
    choices: allItems.map((item) => ({
      name: `${item.name ?? ""}  ${chalk.gray(`ID:${item.id}`)}  ${chalk.gray(`货号:${item.goodsNo || "-"}`)}  ${chalk.gray(`规格:${item.size || "-"}`)}  ${chalk.green(`¥${item.price}`)}`,
      value: item.id,
    })),
    pageSize: 15,
  });

  const item = allItems.find((i) => i.id === selected);
  if (!item) throw new CliError("未找到选中的商品");
  renderComponent(SelectionResult, {
    label: "已选择商品",
    value: item.name,
    details: `货号: ${item.goodsNo || "-"}  规格: ${item.size || "-"}  售价: ¥${item.price}`,
  });

  return { id: selected, item };
}
