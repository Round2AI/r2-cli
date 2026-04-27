/**
 * 获取分类树
 */

import { Command } from "commander";
import { getXianyuApi } from "../../../services/xy/xianyu-api.service.js";
import { DEFAULT_SP_BIZ_TYPE } from "../../../types/xianyu.js";

export function createUpCategoriesCommand(): Command {
  const cmd = new Command("categories");
  cmd.description("获取商品分类列表（JSON 输出）");

  cmd.action(async () => {
    try {
      const api = getXianyuApi();
      const categories = await api.getCategories(DEFAULT_SP_BIZ_TYPE);

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
      const msg = error instanceof Error ? error.message : String(error);
      console.log(JSON.stringify({ success: false, error: msg }));
      process.exit(1);
    }
  });

  return cmd;
}
