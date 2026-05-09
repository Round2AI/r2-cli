/**
 * 闲鱼 API — 模块级函数
 */

import { ApiClientService } from "../client.js";
import type {
  ListingUpParams,
  ListingGetParams,
  ListingInfo,
  ListingDownParams,
  ListingUpdatePriceParams,
  ListingListParams,
  ListingListResult,
  UserShop,
  UserStock,
  SelectGoodsListParams,
  SelectGoodsListResult,
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

// ==================== 上架（Listing） ====================

export async function listingUpXianyu(params: ListingUpParams): Promise<ListingInfo> {
  return client.post<ListingInfo>("mms/goods/listing/up/xianyu", params);
}

export async function getListingInfo(params: ListingGetParams): Promise<ListingInfo> {
  return client.get<ListingInfo>("mms/goods/listing/get", toParams({ ...params }));
}

export async function listingDownXianyu(params: ListingDownParams): Promise<unknown> {
  return client.post("mms/goods/listing/down/xianyu", params);
}

export async function listingUpdatePrice(params: ListingUpdatePriceParams): Promise<unknown> {
  return client.post("mms/goods/listing/update/xyPrice", params);
}

export async function getListingList(params?: ListingListParams): Promise<ListingListResult> {
  return client.get<ListingListResult>("mms/goods/listing/list", params ? toParams({ ...params }) : undefined);
}

// ==================== 用户级接口 ====================

export async function getUserShopList(): Promise<UserShop[]> {
  const data = await client.get<UserShop[]>("mms/user/shop/list");
  return data ?? [];
}

export async function getUserStockList(): Promise<UserStock[]> {
  const data = await client.get<UserStock[]>("mms/user/stock/list");
  return data ?? [];
}

export async function getSelectGoodsList(params?: SelectGoodsListParams): Promise<SelectGoodsListResult> {
  return client.get<SelectGoodsListResult>(
    "mms/seller/goods/select/list",
    params ? toParams({ ...params }) : undefined,
  );
}
