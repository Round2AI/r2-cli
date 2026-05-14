/**
 * 上架/下架/改价/查询 相关 API
 */

import { authClient } from "../client.js";
import { toParams } from "../../../utils/params.js";
import type { PagedResponse } from "../interface.js";
import type {
  ListingUpParams,
  ListingGetParams,
  ListingInfo,
  ListingDownParams,
  ListingUpdatePriceParams,
  ListingListParams,
  UpdateGoodsInfoParams,
  HangUpParams,
} from "../../../types/goods.js";

const client = authClient;

/** 提交上架到闲鱼，返回上架提交结果 */
export async function listingUpXianyu(params: ListingUpParams): Promise<ListingInfo> {
  return client.post<ListingInfo>("mms/goods/listing/up/xianyu", params);
}

/** 查询上架进度，用于轮询上架状态（init/up/down/fail/sold） */
export async function getListingInfo(params: ListingGetParams): Promise<ListingInfo> {
  return client.get<ListingInfo>("mms/goods/listing/get", toParams(params));
}

/** 下架闲鱼商品，支持通过上架记录 ID 或 stockGoodsId+shopId 定位 */
export async function listingDownXianyu(params: ListingDownParams): Promise<Record<string, unknown>> {
  return client.post<Record<string, unknown>>("mms/goods/listing/down/xianyu", params);
}

/** 修改闲鱼上架商品价格 */
export async function listingUpdatePrice(params: ListingUpdatePriceParams): Promise<Record<string, unknown>> {
  return client.post<Record<string, unknown>>("mms/goods/listing/update/xyPrice", params);
}

/** 修改已上架商品信息（标题、描述、品牌、类目、图片、属性等） */
export async function updateGoodsInfo(params: UpdateGoodsInfoParams): Promise<Record<string, unknown>> {
  return client.post<Record<string, unknown>>("mms/goods/listing/update/goodsInfo", params);
}

/** 查询上架列表，支持按状态/店铺/商品/仓库等条件过滤 */
export async function getListingList(params?: ListingListParams): Promise<PagedResponse<ListingInfo>> {
  return client.get<PagedResponse<ListingInfo>>("mms/goods/listing/list", params ? toParams(params) : undefined);
}

/** 闲鱼挂售上架（完整商品信息模式） */
export async function listingHangUpXianyu(params: HangUpParams): Promise<Record<string, unknown>> {
  return client.post<Record<string, unknown>>("mms/goods/listing/hang/up/xianyu", params);
}
