import React from "react";
import { Box, Text } from "ink";

interface SelectionResultProps {
  label: string;
  value: string;
  details?: string;
}

export function SelectionResult({ label, value, details }: SelectionResultProps) {
  return (
    <Box flexDirection="column">
      <Text>
        <Text color="green">{"  ✓ "}</Text>
        <Text color="white">{label}: </Text>
        <Text color="yellow">{value}</Text>
      </Text>
      {details && (
        <Text color="gray">{"    "}{details}</Text>
      )}
    </Box>
  );
}
