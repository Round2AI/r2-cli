import React from "react";
import { Box, Text } from "ink";

interface SubmitResultProps {
  success: boolean;
  message: string;
}

export function SubmitResult({ success, message }: SubmitResultProps) {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Text>
        <Text color={success ? "green" : "red"} bold>
          {success ? "●" : "▲"}
        </Text>
        <Text color={success ? "green" : "red"}>{` ${message}`}</Text>
      </Text>
    </Box>
  );
}
