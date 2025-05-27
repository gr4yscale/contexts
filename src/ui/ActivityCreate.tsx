import React from "react";
import { Box } from "ink";
import TextInput from "./TextInput.tsx";

import { createNode } from "../models/activity.mts";

const NodeCreate: React.FC = () => {
  return (
    <Box flexDirection="column">
      <TextInput
        callback={(name: string) => {
          if (name === "") return; // TODO validation
          createNode({ name });
        }}
      />
    </Box>
  );
};

export default NodeCreate;
