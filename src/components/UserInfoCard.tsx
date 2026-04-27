import React from "react";
import { Box, Text } from "ink";
import type { UserInfo } from "../types/auth.js";

interface UserInfoCardProps {
  userInfo: UserInfo;
  lastLogin?: Date;
  daysSinceLogin?: number;
}

export function UserInfoCard({ userInfo, lastLogin, daysSinceLogin }: UserInfoCardProps) {
  const maskedMobile = userInfo.mobile
    ? userInfo.mobile.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")
    : "-";

  return (
    <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
      <Text bold color="cyan">用户信息</Text>
      <Box flexDirection="row" marginTop={1}>
        <Box width={10}>
          <Text color="gray">昵称</Text>
        </Box>
        <Text color="yellow">{userInfo.nickname}</Text>
      </Box>
      <Box flexDirection="row">
        <Box width={10}>
          <Text color="gray">手机号</Text>
        </Box>
        <Text color="yellow">{maskedMobile}</Text>
      </Box>
      {lastLogin && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="gray">最后登录: {lastLogin.toLocaleString()}</Text>
          {daysSinceLogin !== undefined && (
            <Text color="gray">  距今: {daysSinceLogin} 天</Text>
          )}
        </Box>
      )}
    </Box>
  );
}
