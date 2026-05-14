/**
 * 通用表格组件 — 统一的 border/header/separator/layout
 *
 * 用法：
 * 1. 定义列宽度常量
 * 2. 用 useTableLayout(fixedCols) 获取 fillWidth
 * 3. 定义 Header / Row 组件（接收 fillWidth）
 * 4. 用 BaseTable 包裹
 */

import { Box, Text } from "ink";
import type { ReactNode } from "react";

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
}

export function useTableLayout(fixedCols: number) {
  const termWidth = process.stdout.columns || 80;
  const borderPadding = 4;
  const fillWidth = Math.max(termWidth - borderPadding - fixedCols, 20);
  const totalWidth = fixedCols + fillWidth;
  return { fillWidth, totalWidth };
}

interface BaseTableProps {
  title: string;
  count: number;
  countLabel?: string;
  fillWidth: number;
  totalWidth: number;
  header: ReactNode;
  children: ReactNode;
}

export function BaseTable({ title, count, countLabel = "条", fillWidth, totalWidth, header, children }: BaseTableProps) {
  return (
    <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
      <Box flexDirection="row">
        <Text bold color="cyan">{title}</Text>
        <Text color="gray">{" · "}{count}{" "}{countLabel}</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {header}
        <Text color="gray">{"─".repeat(totalWidth)}</Text>
        {children}
      </Box>
    </Box>
  );
}
