/**
 * 获取属性列表
 */

import { Command } from "commander";
import * as xianyuApi from "../../../services/api/modules/xianyu.js";
import { agentAction } from "../../shared.js";

export function createUpPropsCommand(): Command {
  const cmd = new Command("props");
  cmd.description("获取分类属性列表（JSON 输出）");
  cmd.argument("<channelCatId>", "渠道分类 ID");
  cmd.option("--brand <keyword>", "搜索品牌关键词");

  cmd.action(agentAction(async (channelCatId: string, options: { brand?: string }) => {
    const props = await xianyuApi.getProps(channelCatId);

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
          const values = await xianyuApi.getPropValues(channelCatId, prop.propId, options.brand);
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
  }));

  return cmd;
}
