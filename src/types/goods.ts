/**
 * 闲鱼相关类型定义
 */

// ==================== 店铺 ====================

/** 已授权的闲鱼/抖音店铺 */
export interface XyShop {
  /** 店铺 ID */
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
  /** 库存商品 ID */
  stockGoodsId: number;
  /** 店铺 ID */
  shopId: string;
  /** 价格（单位：元） */
  price: number;
  /** 平台（xianyu/douyin 等） */
  platform: string;
}

/** 上架信息查询参数 */
export interface ListingGetParams {
  /** 上架记录 ID */
  id?: string;
  /** 库存商品 ID */
  stockGoodsId?: number;
  /** 店铺 ID */
  shopId?: string;
  /** 平台 */
  platform?: string;
}

/** 上架信息 */
export interface ListingInfo {
  /** 上架记录 ID */
  id: string;
  /** 用户 ID */
  userId: number;
  /** 编号，用于获取闲鱼质检报告 */
  no: string;
  /** 仓库商品 ID */
  stockGoodsId: number;
  /** 平台店铺 ID */
  shopId: string;
  /** 外部商品编号，用于校验上架时商品唯一性 */
  outItemNo: string;
  /** 三方商品编号，上架成功后返回的平台商品 ID */
  thirdItemNo: string;
  /** 上架渠道平台 */
  platform: string;
  /** 订单状态：init=待上架 fail=上架失败 down=已下架 up=已上架 sold=已售出 */
  status: string;
  /** 平台返回错误原因 */
  errorMsg: string;
  /** 创建时间（时间戳） */
  gmtCreate: number;
  /** 修改时间（时间戳） */
  gmtModified: number;
  /** 基础库商品 ID */
  goodsId: number;
  /** 商品名称 */
  goodsName: string;
  /** 货号 */
  goodsNo: string;
  /** 主图 URL */
  goodsImage: string;
  /** 规格 */
  spec: string;
  /** 商品类型：shallow=浅库存 deep=深库存 */
  type: string;
  /** 仓库 ID */
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
  /** 上架记录 ID */
  id?: string | undefined;
  /** 仓库商品 ID */
  stockGoodsId?: number | undefined;
  /** 平台店铺 ID */
  shopId?: string | undefined;
}

/** 改价参数（id 或 stockGoodsId+shopId 二选一，price 必填） */
export interface ListingUpdatePriceParams {
  /** 上架记录 ID */
  id?: string | undefined;
  /** 仓库商品 ID */
  stockGoodsId?: number | undefined;
  /** 平台店铺 ID */
  shopId?: string | undefined;
  /** 新价格（单位：元，必填） */
  price: number;
}

/** 上架列表查询参数 */
export interface ListingListParams {
  /** 平台店铺 ID */
  shopId?: string | undefined;
  /** 上架渠道平台 */
  platform?: string | undefined;
  /** 仓库商品 ID */
  stockGoodsId?: number | undefined;
  /** 上架记录 ID */
  id?: string | undefined;
  /** 仓库 ID */
  stockId?: string | undefined;
  /** 订单状态：init=待上架 fail=上架失败 down=已下架 up=已上架 sold=已售出 */
  status?: string | undefined;
}

/** 上架列表返回 */
export interface ListingListResult {
  items: ListingInfo[];
  total: string;
  page?: number;
  perPage?: number;
}

// ==================== 用户级接口 ====================

/** 用户店铺（跨平台：闲鱼/抖音等） */
export interface UserShop {
  /** 数据库自增 ID（不要用作上架参数） */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 第三方店铺 ID（上架参数用这个，不是 id） */
  shopId: string;
  /** 平台（xianyu/douyin 等） */
  platform: string;
  /** 店铺名称 */
  shopName: string;
  /** 访问令牌 */
  accessToken?: string;
  /** 授权过期时间 */
  expiresIn?: number;
  /** 刷新令牌过期时间 */
  refreshExpireIn?: number;
  /** 创建时间（时间戳） */
  gmtCreate: number;
  /** 修改时间（时间戳） */
  gmtModified: number;
}

/** 用户仓库 */
export interface UserStock {
  /** 数据库 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 仓库 ID（用于过滤选品商品） */
  stockId: string;
  /** 仓库名称 */
  stockName: string;
  /** 创建时间（时间戳） */
  gmtCreate: number;
  /** 修改时间（时间戳） */
  gmtModified: number;
}

