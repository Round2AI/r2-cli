import { Box, Text } from "ink";
import type { SellerGoodsItem } from "../types/xianyu.js";

interface GoodsTableProps {
  items: SellerGoodsItem[];
  total: number;
  statusFilter?: string;
}

function getXyStatus(item: SellerGoodsItem): { text: string; color: string } {
  if (!item.xySaleChannel) {
    if (item.status === "wait") return { text: "待上架", color: "yellow" };
    return { text: "-", color: "gray" };
  }
  if (item.xySaleChannel.sold === 1) return { text: "已出售", color: "red" };
  if (item.xySaleChannel.status === "on") return { text: "已上架", color: "green" };
  return { text: "已下架", color: "gray" };
}

function Header() {
  return (
    <Box flexDirection="row" paddingBottom={0}>
      <Box width={10}>
        <Text bold color="white">ID</Text>
      </Box>
      <Box width={8}>
        <Text bold color="white">状态</Text>
      </Box>
      <Box width={50}>
        <Text bold color="white">名称</Text>
      </Box>
      <Box width={16}>
        <Text bold color="white">货号</Text>
      </Box>
      <Box width={8}>
        <Text bold color="white">规格</Text>
      </Box>
      <Box width={10} justifyContent="flex-end">
        <Text bold color="white">售价</Text>
      </Box>
      <Box width={10} justifyContent="flex-end">
        <Text bold color="white">闲鱼</Text>
      </Box>
    </Box>
  );
}

function Row({ item }: { item: SellerGoodsItem }) {
  const xy = getXyStatus(item);
  const xyPrice = item.xySaleChannel ? `¥${item.xySaleChannel.price}` : "";

  return (
    <Box flexDirection="row">
      <Box width={10}>
        <Text color="gray">{item.id}</Text>
      </Box>
      <Box width={8}>
        <Text>{item.statusName}</Text>
      </Box>
      <Box width={50} overflow="hidden">
        <Text bold wrap="truncate">
          {item.name ?? ""}
        </Text>
      </Box>
      <Box width={16}>
        <Text color="gray">{item.goodsNo || "-"}</Text>
      </Box>
      <Box width={8}>
        <Text color="gray">{item.size || "-"}</Text>
      </Box>
      <Box width={10} justifyContent="flex-end">
        <Text color="green">¥{item.price}</Text>
      </Box>
      <Box width={10} justifyContent="flex-end">
        <Text color={xy.color}>{xy.text}</Text>
        {xyPrice && <Text color="gray"> {xyPrice}</Text>}
      </Box>
    </Box>
  );
}

export function GoodsTable({ items, total, statusFilter }: GoodsTableProps) {
  const label = statusFilter ? ` (${statusFilter})` : "";

  return (
    <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
      <Box flexDirection="row">
        <Text bold color="cyan">寄售商品列表{label}</Text>
        <Text color="gray">{" · "}{total} 条</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Header />
        <Text color="gray">{"─".repeat(72)}</Text>
        {items.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </Box>
    </Box>
  );
}
