/**
 * 获取属性列表
 */

import { Command } from "commander";
import { getXianyuApi } from "../../../services/xy/xianyu-api.service.js";

export function createUpPropsCommand(): Command {
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
      const msg = error instanceof Error ? error.message : String(error);
      console.log(JSON.stringify({ success: false, error: msg }));
      process.exit(1);
    }
  });

  return cmd;
}
