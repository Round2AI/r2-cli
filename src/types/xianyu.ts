/**
 * 闲鱼相关类型定义
 */

// ==================== 店铺 ====================

export interface XyShop {
  id: string;
  name: string;
  thirdUserId: string;
  expiresIn: number;
  status?: string;
}

// ==================== 寄售商品 ====================

export type GoodsStatus = "" | "wait" | "on" | "sold" | "down";
export type SaleType = "hang" | "send";

export interface XySaleChannel {
  id: string;
  price: number;
  sold: number; // 0: 未售, 1: 已售
  status: "on" | "down";
  goodsInfoId?: string;
}

export interface SellerGoodsItem {
  id: string;
  name: string;
  image: string;
  goodsNo: string;
  size: string;
  price: number;
  saleType: SaleType;
  status: GoodsStatus;
  statusName: string;
  gmtCreate: string;
  xySaleChannel: XySaleChannel | null;
}

export interface SellerGoodsListParams {
  key?: string;
  status?: GoodsStatus;
  page?: number;
  size?: number;
  createTimeSort?: string;
}

export interface SellerGoodsListResult {
  items: SellerGoodsItem[];
  total: number;
}

// ==================== 闲鱼商品详情 ====================

export interface XyGoodsDetail {
  itemBizType: string;
  stuffStatus: string;
  title: string;
  desc: string;
  reservePrice: string;
  originalPrice?: string;
  barcode?: string;
  size?: string;
  brandName?: string;
  goodsNo?: string;
  goodsInfoId?: string;
  account?: string;
  [key: string]: unknown;
}

// ==================== 类目 ====================

export interface XyCategory {
  catId: string;
  catName: string;
  channel: string;
  channelCatId: string;
}

export interface XyCategoryGroup {
  label: string;
  value: string;
  children: { label: string; value: string; channelCatId: string }[];
}

// ==================== 属性 ====================

export interface XyPropValue {
  valueId: string;
  valueName: string;
  propId?: string;
}

export interface XyProp {
  propId: string;
  propName: string;
  channelCatId: string;
  propsValues: XyPropValue[];
  index?: number;
  propsValue?: string;
}

// ==================== 上架参数 ====================

export type StuffLevel = "100" | "-1" | "99" | "95" | "90";

export const STUFF_LABELS: Record<StuffLevel, string> = {
  "100": "全新",
  "-1": "准新",
  "99": "99新",
  "95": "95新",
  "90": "9新",
};

export const ITEM_BIZ_TYPES = [
  { label: "闲鱼严选", value: "15" },
  { label: "普通商品", value: "2" },
] as const;

export interface ItemAttr {
  propId: string;
  valueId: string;
  valueName: string;
}

export interface AfterSalesDo {
  supportFd24hsPolicy: boolean;
  supportFd48hsPolicy: boolean;
  supportNfrPolicy: boolean;
  supportSdrPolicy: boolean;
}

export interface XyGoodsUpParams {
  goodsInfoId: string;
  account: string;
  itemBizType: string;
  reservePrice: string;
  stuffStatus: string;
  desc: string;
  divisionId?: string;
  channelCatId: string;
  categoryId: string;
  itemAttrList: ItemAttr[];
  apiAfterSalesDo: AfterSalesDo;
  barcode?: string;
  transportFee?: number;
  goodsNo?: string;
  size?: string;
  title?: string;
  originalPrice?: string;
}
