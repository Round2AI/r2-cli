/**
 * 属性匹配步骤（品牌/尺码/成色自动匹配）
 */

import { select, input } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import type { XyProp, XyPropValue, XyGoodsDetail, ItemAttr } from "../../../types/xianyu.js";
import * as xianyuApi from "../../../services/api/modules/xianyu.js";

export async function selectProps(api: typeof xianyuApi, channelCatId: string, detail: XyGoodsDetail, size?: string): Promise<ItemAttr[]> {
  const propsSpinner = ora("加载属性...").start();
  const props = await api.getProps(channelCatId);
  if (!props.length) {
    propsSpinner.warn("无属性");
    return [];
  }
  propsSpinner.succeed(`加载 ${props.length} 个属性`);

  const stuffMap: Record<string, string> = {
    "100": "全新",
    "-1": "全新",
    "99": "几乎全新",
    "95": "轻微穿着痕迹",
    "90": "明显穿着痕迹",
  };

  const attrList: (ItemAttr | undefined)[] = new Array(props.length);

  for (let i = 0; i < props.length; i++) {
    const prop = props[i]!;

    if (prop.propName === "品牌") {
      const attr = await selectBrand(api, prop, detail.brandName);
      if (attr) attrList[i] = attr;
      continue;
    }

    if (["尺码", "鞋码"].includes(prop.propName) && size) {
      const matched = prop.propsValues.find((v) => v.valueName === size);
      if (matched) {
        const pv = await select({
          message: `确认${prop.propName}（已匹配 ${chalk.green(size)}）`,
          choices: prop.propsValues.map((v) => ({ name: v.valueName, value: v })),
          default: matched,
        });
        attrList[i] = {
          propId: prop.propId,
          valueId: pv.valueId,
          valueName: pv.valueName,
          channelCatId: prop.channelCatId,
          propName: prop.propName,
        };
        continue;
      }
    }

    if (prop.propName === "成色" && detail.stuffStatus) {
      const label = stuffMap[detail.stuffStatus];
      if (label) {
        const matched = prop.propsValues.find((v) => v.valueName === label);
        if (matched) {
          const pv = await select({
            message: `确认成色（已匹配 ${chalk.green(label)}）`,
            choices: prop.propsValues.map((v) => ({ name: v.valueName, value: v })),
            default: matched,
          });
          attrList[i] = {
            propId: prop.propId,
            valueId: pv.valueId,
            valueName: pv.valueName,
            channelCatId: prop.channelCatId,
            propName: prop.propName,
          };
          continue;
        }
      }
    }

    if (prop.propsValues.length > 0) {
      const value = await select<XyPropValue | null>({
        message: `选择${prop.propName}`,
        choices: [
          { name: "（跳过）", value: null },
          ...prop.propsValues.map((v) => ({ name: v.valueName, value: v as XyPropValue | null })),
        ],
      });
      if (value) {
        attrList[i] = {
          propId: prop.propId,
          valueId: value.valueId,
          valueName: value.valueName,
          channelCatId: prop.channelCatId,
          propName: prop.propName,
        };
      }
    }
  }

  return attrList.filter((a): a is ItemAttr => a !== undefined);
}

async function selectBrand(api: typeof xianyuApi, prop: XyProp, brandName?: string): Promise<ItemAttr | null> {
  if (brandName) {
    try {
      const values = await api.getPropValues(prop.channelCatId, prop.propId, brandName);
      if (values.length > 0) {
        const value = await select<XyPropValue | "__manual__">({
          message: `确认品牌（已匹配 ${chalk.green(values[0]!.valueName)}）`,
          choices: [
            ...values.map((v) => ({ name: v.valueName, value: v })),
            { name: "（手动搜索其他品牌）", value: "__manual__" },
          ],
          default: values[0]!,
        });
        if (value !== "__manual__") {
          return {
            propId: prop.propId,
            valueId: value.valueId,
            valueName: value.valueName,
            channelCatId: prop.channelCatId,
            propName: prop.propName,
          };
        }
      }
    } catch {
      // fall through to manual
    }
  }

  const keyword = await input({ message: "输入品牌关键词搜索（留空跳过）" });
  if (!keyword) return null;

  const values = await api.getPropValues(prop.channelCatId, prop.propId, keyword);
  if (!values.length) {
    console.log(chalk.yellow("  未找到匹配品牌"));
    return null;
  }

  const brand = await select({
    message: "选择品牌",
    choices: values.map((v) => ({ name: v.valueName, value: v })),
  });

  return {
    propId: prop.propId,
    valueId: brand.valueId,
    valueName: brand.valueName,
    channelCatId: prop.channelCatId,
    propName: prop.propName,
  };
}
