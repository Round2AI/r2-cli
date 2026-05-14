/** 上架列表表格组件 — 多列密集展示，一行一条记录 */
import { Box, Text } from "ink";
import type { ListingInfo } from "../types/goods.js";
import { BaseTable, useTableLayout, truncate } from "./BaseTable.js";

interface ListingTableProps {
  items: ListingInfo[];
  total: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  init: { label: "待上架", color: "yellow" },
  up: { label: "已上架", color: "green" },
  down: { label: "已下架", color: "gray" },
  fail: { label: "失败", color: "red" },
  sold: { label: "已售出", color: "blue" },
};

const COL_ID = 4;
const COL_STATUS = 8;
const COL_BRAND = 8;
const COL_PRICE = 8;
const COL_PLATFORM = 8;
const COL_SHOP = 11;
const COL_STOCK = 10;
const COL_GOODS_NO = 10;
const COL_THIRD = 12;

function formatTime(ts: number): string {
  if (!ts) return "-";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Header({ fillWidth }: { fillWidth: number }) {
  return (
    <Box flexDirection="row">
      <Box width={COL_ID}>
        <Text bold color="white">ID</Text>
      </Box>
      <Box width={COL_STATUS}>
        <Text bold color="white">状态</Text>
      </Box>
      <Box width={COL_BRAND}>
        <Text bold color="white">品牌</Text>
      </Box>
      <Box width={fillWidth}>
        <Text bold color="white">商品名称</Text>
      </Box>
      <Box width={COL_PRICE}>
        <Text bold color="white">价格</Text>
      </Box>
      <Box width={COL_PLATFORM}>
        <Text bold color="white">平台</Text>
      </Box>
      <Box width={COL_SHOP}>
        <Text bold color="white">店铺</Text>
      </Box>
      <Box width={COL_STOCK}>
        <Text bold color="white">仓库商品</Text>
      </Box>
      <Box width={COL_GOODS_NO}>
        <Text bold color="white">货号</Text>
      </Box>
      <Box width={COL_THIRD}>
        <Text bold color="white">三方编号</Text>
      </Box>
    </Box>
  );
}

function Row({ item, fillWidth }: { item: ListingInfo; fillWidth: number }) {
  const status = STATUS_MAP[item.status] ?? { label: item.status, color: "white" };

  return (
    <Box flexDirection="row">
      <Box width={COL_ID}>
        <Text color="gray">{item.id}</Text>
      </Box>
      <Box width={COL_STATUS}>
        <Text color={status.color}>{status.label}</Text>
      </Box>
      <Box width={COL_BRAND}>
        <Text color="cyan">{truncate(item.brandName || "-", COL_BRAND - 1)}</Text>
      </Box>
      <Box width={fillWidth}>
        <Text>{truncate(item.goodsName, fillWidth - 1)}</Text>
      </Box>
      <Box width={COL_PRICE}>
        <Text color="yellow">¥{item.price}</Text>
      </Box>
      <Box width={COL_PLATFORM}>
        <Text color="gray">{item.platform}</Text>
      </Box>
      <Box width={COL_SHOP}>
        <Text color="gray">{item.shopId}</Text>
      </Box>
      <Box width={COL_STOCK}>
        <Text color="gray">{truncate(`${item.stockGoodsId}`, COL_STOCK - 1)}</Text>
      </Box>
      <Box width={COL_GOODS_NO}>
        <Text color="gray">{truncate(item.goodsNo || "-", COL_GOODS_NO - 1)}</Text>
      </Box>
      <Box width={COL_THIRD}>
        <Text color="gray">{truncate(item.thirdItemNo || "-", COL_THIRD - 1)}</Text>
      </Box>
    </Box>
  );
}

export function ListingTable({ items, total }: ListingTableProps) {
  const fixedCols = COL_ID + COL_STATUS + COL_BRAND + COL_PRICE + COL_PLATFORM + COL_SHOP + COL_STOCK + COL_GOODS_NO + COL_THIRD;
  const { fillWidth, totalWidth } = useTableLayout(fixedCols);

  return (
    <BaseTable title="上架列表" count={total} fillWidth={fillWidth} totalWidth={totalWidth} header={<Header fillWidth={fillWidth} />}>
      {items.map((item) => (
        <Row key={item.id} item={item} fillWidth={fillWidth} />
      ))}
    </BaseTable>
  );
}
