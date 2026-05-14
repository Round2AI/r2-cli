/** 选品商品表格组件 — 品牌/名称/尺码/起拍价/等级 */
import { Box, Text } from "ink";
import type { SelectGoodsItem } from "../types/goods.js";
import { BaseTable, useTableLayout, truncate } from "./BaseTable.js";

interface SelectGoodsTableProps {
  items: SelectGoodsItem[];
  total: number;
}

const COL_ID = 8;
const COL_BRAND = 10;
const COL_SIZE = 6;
const COL_PRICE = 8;
const COL_LEVEL = 6;

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
  const fixedCols = COL_ID + COL_BRAND + COL_SIZE + COL_PRICE + COL_LEVEL;
  const { fillWidth, totalWidth } = useTableLayout(fixedCols);

  return (
    <BaseTable title="选品商品" count={total} countLabel="件" fillWidth={fillWidth} totalWidth={totalWidth} header={<Header fillWidth={fillWidth} />}>
      {items.map((item) => (
        <Row key={item.id} item={item} fillWidth={fillWidth} />
      ))}
    </BaseTable>
  );
}