/** 选品商品 */
export interface SelectGoodsItem {
  /** 数据库 ID */
  id: string;
  /** 库存商品 ID（上架参数取这个） */
  stockGoodsId: string;
  /** 起拍价 */
  startPrice: number;
  /** 保证金 */
  depositPrice: number;
  /** 建议售价 */
  salePrice: number;
  /** 仓库 ID */
  oStockId: string;
  /** 仓库名称 */
  oStockName: string;
  /** 外部订单 ID */
  outOrderId: string;
  /** 鉴定等级 */
  surveyLevel: string;
  /** 来源 */
  origin: string;
  /** 批次号 */
  batchNo: string;
  /** 库位号 */
  locationNo: string;
  /** 鉴定扣号 */
  barcode: string;
  /** 货号 */
  goodsNo: string;
  /** 尺码 */
  size: string;
  /** 商品名称 */
  goodsName: string;
  /** 品牌 */
  brand: string;
  /** 出价 */
  bidPrice: number;
  /** 状态 */
  status: string;
  /** 收货时间（时间戳） */
  receiveTime: number;
  /** 入库时间（时间戳） */
  stockInTime: number;
  /** 一级分类名称 */
  cate1Name: string;
  /** 二级分类名称 */
  cate2Name: string;
  /** 三级分类名称 */
  cate3Name: string;
  /** 鉴定结果 */
  survey: string;
  /** 商品图片 URL */
  photo: string;
  /** 售卖状态 */
  saleStatus: string;
  /** 拍卖状态 */
  auctionStatus: string;
  /** 失败次数 */
  failCount: number;
  /** 鉴定结果摘要 */
  appraiseResult: string;
  /** 最近拍卖时间（时间戳） */
  recentAuctionTime: number;
  /** 最近拍卖放弃原因 */
  recentAuctionGiveUp: string;
  /** 拍卖条件 */
  auctionCondition: string;
  /** 品牌 ID */
  brandId: string;
  /** 一级分类 ID */
  cate1Id: string;
  /** 创建时间（时间戳） */
  gmtCreate: number;
  /** 下架购买次数 */
  downBuyCount: number;
  /** 回收来源 */
  recycleOrigin: string;
}

/** 选品商品查询参数 */
export interface SelectGoodsListParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  size?: number;
  /** 仓库 ID（按仓库过滤） */
  stockId?: string | undefined;
  /** 库存商品 ID（精确查询） */
  stockGoodsId?: string | undefined;
}

/** 选品商品列表返回 */
export interface SelectGoodsListResult {
  /** 商品列表 */
  items: SelectGoodsItem[];
  /** 总数 */
  total: string;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  perPage: number;
}

// ==================== 挂售上架（Hang Up） ====================

/** 闲鱼类目项 */
export interface XyCatItem {
  /** 大分类 ID（--category-id 取这个） */
  catId: number;
  /** 大分类名称（手机、数码、鞋靴等） */
  catName: string;
  /** 小分类名称（低帮鞋、T恤等） */
  channel: string;
  /** 小分类 ID（--channel-cat-id 取这个） */
  channelCatId: string;
}

/** 闲鱼属性项 */
export interface XyPropItem {
  /** 属性 ID */
  propId: string;
  /** 属性名称（品牌、成色、尺码等） */
  propName: string;
  /** 小分类 ID */
  channelCatId: string;
  /** 可选值列表 */
  propsValues: XyPropValue[];
}

/** 闲鱼属性值 */
export interface XyPropValue {
  /** 属性值 ID */
  valueId: string;
  /** 属性值名称 */
  valueName: string;
  /** 属性 ID */
  propId?: string;
}

/** 图片上传响应 */
export interface ImageUploadResult {
  /** 闲鱼图片 ID（19 位数字，保持字符串避免精度丢失） */
  value: string;
  [key: string]: unknown;
}

/** 商品属性（用于挂售上架 itemAttrList） */
export interface XyItemAttr {
  /** 小分类 ID */
  channelCatId?: string | undefined;
  /** 属性 ID */
  propId?: string | undefined;
  /** 属性名称 */
  propName?: string | undefined;
  /** 属性值 ID */
  valueId?: string | undefined;
  /** 属性值 */
  valueName?: string | undefined;
}

/** 商品图片信息（长图） */
export interface ImageInfo {
  /** 闲鱼图片 ID（必传） */
  imageId: number;
  /** 宽 */
  width?: number | undefined;
  /** 高 */
  height?: number | undefined;
}

/**
 * 闲鱼售后服务配置
 * 部分业务需要强制开启，需账号本身先在闲鱼 APP 开通卖家服务
 * 开通路径：闲鱼 APP → 我的 → 设置 → 卖家服务 → 保障服务 → 去开通
 */
