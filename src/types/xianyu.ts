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

// ==================== 寄售商品 ====================

/** 商品状态 */
export type GoodsStatus = "" | "wait" | "on" | "sold" | "down";

/** 销售类型 */
export type SaleType = "hang" | "send";

/** 商品闲鱼销售渠道信息 */
export interface XySaleChannel {
  /** 渠道记录ID */
  id: string;
  /** 闲鱼售价 */
  price: number;
  /** 是否已售 0=未售 1=已售 */
  sold: number;
  /** 上架状态 on=已上架 down=已下架 */
  status: "on" | "down";
  /** 关联的寄售商品ID */
  goodsInfoId?: string;
}

/** 寄售商品列表项 */
export interface SellerGoodsItem {
  /** 寄售系统商品ID */
  id: string;
  /** 商品名称 */
  name: string;
  /** 商品主图URL */
  image: string;
  /** 商品货号 */
  goodsNo: string;
  /** 商品规格/尺码 */
  size: string;
  /** 寄售售价 */
  price: number;
  /** 销售类型 hang=挂架 send=寄出 */
  saleType: SaleType;
  /** 商品状态 */
  status: GoodsStatus;
  /** 状态中文名称 */
  statusName: string;
  /** 创建时间 */
  gmtCreate: string;
  /** 闲鱼渠道信息，null表示未上架到闲鱼 */
  xySaleChannel: XySaleChannel | null;
}

/** 寄售商品列表查询参数 */
export interface SellerGoodsListParams {
  /** 搜索关键词 */
  key?: string;
  /** 商品状态过滤 */
  status?: GoodsStatus;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  size?: number;
  /** 创建时间排序 */
  createTimeSort?: string;
}

/** 寄售商品列表返回结果 */
export interface SellerGoodsListResult {
  /** 商品列表 */
  items: SellerGoodsItem[];
  /** 总数量 */
  total: number;
}

// ==================== 闲鱼商品详情 ====================

/** 闲鱼商品详情（API返回的完整商品信息） */
export interface XyGoodsDetail {
  /** 商品ID */
  goodsId: string;
  /** snake的类目id */
  snakeCatId: string;
  /** 闲鱼用户ID，决定上到哪个账号下，需取得应用授权 */
  account: string;
  /** 商品标题 */
  title: string;
  /** 原始商品名称 */
  oriGoodsName: string;
  /** 商品描述 */
  desc: string;
  /** 商品图片URL列表 */
  imageList: string[];
  /** 商品业务类型 0=已验货不入仓 1=已验货入仓 2=普通商品 15=免检入仓 16=免检严选 */
  itemBizType: string;
  /** 商品原价 */
  originalPrice: number | string;
  /** 底价/售价/二手价 */
  reservePrice: number | string;
  /** sp业务类型 */
  spBizType: string;
  /** 交易类型 */
  tradeType: string;
  /** 是否验货宝 */
  yhb: boolean;
  /** 成色等级 100=全新 -1=准新 99=99新 95=95新 90=9新 */
  stuffStatus: string;
  /** 是否SKU商品 */
  skuType: boolean;
  /** 鉴定扣号/条形码 */
  barcode: string;
  /** 品牌名称 */
  brandName: string;
  /**
   * 闲鱼卖家服务
   * 部分业务需要强制开启
   * 需要账号本身开通：闲鱼APP → 我的 → 设置 → 卖家服务 → 保障服务
   */
  apiAfterSalesDo: AfterSalesDo;
}

// ==================== 类目 ====================

/** 闲鱼类目 */
export interface XyCategory {
  /** 主类目ID */
  catId: string;
  /** 主类目名称 */
  catName: string;
  /** 渠道标识 */
  channel: string;
  /** 子类目ID（渠道类目ID） */
  channelCatId: string;
}

/** 类目分组（用于交互式选择） */
export interface XyCategoryGroup {
  /** 分组标签（主类目名称） */
  label: string;
  /** 分组值（主类目ID） */
  value: string;
  /** 子类目列表 */
  children: { label: string; value: string; channelCatId: string }[];
}

// ==================== 属性 ====================

/** 属性值 */
export interface XyPropValue {
  /** 属性值ID */
  valueId: string;
  /** 属性值名称 */
  valueName: string;
  /** 所属属性ID */
  propId?: string;
}

/** 商品属性 */
export interface XyProp {
  /** 属性ID */
  propId: string;
  /** 属性名称 */
  propName: string;
  /** 所属渠道类目ID */
  channelCatId: string;
  /** 属性可选值列表 */
  propsValues: XyPropValue[];
  /** 排序索引 */
  index?: number;
  /** 当前选中的属性值 */
  propsValue?: string;
}

// ==================== 上架参数 ====================

/** 成色等级 */
export type StuffLevel = "100" | "-1" | "99" | "95" | "90";

/** 成色等级中文映射 */
export const STUFF_LABELS: Record<StuffLevel, string> = {
  "100": "全新",
  "-1": "准新",
  "99": "99新",
  "95": "95新",
  "90": "9新",
};

/** 商品业务类型（目前仅支持普通商品） */
export const ITEM_BIZ_TYPES = [{ label: "普通商品", value: "2" }] as const;

/** 商品属性键值对 */
export interface ItemAttr {
  /** 属性ID */
  propId: string;
  /** 属性值ID */
  valueId: string;
  /** 属性值名称 */
  valueName: string;
  /** 所属渠道类目ID */
  channelCatId: string;
  /** 属性名称 */
  propName: string;
}

/** 闲鱼卖家保障服务 */
export interface AfterSalesDo {
  /** 是否支持 极速发货-10分钟 */
  supportFd10msPolicy?: boolean;
  /** 是否支持 极速发货-24小时 */
  supportFd24hsPolicy?: boolean;
  /** 是否支持 急速发货-48小时 */
  supportFd48hsPolicy?: boolean;
  /** 是否支持描述不符包邮退 */
  supportNfrPolicy?: boolean;
  /** 是否支持七天无理由 */
  supportSdrPolicy?: boolean;
  /** 是否支持 虚拟-描述不符包退 */
  supportVnrPolicy?: boolean;
  /** 是否支持 正品保障 */
  supportGpaPolicy?: boolean;
}

/** 闲鱼商品上架参数（基于XyGoodsDetail扩展） */
export interface XyGoodsUpParams extends XyGoodsDetail {
  /** 商品信息ID */
  goodsInfoId: string;
  /** 搬家用的转移ID */
  xyTransferId?: string;
  /** 商品货号 */
  goodsNo: string;
  /** 商品规格/尺码 */
  size: string;
  /** 行政区划ID，参与距离显示 */
  divisionId: string;
  /** 渠道类目ID（子分类） */
  channelCatId: string;
  /** 商品类目ID（主分类） */
  categoryId: string;
  /** 商品属性列表 */
  itemAttrList: ItemAttr[];
  /** 运费，不传即包邮 */
  transportFee?: number;
}
