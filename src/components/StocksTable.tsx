/** 仓库列表表格组件 */
import { Box, Text } from "ink";
import type { UserStock } from "../types/goods.js";
import { BaseTable, useTableLayout } from "./BaseTable.js";

interface StocksTableProps {
  stocks: UserStock[];
}

const COL_ID = 6;
const COL_USER_ID = 10;
const COL_STOCK_ID = 10;
const COL_TIME = 22;

function Header({ fillWidth }: { fillWidth: number }) {
  return (
    <Box flexDirection="row" paddingBottom={0}>
      <Box width={COL_ID}>
        <Text bold color="white">ID</Text>
      </Box>
      <Box width={COL_USER_ID}>
        <Text bold color="white">用户ID</Text>
      </Box>
      <Box width={COL_STOCK_ID}>
        <Text bold color="white">仓库ID</Text>
      </Box>
      <Box width={fillWidth}>
        <Text bold color="white">仓库名称</Text>
      </Box>
      <Box width={COL_TIME}>
        <Text bold color="white">创建时间</Text>
      </Box>
    </Box>
  );
}

function Row({ stock, fillWidth }: { stock: UserStock; fillWidth: number }) {
  const created = new Date(stock.gmtCreate).toLocaleString("zh-CN");
  return (
    <Box flexDirection="row">
      <Box width={COL_ID}>
        <Text color="gray">{stock.id}</Text>
      </Box>
      <Box width={COL_USER_ID}>
        <Text color="gray">{stock.userId}</Text>
      </Box>
      <Box width={COL_STOCK_ID}>
        <Text color="gray">{stock.stockId}</Text>
      </Box>
      <Box width={fillWidth}>
        <Text bold>{stock.stockName}</Text>
      </Box>
      <Box width={COL_TIME}>
        <Text color="gray">{created}</Text>
      </Box>
    </Box>
  );
}

export function StocksTable({ stocks }: StocksTableProps) {
  const fixedCols = COL_ID + COL_USER_ID + COL_STOCK_ID + COL_TIME;
  const { fillWidth, totalWidth } = useTableLayout(fixedCols);

  return (
    <BaseTable title="仓库列表" count={stocks.length} countLabel="个" fillWidth={fillWidth} totalWidth={totalWidth} header={<Header fillWidth={fillWidth} />}>
      {stocks.map((stock) => (
        <Row key={stock.id} stock={stock} fillWidth={fillWidth} />
      ))}
    </BaseTable>
  );
}
