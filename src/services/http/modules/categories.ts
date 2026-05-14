/**
 * 闲鱼类目/属性查询 API
 */

import { authClient } from "../client.js";
import { toParams } from "../../../utils/params.js";
import type { XyCatItem, XyPropItem, XyPropValue } from "../../../types/goods.js";

const client = authClient;

/** 获取闲鱼类目列表（spBizType=16 为奢品） */
export async function getXyCategories(spBizType = 16): Promise<XyCatItem[]> {
  const data = await client.get<XyCatItem[]>("platform/xy/cat", toParams({ spBizType }));
  return data ?? [];
}

/** 获取指定类目下的属性列表（含可选值） */
export async function getXyProps(channelCatId: string): Promise<XyPropItem[]> {
  const data = await client.get<XyPropItem[]>("platform/xy/props", toParams({ channelCatId }));
  return data ?? [];
}

/** 获取属性值列表（用于品牌搜索） */
export async function getXyPropValues(channelCatId: string, propId: string, key?: string): Promise<XyPropValue[]> {
  const data = await client.get<XyPropValue[]>("platform/xy/props/value", toParams({ channelCatId, propId, key }));
  return data ?? [];
}
