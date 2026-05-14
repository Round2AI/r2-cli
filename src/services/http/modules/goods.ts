/**
 * 闲鱼 API 模块 — barrel re-export
 *
 * 按领域拆分到独立文件：
 * - listing.ts   → 上架/下架/改价/查询
 * - user.ts      → 店铺/仓库/选品商品
 * - upload.ts    → 图片上传
 * - categories.ts → 类目/属性/品牌
 */

export {
  listingUpXianyu,
  getListingInfo,
  listingDownXianyu,
  listingUpdatePrice,
  updateGoodsInfo,
  getListingList,
  listingHangUpXianyu,
} from "./listing.js";

export {
  getUserShopList,
  getUserStockList,
  getSelectGoodsList,
} from "./user.js";

export {
  uploadXyImages,
} from "./upload.js";

export {
  getXyCategories,
  getXyProps,
  getXyPropValues,
} from "./categories.js";

