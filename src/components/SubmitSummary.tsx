import React from "react";
import { Box, Text } from "ink";
import type { XyGoodsUpParams } from "../types/xianyu.js";
import type { StoredAddress } from "../services/storage/types.js";
import type { XyShop } from "../types/xianyu.js";
import { STUFF_LABELS, ITEM_BIZ_TYPES } from "../types/xianyu.js";
import type { StuffLevel } from "../types/xianyu.js";

interface SubmitSummaryProps {
  shop: XyShop;
  params: XyGoodsUpParams;
  address: StoredAddress | null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box flexDirection="row">
      <Box width={10}>
        <Text color="gray">{label}</Text>
      </Box>
      <Text color="yellow">{value}</Text>
    </Box>
  );
}

export function SubmitSummary({ shop, params, address }: SubmitSummaryProps) {
  return (
    <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
      <Text bold color="cyan">上架摘要</Text>
      <Box flexDirection="column" marginTop={1}>
        <Row label="店铺" value={shop.name} />
        <Row label="类型" value={ITEM_BIZ_TYPES.find((t) => t.value === params.itemBizType)?.label ?? params.itemBizType} />
        <Row label="成色" value={STUFF_LABELS[params.stuffStatus as StuffLevel] ?? params.stuffStatus} />
        <Row label="售价" value={`¥${params.reservePrice}`} />
        {address && <Row label="地址" value={`${address.province} ${address.city} ${address.area}`} />}
        {params.desc && <Row label="描述" value={params.desc.length > 50 ? params.desc.slice(0, 50) + "..." : params.desc} />}
        {params.barcode && <Row label="扣码" value={params.barcode} />}
        {params.channelCatId && <Row label="分类" value={params.channelCatId} />}
        {params.itemAttrList.length > 0 && <Row label="属性" value={params.itemAttrList.map((a) => a.valueName).join(", ")} />}
      </Box>
    </Box>
  );
}
