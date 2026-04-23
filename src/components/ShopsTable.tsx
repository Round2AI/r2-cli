import React from "react";
import { Box, Text } from "ink";
import type { XyShop } from "../types/xianyu.js";

interface ShopsTableProps {
  shops: XyShop[];
  platform: string;
}

function Header() {
  return (
    <Box flexDirection="row" paddingBottom={0}>
      <Box width={20}>
        <Text color="gray"> 店铺名</Text>
      </Box>
      <Box width={16}>
        <Text color="gray">ID</Text>
      </Box>
      <Box width={10}>
        <Text color="gray">状态</Text>
      </Box>
      <Box width={16}>
        <Text color="gray">到期时间</Text>
      </Box>
    </Box>
  );
}

function Row({ shop }: { shop: XyShop }) {
  const expired = Date.now() > shop.expiresIn;
  const expireDate = new Date(shop.expiresIn).toLocaleDateString();

  return (
    <Box flexDirection="row">
      <Box width={20}>
        <Text bold>{shop.name}</Text>
      </Box>
      <Box width={16}>
        <Text color="gray">{shop.thirdUserId}</Text>
      </Box>
      <Box width={10}>
        <Text color={expired ? "red" : "green"}>{expired ? "已过期" : "授权中"}</Text>
      </Box>
      <Box width={16}>
        <Text color="gray">{expireDate}</Text>
      </Box>
    </Box>
  );
}

export function ShopsTable({ shops, platform }: ShopsTableProps) {
  const platformName = platform === "douyin" ? "抖音" : "闲鱼";

  return (
    <Box flexDirection="column" paddingY={1}>
      <Text color="cyan">
        {platformName}授权店铺 (共 {shops.length} 家):
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <Header />
        <Text color="gray"> {"─".repeat(62)}</Text>
        {shops.map((shop) => (
          <Row key={shop.id || shop.thirdUserId} shop={shop} />
        ))}
      </Box>
    </Box>
  );
}
