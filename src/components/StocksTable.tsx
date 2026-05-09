import { Box, Text } from "ink";
import type { UserStock } from "../types/goods.js";

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
  const termWidth = process.stdout.columns || 80;
  const borderPadding = 4;
  const fixedCols = COL_ID + COL_USER_ID + COL_STOCK_ID + COL_TIME;
  const fillWidth = Math.max(termWidth - borderPadding - fixedCols, 20);
  const totalWidth = fixedCols + fillWidth;

  return (
    <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
      <Box flexDirection="row">
        <Text bold color="cyan">仓库列表</Text>
        <Text color="gray">{" · "}{stocks.length} 个</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Header fillWidth={fillWidth} />
        <Text color="gray">{"─".repeat(totalWidth)}</Text>
        {stocks.map((stock) => (
          <Row key={stock.id} stock={stock} fillWidth={fillWidth} />
        ))}
      </Box>
    </Box>
  );
}
