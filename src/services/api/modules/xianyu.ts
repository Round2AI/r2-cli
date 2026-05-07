/**
 * 闲鱼 API — 模块级函数
 */

import { ApiClientService } from "../client.js";
import type {
  XyShop,
  SellerGoodsListParams,
  SellerGoodsListResult,
  XyGoodsDetail,
  XyCategory,
  XyProp,
  XyPropValue,
  XyGoodsUpParams,
} from "../../../types/xianyu.js";

const client = new ApiClientService();

function toParams(obj: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  }
  return params;
}

export async function getShops(platform: string = "xianyu"): Promise<XyShop[]> {
  return client.get<XyShop[]>("platform/shop/list", toParams({ platform }));
}

export async function getSellerGoodsList(params: SellerGoodsListParams): Promise<SellerGoodsListResult> {
  return client.get<SellerGoodsListResult>("mms/seller/goods/info/list", toParams({ ...params }));
}

export async function getXyGoodsInfo(goodsInfoId: string, xyShopId: string): Promise<XyGoodsDetail> {
  return client.get<XyGoodsDetail>("mms/seller/xy/goods/info", toParams({ goodsInfoId, xyShopId }));
}

export async function getCategories(spBizType: number): Promise<XyCategory[]> {
  return client.get<XyCategory[]>("platform/xy/cat", toParams({ spBizType }));
}

export async function getProps(channelCatId: string): Promise<XyProp[]> {
  return client.get<XyProp[]>("platform/xy/props", toParams({ channelCatId }));
}

export async function getPropValues(channelCatId: string, propId: string, key?: string): Promise<XyPropValue[]> {
  return client.get<XyPropValue[]>("platform/xy/props/value", toParams({ channelCatId, propId, key }));
}

export async function upGoods(params: XyGoodsUpParams): Promise<{ result: string }> {
  return client.post<{ result: string }>("mms/seller/xy/goods/up", params);
}

export async function batchDown(goodsChannelIds: string): Promise<Record<string, unknown>> {
  return client.get("mms/seller/xy/goods/batch/down", toParams({ goodsChannelIds }));
}

export async function batchReUp(goodsChannelIds: string): Promise<Record<string, unknown>> {
  return client.get("mms/seller/xy/goods/reUp", toParams({ goodsChannelIds }));
}

export async function updatePrice(id: string, price: string): Promise<Record<string, unknown>> {
  return client.post("mms/seller/xy/goods/update/price", { id, price });
}
