import { Box, Text } from "ink";

interface StepHeaderProps {
  step: number;
  total: number;
  title: string;
}

export function StepHeader({ step, total, title }: StepHeaderProps) {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Text>
        <Text color="cyan" bold>{"●"}</Text>
        <Text color="white" bold>{` 步骤 ${step}/${total} `}</Text>
        <Text color="gray">─</Text>
        <Text color="white">{` ${title}`}</Text>
      </Text>
    </Box>
  );
}
