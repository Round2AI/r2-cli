import React from "react";
import { Box, Text } from "ink";
import type { UserInfo } from "../types/auth.js";

interface UserInfoCardProps {
  userInfo: UserInfo;
  lastLogin?: Date;
  daysSinceLogin?: number;
}

export function UserInfoCard({ userInfo, lastLogin, daysSinceLogin }: UserInfoCardProps) {
  const maskedMobile = userInfo.mobile.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
  const divider = "━".repeat(30);

  return (
    <Box flexDirection="column">
      <Text color="white">{divider}</Text>
      <Text color="cyan">用户信息:</Text>
      <Box flexDirection="row">
        <Box width={12}>
          <Text color="white">  昵称:</Text>
        </Box>
        <Text color="yellow">{userInfo.nickname}</Text>
      </Box>
      <Box flexDirection="row">
        <Box width={12}>
          <Text color="white">  手机号:</Text>
        </Box>
        <Text color="yellow">{maskedMobile}</Text>
      </Box>
      <Text color="white">{divider}</Text>
      {lastLogin && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="gray">最后登录: {lastLogin.toLocaleString()}</Text>
          {daysSinceLogin !== undefined && (
            <Text color="gray">  距离今天: {daysSinceLogin} 天前</Text>
          )}
        </Box>
      )}
    </Box>
  );
}
