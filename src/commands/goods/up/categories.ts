/**
 * 获取分类树
 */

import { Command } from "commander";
import * as xianyuApi from "../../../services/api/modules/xianyu.js";
import { DEFAULT_SP_BIZ_TYPE } from "../../../types/xianyu.js";
import { agentAction } from "../../shared.js";

export function createUpCategoriesCommand(): Command {
  const cmd = new Command("categories");
  cmd.description("获取商品分类列表（JSON 输出）");

  cmd.action(agentAction(async () => {
    const categories = await xianyuApi.getCategories(DEFAULT_SP_BIZ_TYPE);

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
  }));

  return cmd;
}