export interface AfterSales {
  /** 极速发货-10分钟，默认 false */
  supportFd10msPolicy?: boolean | undefined;
  /** 极速发货-24小时，默认 true */
  supportFd24hsPolicy?: boolean | undefined;
  /** 描述不符包邮退，默认 true */
  supportNfrPolicy?: boolean | undefined;
  /** 七天无理由退货，默认 true */
  supportSdrPolicy?: boolean | undefined;
  /** 虚拟-描述不符包退，默认 false */
  supportVnrPolicy?: boolean | undefined;
  /** 正品保障，默认 false */
  supportGpaPolicy?: boolean | undefined;
  /** 极速发货-48小时，默认 false */
  supportFd48hsPolicy?: boolean | undefined;
}

/** 修改商品信息参数（goodsListingId 或 stockGoodsId+account 二选一定位商品） */
export interface UpdateGoodsInfoParams {
  /** 商品上架 ID（与 stockGoodsId+account 二选一） */
  goodsListingId?: number;
  /** 库存商品 ID */
  stockGoodsId?: number;
  /** 闲鱼用户名/店铺 ID */
  account?: string;
  /** 商品标题 */
  title?: string;
  /** 商品描述 */
  desc?: string;
  /** 商品类目 ID */
  categoryId?: number;
  /** 渠道类目 ID */
  channelCatId?: string;
  /** 图片 ID 列表 */
  imageIdList?: string[];
  /** 商品属性 */
  itemAttrList?: XyItemAttr[];
  /** 品牌名称 */
  brandName?: string;
  /** 成色等级：100=全新 -1=准新 99=99新 95=95新 90=9新 */
  stuffStatus?: number;
  /** 货号 */
  goodsNo?: string;
  /** 图片类型 ID */
  imageType?: string;
  /** 商品长图 */
  longImageList?: ImageInfo[];
  /** 原价（单位：元） */
  originalPrice?: number;
  /** 尺码 */
  size?: string;
}

/** 挂售上架参数 */
export interface HangUpParams {
  /** 闲鱼用户名，店铺 ID（即 shopId） */
  account: string;
  /** 商品标题/商品名称 */
  title: string;
  /** 底价/售价/二手价（单位：元） */
  reservePrice: number;
  /** 商品类目 ID，大分类（手机、数码、鞋靴等），从 categories 获取 */
  categoryId: number;
  /** 渠道类目 ID，小分类（低帮鞋、T恤等），从 categories 获取 */
  channelCatId: string;
  /** 闲鱼图片 ID 列表，最大 9 张（先上传获取，19 位数字保持字符串避免精度丢失） */
  imageIdList: string[];
  /** 成色等级：100=全新 -1=准新 99=99新 95=95新 90=9新 */
  stuffStatus: number;
  /** 上传的图片类型 ID */
  imageType?: string | undefined;
  /** 货号 */
  goodsNo?: string | undefined;
  /** 商品描述，紧随 title 展示 */
  desc?: string | undefined;
  /** 行政区划 ID，参与距离显示，市级 ID（默认 330100 杭州） */
  divisionId?: number | undefined;
  /** 商品长图，最大 15 张 */
  longImageList?: ImageInfo[] | undefined;
  /** 商品业务类型，默认 2（普通商品） */
  itemBizType?: number | undefined;
  /** 原价（单位：元） */
  originalPrice?: number | undefined;
  /** 商品业务分类，默认 "16"（奢品） */
  spBizType?: string | undefined;
  /** 交易方式：0=仅在线交易 1=仅线下交易 2=线上或线下交易，默认 0 */
  tradeType?: number | undefined;
  /** 运费（单位：元），不传即包邮，默认 0 */
  transportFee?: number | undefined;
  /** 是否开启验货宝，默认 false */
  yhb?: boolean | undefined;
  /** 商品属性说明（来自 props/brands 查询结果） */
  itemAttrList?: XyItemAttr[] | undefined;
  /** 售后服务配置 */
  apiAfterSalesDo?: AfterSales | undefined;
  /** 品牌名称 */
  brandName?: string | undefined;
  /** 类目名称 */
  catName?: string | undefined;
  /** 浅库存尺码 */
  size?: string | undefined;
  /** 商家编码，用于保证商品唯一性，同一个店铺编码唯一 */
  outItemNo?: string | undefined;
  /** 商品原名称 */
  oriGoodsName?: string | undefined;
}
