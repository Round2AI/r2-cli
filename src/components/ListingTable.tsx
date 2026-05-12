import { Box, Text } from "ink";
import type { ListingInfo } from "../types/goods.js";

interface ListingTableProps {
  items: ListingInfo[];
  total: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  init: { label: "待上架", color: "yellow" },
  up: { label: "已上架", color: "green" },
  down: { label: "已下架", color: "gray" },
  fail: { label: "失败", color: "red" },
};

const COL_ID = 4;
const COL_STATUS = 8;
const COL_BRAND = 12;
const COL_PRICE = 10;
const COL_SPEC = 6;
const COL_STOCK = 8;

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
}

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
      <Box width={COL_SPEC}>
        <Text bold color="white">规格</Text>
      </Box>
      <Box width={COL_STOCK}>
        <Text bold color="white">库存ID</Text>
      </Box>
    </Box>
  );
}

function DetailRow({ item }: { item: ListingInfo }) {
  return (
    <Box flexDirection="column">
      <Text color="gray">{`  shopId: ${item.shopId}  thirdItemNo: ${item.thirdItemNo || "-"}  outItemNo: ${item.outItemNo || "-"}  货号: ${item.goodsNo || "-"}  ${item.type || "-"}  ${item.platform}  创建: ${formatTime(item.gmtCreate)}  修改: ${formatTime(item.gmtModified)}`}</Text>
    </Box>
  );
}

function Row({ item, fillWidth }: { item: ListingInfo; fillWidth: number }) {
  const status = STATUS_MAP[item.status] ?? { label: item.status, color: "white" };

  return (
    <Box flexDirection="column">
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
        <Box width={COL_SPEC}>
          <Text color="gray">{item.spec || "-"}</Text>
        </Box>
        <Box width={COL_STOCK}>
          <Text color="gray">{item.stockGoodsId}</Text>
        </Box>
      </Box>
      <DetailRow item={item} />
    </Box>
  );
}

export function ListingTable({ items, total }: ListingTableProps) {
  const termWidth = process.stdout.columns || 80;
  const borderPadding = 4;
  const fixedCols = COL_ID + COL_STATUS + COL_BRAND + COL_PRICE + COL_SPEC + COL_STOCK;
  const fillWidth = Math.max(termWidth - borderPadding - fixedCols, 20);
  const totalWidth = fixedCols + fillWidth;

  return (
    <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
      <Box flexDirection="row">
        <Text bold color="cyan">上架列表</Text>
        <Text color="gray">{" · 共 "}{total}{" 条"}</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Header fillWidth={fillWidth} />
        <Text color="gray">{"─".repeat(totalWidth)}</Text>
        {items.map((item) => (
          <Row key={item.id} item={item} fillWidth={fillWidth} />
        ))}
      </Box>
    </Box>
  );
}
