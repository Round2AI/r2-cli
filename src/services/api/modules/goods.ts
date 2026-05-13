/**
 * 闲鱼 API — 模块级函数
 */

import { authClient } from "../client.js";
import { basename } from "node:path";
import { toParams } from "../../../utils/params.js";
import { compressImageIfNeeded } from "../../../utils/image.js";
import type {
  ListingUpParams,
  ListingGetParams,
  ListingInfo,
  ListingDownParams,
  ListingUpdatePriceParams,
  ListingListParams,
  ListingListResult,
  UpdateGoodsInfoParams,
  UserShop,
  UserStock,
  SelectGoodsListParams,
  SelectGoodsListResult,
  HangUpParams,
  ImageUploadResult,
  XyCatItem,
  XyPropItem,
  XyPropValue,
} from "../../../types/goods.js";

const client = authClient;

// ==================== 上架（Listing） ====================

/** 提交上架到闲鱼，返回上架提交结果 */
export async function listingUpXianyu(params: ListingUpParams): Promise<ListingInfo> {
  return client.post<ListingInfo>("mms/goods/listing/up/xianyu", params);
}

/** 查询上架进度，用于轮询上架状态（init/up/down/fail/sold） */
export async function getListingInfo(params: ListingGetParams): Promise<ListingInfo> {
  return client.get<ListingInfo>("mms/goods/listing/get", toParams({ ...params }));
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
export async function getListingList(params?: ListingListParams): Promise<ListingListResult> {
  return client.get<ListingListResult>("mms/goods/listing/list", params ? toParams({ ...params }) : undefined);
}

// ==================== 用户级接口 ====================

/** 获取用户已授权的所有店铺（跨平台） */
export async function getUserShopList(): Promise<UserShop[]> {
  const data = await client.get<UserShop[]>("mms/user/shop/list");
  return data ?? []; // API 返回 null 时兜底空数组，防止 .length/.map 报错
}

/** 获取用户的所有仓库 */
export async function getUserStockList(): Promise<UserStock[]> {
  const data = await client.get<UserStock[]>("mms/user/stock/list");
  return data ?? []; // 同上
}

/** 获取选品商品列表，可按仓库 ID 或商品 ID 过滤，支持分页 */
export async function getSelectGoodsList(params?: SelectGoodsListParams): Promise<SelectGoodsListResult> {
  const queryParams = params ? toParams({ ...params }) : undefined;
  return client.get<SelectGoodsListResult>("mms/seller/goods/select/list", queryParams);
}

// ==================== 挂售上架（Hang Up） ====================

/** 上传图片结果 */
export interface UploadImagesResult {
  /** 成功上传的图片 */
  images: ImageUploadResult[];
  /** 上传失败的图片 */
  failed: { file: string; error: string }[];
}

/** 批量上传图片到闲鱼，返回图片 ID 列表（必须在挂售前调用） */
export async function uploadXyImages(shopId: string, filePaths: string[]): Promise<UploadImagesResult> {
  const uploadOne = async (filePath: string, retries = 1): Promise<ImageUploadResult> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const fileBuffer = await compressImageIfNeeded(filePath);
        const fileName = basename(filePath);
        const formData = new FormData();
        formData.append("file", new Blob([fileBuffer]), fileName);
        return await client.upload<ImageUploadResult>(
          `platform/xy/media/upload?shopId=${encodeURIComponent(shopId)}`,
          formData,
        );
      } catch (err) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw err;
      }
    }
    throw new Error("unreachable");
  };

  const settled = await Promise.allSettled(filePaths.map(uploadOne));
  const images: ImageUploadResult[] = [];
  const failed: { file: string; error: string }[] = [];

  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    if (r.status === "fulfilled") {
      images.push(r.value);
    } else {
      failed.push({ file: filePaths[i], error: r.reason?.message ?? String(r.reason) });
    }
  }

  return { images, failed };
}

/** 闲鱼挂售上架（完整商品信息模式） */
export async function listingHangUpXianyu(params: HangUpParams): Promise<Record<string, unknown>> {
  return client.post<Record<string, unknown>>("mms/goods/listing/hang/up/xianyu", params);
}

// ==================== 闲鱼类目/属性查询 ====================

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
