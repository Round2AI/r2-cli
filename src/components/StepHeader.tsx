import React from "react";
import { Box, Text } from "ink";

interface StepHeaderProps {
  step: number;
  total: number;
  title: string;
}

export function StepHeader({ step, total, title }: StepHeaderProps) {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Text color="cyan">
        {"━".repeat(3)} 步骤 {step}/{total}: {title} {"━".repeat(3)}
      </Text>
    </Box>
  );
}
