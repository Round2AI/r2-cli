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
  /** 上架记录ID */
  id: string;
  /** 用户ID */
  userId: number;
  /** 编号，用于获取闲鱼质检报告 */
  no: string;
  /** 仓库商品ID */
  stockGoodsId: number;
  /** 平台店铺ID */
  shopId: string;
  /** 外部商品编号，用于校验上架时商品唯一性 */
  outItemNo: string;
  /** 三方商品编号，上架成功后返回的平台商品ID */
  thirdItemNo: string;
  /** 上架渠道平台 */
  platform: string;
  /** 订单状态 init=待上架 fail=上架失败 down=已下架 up=已上架 sold=已售出 */
  status: string;
  /** 平台返回错误原因 */
  errorMsg: string;
  /** 创建时间（时间戳） */
  gmtCreate: number;
  /** 修改时间（时间戳） */
  gmtModified: number;
  /** 基础库商品ID */
  goodsId: number;
  /** 商品名称 */
  goodsName: string;
  /** 货号 */
  goodsNo: string;
  /** 主图URL */
  goodsImage: string;
  /** 规格 */
  spec: string;
  /** 商品类型 shallow=浅库存 deep=深库存 */
  type: string;
  /** 仓库ID */
  stockId: number;
  /** 品牌名称 */
  brandName: string;
  /** 类目名称 */
  cateName: string;
  /** 鉴定扣号 */
  barcode: string;
  /** 价格（单位：元） */
  price: number;
  /** 上架来源 */
  origin: string;
  [key: string]: unknown;
}

/** 下架参数（id 或 stockGoodsId+shopId 二选一） */
export interface ListingDownParams {
  /** 上架记录ID */
  id?: string | undefined;
  /** 仓库商品ID */
  stockGoodsId?: number | undefined;
  /** 平台店铺ID */
  shopId?: string | undefined;
}

/** 改价参数（id 或 stockGoodsId+shopId 二选一，price 必填） */
export interface ListingUpdatePriceParams {
  /** 上架记录ID */
  id?: string | undefined;
  /** 仓库商品ID */
  stockGoodsId?: number | undefined;
  /** 平台店铺ID */
  shopId?: string | undefined;
  /** 新价格（单位：元，必填） */
  price: number;
}

/** 上架列表查询参数 */
export interface ListingListParams {
  /** 平台店铺ID */
  shopId?: string | undefined;
  /** 上架渠道平台 */
  platform?: string | undefined;
  /** 仓库商品ID */
  stockGoodsId?: number | undefined;
  /** 上架记录ID */
  id?: string | undefined;
  /** 仓库ID */
  stockId?: string | undefined;
  /** 订单状态 init=待上架 fail=上架失败 down=已下架 up=已上架 sold=已售出 */
  status?: string | undefined;
}

/** 上架列表返回 */
export interface ListingListResult {
  list: ListingInfo[];
  total: number;
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
