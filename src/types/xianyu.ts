/**
 * 闲鱼相关类型定义
 */

// ==================== 店铺 ====================

/** 已授权的闲鱼/抖音店铺 */
export interface XyShop {
  /** 店铺ID */
  id: string;
  /** 店铺名称 */
  name: string;
  /** 第三方用户ID（闲鱼用户ID） */
  thirdUserId: string;
  /** 授权过期时间戳（毫秒） */
  expiresIn: number;
  /** 授权状态 */
  status?: string;
}

// ==================== 上架（Listing） ====================

/** 上架参数 */
export interface ListingUpParams {
  /** 库存商品ID */
  stockGoodsId: number;
  /** 店铺ID */
  shopId: string;
  /** 价格 */
  price: number;
  /** 平台 */
  platform: string;
}

/** 上架信息查询参数 */
export interface ListingGetParams {
  /** 上架记录ID */
  id?: string;
  /** 库存商品ID */
  stockGoodsId?: number;
  /** 店铺ID */
  shopId?: string;
  /** 平台 */
  platform?: string;
}

/** 上架信息 */
export interface ListingInfo {
  id: string;
  stockGoodsId: number;
  shopId: string;
  platform: string;
  price: number;
  status: string;
  [key: string]: unknown;
}

// ==================== 用户级接口 ====================

/** 用户店铺（跨平台：闲鱼/抖音等） */
export interface UserShop {
  id: string;
  userId: string;
  shopId: string;
  platform: string;
  shopName: string;
  accessToken?: string;
  expiresIn?: number;
  refreshExpireIn?: number;
  gmtCreate: number;
  gmtModified: number;
}

/** 用户仓库 */
export interface UserStock {
  id: string;
  userId: string;
  stockId: string;
  stockName: string;
  gmtCreate: number;
  gmtModified: number;
}

/** 选品商品 */
export interface SelectGoodsItem {
  id: string;
  stockGoodsId: string;
  startPrice: number;
  depositPrice: number;
  salePrice: number;
  oStockId: string;
  oStockName: string;
  outOrderId: string;
  surveyLevel: string;
  origin: string;
  batchNo: string;
  locationNo: string;
  barcode: string;
  goodsNo: string;
  size: string;
  goodsName: string;
  brand: string;
  bidPrice: number;
  status: string;
  receiveTime: number;
  stockInTime: number;
  cate1Name: string;
  cate2Name: string;
  cate3Name: string;
  survey: string;
  photo: string;
  saleStatus: string;
  auctionStatus: string;
  failCount: number;
  appraiseResult: string;
  recentAuctionTime: number;
  recentAuctionGiveUp: string;
  auctionCondition: string;
  brandId: string;
  cate1Id: string;
  gmtCreate: number;
  downBuyCount: number;
  recycleOrigin: string;
}

/** 选品商品查询参数 */
export interface SelectGoodsListParams {
  page?: number;
  size?: number;
  stockId?: string;
  stockGoodsId?: string;
}

/** 选品商品列表返回 */
export interface SelectGoodsListResult {
  items: SelectGoodsItem[];
  total: string;
  page: number;
  perPage: number;
}
