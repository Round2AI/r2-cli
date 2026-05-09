import { Box, Text } from "ink";
import type { XyShop, UserShop } from "../types/goods.js";

interface ShopDisplay {
  id: string;
  name: string;
  platform: string;
  expiresIn: number | undefined;
}

interface ShopsTableProps {
  shops: XyShop[] | UserShop[];
  platform: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  xianyu: "闲鱼",
  douyin: "抖音",
};

const COL_PLATFORM = 8;
const COL_ID = 16;
const COL_STATUS = 10;

function normalizeShops(shops: XyShop[] | UserShop[]): ShopDisplay[] {
  return shops.map((s) => {
    if ("shopName" in s) {
      return {
        id: (s as UserShop).shopId,
        name: (s as UserShop).shopName,
        platform: (s as UserShop).platform,
        expiresIn: s.expiresIn,
      };
    }
    return {
      id: s.id,
      name: s.name,
      platform: (s as XyShop).thirdUserId,
      expiresIn: s.expiresIn,
    };
  });
}

function Header({ hasPlatform, fillWidth }: { hasPlatform: boolean; fillWidth: number }) {
  return (
    <Box flexDirection="row" paddingBottom={0}>
      {hasPlatform && (
        <Box width={COL_PLATFORM}>
          <Text bold color="white">平台</Text>
        </Box>
      )}
      <Box width={fillWidth}>
        <Text bold color="white">店铺名</Text>
      </Box>
      <Box width={COL_ID}>
        <Text bold color="white">ID</Text>
      </Box>
      <Box width={COL_STATUS}>
        <Text bold color="white">状态</Text>
      </Box>
    </Box>
  );
}

function Row({ shop, hasPlatform, fillWidth }: { shop: ShopDisplay; hasPlatform: boolean; fillWidth: number }) {
  const platformLabel = PLATFORM_LABELS[shop.platform] ?? shop.platform;

  return (
    <Box flexDirection="row">
      {hasPlatform && (
        <Box width={COL_PLATFORM}>
          <Text color="cyan">{platformLabel}</Text>
        </Box>
      )}
      <Box width={fillWidth}>
        <Text bold>{shop.name}</Text>
      </Box>
      <Box width={COL_ID}>
        <Text color="gray">{shop.id}</Text>
      </Box>
      <Box width={COL_STATUS}>
        <Text color="green">● 授权中</Text>
      </Box>
    </Box>
  );
}

export function ShopsTable({ shops, platform }: ShopsTableProps) {
  const items = normalizeShops(shops);
  const hasPlatform = platform === "all";
  const title = platform === "all" ? "所有授权店铺" : `${PLATFORM_LABELS[platform] ?? platform}授权店铺`;

  const termWidth = process.stdout.columns || 80;
  const borderPadding = 4;
  const fixedCols = COL_ID + COL_STATUS + (hasPlatform ? COL_PLATFORM : 0);
  const fillWidth = Math.max(termWidth - borderPadding - fixedCols, 20);
  const totalWidth = fixedCols + fillWidth;

  return (
    <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
      <Box flexDirection="row">
        <Text bold color="cyan">{title}</Text>
        <Text color="gray">{" · "}{items.length} 家</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Header hasPlatform={hasPlatform} fillWidth={fillWidth} />
        <Text color="gray">{"─".repeat(totalWidth)}</Text>
        {items.map((shop) => (
          <Row key={shop.id} shop={shop} hasPlatform={hasPlatform} fillWidth={fillWidth} />
        ))}
      </Box>
    </Box>
  );
}
