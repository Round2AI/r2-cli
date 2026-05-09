import { Box, Text } from "ink";
import type { SelectGoodsItem } from "../types/goods.js";

interface SelectGoodsTableProps {
  items: SelectGoodsItem[];
  total: number;
}

const COL_ID = 8;
const COL_BRAND = 10;
const COL_SIZE = 6;
const COL_PRICE = 8;
const COL_LEVEL = 6;

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
}

function Header({ fillWidth }: { fillWidth: number }) {
  return (
    <Box flexDirection="row" paddingBottom={0}>
      <Box width={COL_ID}>
        <Text bold color="white">ID</Text>
      </Box>
      <Box width={COL_BRAND}>
        <Text bold color="white">品牌</Text>
      </Box>
      <Box width={fillWidth}>
        <Text bold color="white">商品名称</Text>
      </Box>
      <Box width={COL_SIZE}>
        <Text bold color="white">尺码</Text>
      </Box>
      <Box width={COL_PRICE}>
        <Text bold color="white">起拍价</Text>
      </Box>
      <Box width={COL_LEVEL}>
        <Text bold color="white">等级</Text>
      </Box>
    </Box>
  );
}

function Row({ item, fillWidth }: { item: SelectGoodsItem; fillWidth: number }) {
  return (
    <Box flexDirection="row">
      <Box width={COL_ID}>
        <Text color="gray">{item.id}</Text>
      </Box>
      <Box width={COL_BRAND}>
        <Text color="cyan">{truncate(item.brand?.split("/")[0] ?? "", COL_BRAND - 1)}</Text>
      </Box>
      <Box width={fillWidth}>
        <Text>{truncate(item.goodsName, fillWidth - 1)}</Text>
      </Box>
      <Box width={COL_SIZE}>
        <Text color="gray">{item.size}</Text>
      </Box>
      <Box width={COL_PRICE}>
        <Text color="yellow">¥{item.bidPrice}</Text>
      </Box>
      <Box width={COL_LEVEL}>
        <Text color="green">{item.surveyLevel}</Text>
      </Box>
    </Box>
  );
}

export function SelectGoodsTable({ items, total }: SelectGoodsTableProps) {
  const termWidth = process.stdout.columns || 80;
  const borderPadding = 4;
  const fixedCols = COL_ID + COL_BRAND + COL_SIZE + COL_PRICE + COL_LEVEL;
  const fillWidth = Math.max(termWidth - borderPadding - fixedCols, 20);
  const totalWidth = fixedCols + fillWidth;

  return (
    <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
      <Box flexDirection="row">
        <Text bold color="cyan">选品商品</Text>
        <Text color="gray">{" · 共 "}{total}{" 件"}</Text>
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
