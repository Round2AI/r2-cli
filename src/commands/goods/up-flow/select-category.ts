/**
 * 类目选择步骤
 */

import { select } from "@inquirer/prompts";
import ora from "ora";
import { CliError } from "../../../errors/index.js";
import type { XyCategory, XyCategoryGroup } from "../../../types/xianyu.js";
import { DEFAULT_SP_BIZ_TYPE } from "../../../types/xianyu.js";
import * as xianyuApi from "../../../services/api/modules/xianyu.js";

export async function selectCategory(
  api: typeof xianyuApi,
  preferredCatId?: string,
  preferredChannelCatId?: string,
): Promise<{ categoryId: string; channelCatId: string }> {
  if (preferredCatId && preferredChannelCatId) {
    return { categoryId: preferredCatId, channelCatId: preferredChannelCatId };
  }

  const catSpinner = ora("加载类目...").start();
  const categories = await api.getCategories(DEFAULT_SP_BIZ_TYPE);
  const groups = groupCategories(categories);
  catSpinner.succeed(`加载 ${categories.length} 个类目`);

  const group = (await select({
    message: "选择分类",
    choices: groups.map((g) => ({ name: g.label, value: g })),
  })) as XyCategoryGroup;

  if (group.children.length === 0) {
    throw new CliError(`分类 "${group.label}" 无可用子分类`);
  }

  if (group.children.length === 1) {
    const child = group.children[0]!;
    return { categoryId: group.value, channelCatId: child.value };
  }

  const sub = await select<XyCategoryGroup["children"][number]>({
    message: "选择子分类",
    choices: group.children.map((c) => ({ name: c.label, value: c })),
  });

  return { categoryId: group.value, channelCatId: sub.value };
}

export function groupCategories(categories: XyCategory[]): XyCategoryGroup[] {
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
