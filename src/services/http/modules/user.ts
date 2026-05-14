/**
 * 用户级 API — 店铺/仓库/选品商品查询
 */

import { authClient } from "../client.js";
import { toParams } from "../../../utils/params.js";
import type { PagedResponse } from "../interface.js";
import type {
  UserShop,
  UserStock,
  SelectGoodsItem,
  SelectGoodsListParams,
} from "../../../types/goods.js";

const client = authClient;

/** 获取用户已授权的所有店铺（跨平台） */
export async function getUserShopList(): Promise<UserShop[]> {
  const data = await client.get<UserShop[]>("mms/user/shop/list");
  return data ?? []; // API 返回 null 时兜底空数组
}

/** 获取用户的所有仓库 */
export async function getUserStockList(): Promise<UserStock[]> {
  const data = await client.get<UserStock[]>("mms/user/stock/list");
  return data ?? [];
}

/** 获取选品商品列表，可按仓库 ID 或商品 ID 过滤，支持分页 */
export async function getSelectGoodsList(params?: SelectGoodsListParams): Promise<PagedResponse<SelectGoodsItem>> {
  const queryParams = params ? toParams(params) : undefined;
  return client.get<PagedResponse<SelectGoodsItem>>("mms/seller/goods/select/list", queryParams);
}
