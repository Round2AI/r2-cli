/**
 * 闲鱼 API 服务
 */

import { AuthenticatedApiClient } from "../api/authenticated-client.service.js";
import type {
  XyShop,
  SellerGoodsListParams,
  SellerGoodsListResult,
  XyGoodsDetail,
  XyCategory,
  XyProp,
  XyPropValue,
  XyGoodsUpParams,
} from "../../types/xianyu.js";

export class XianyuApiService {
  private client: AuthenticatedApiClient;

  constructor() {
    this.client = new AuthenticatedApiClient();
  }

  private toParams(obj: Record<string, unknown>): URLSearchParams {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    }
    return params;
  }

  async getShops(platform: string = "xianyu"): Promise<XyShop[]> {
    return this.client.get<XyShop[]>("platform/shop/list", this.toParams({ platform }));
  }

  async getSellerGoodsList(params: SellerGoodsListParams): Promise<SellerGoodsListResult> {
    return this.client.get<SellerGoodsListResult>(
      "mms/seller/goods/info/list",
      this.toParams(params as unknown as Record<string, unknown>),
    );
  }

  async getXyGoodsInfo(goodsInfoId: string, xyShopId: string): Promise<XyGoodsDetail> {
    const params = this.toParams({ goodsInfoId, xyShopId });
    return this.client.get<XyGoodsDetail>("mms/seller/xy/goods/info", params);
  }

  async getCategories(spBizType: number): Promise<XyCategory[]> {
    return this.client.get<XyCategory[]>("platform/xy/cat", this.toParams({ spBizType }));
  }

  async getProps(channelCatId: string): Promise<XyProp[]> {
    return this.client.get<XyProp[]>("platform/xy/props", this.toParams({ channelCatId }));
  }

  async getPropValues(channelCatId: string, propId: string, key?: string): Promise<XyPropValue[]> {
    const params = this.toParams({ channelCatId, propId, key });
    return this.client.get<XyPropValue[]>("platform/xy/props/value", params);
  }

  async upGoods(params: XyGoodsUpParams): Promise<{ result: string }> {
    return this.client.post<{ result: string }>("mms/seller/xy/goods/up", params);
  }

  async batchDown(goodsChannelIds: string): Promise<unknown> {
    return this.client.get<unknown>("mms/seller/xy/goods/batch/down", this.toParams({ goodsChannelIds }));
  }

  async batchReUp(goodsChannelIds: string): Promise<unknown> {
    return this.client.get<unknown>("mms/seller/xy/goods/reUp", this.toParams({ goodsChannelIds }));
  }

  async updatePrice(id: string, price: string): Promise<unknown> {
    return this.client.post<unknown>("mms/seller/xy/goods/update/price", { id, price });
  }
}

let instance: XianyuApiService | null = null;

export function getXianyuApi(): XianyuApiService {
  if (!instance) {
    instance = new XianyuApiService();
  }
  return instance;
}
