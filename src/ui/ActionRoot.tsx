import React from "react";
import { Box, Text } from "ink";
import ActionExecute from "./ActionExecute.tsx";

const ActionRoot: React.FC = () => {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Actions Root</Text>
      <Box marginY={1}>
        <ActionExecute />
      </Box>
    </Box>
  );
};

export default ActionRoot;
