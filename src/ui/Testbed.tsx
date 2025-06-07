import { $ } from "zx";
import React from "react";
import { Box } from "ink";
import NodeSelection from "./NodeSelection.tsx";

const Testbed: React.FC = () => {
  return (
    <Box flexDirection="column" width="100%">
      <NodeSelection
        multiple={true}
        onSelected={(nodeIds) => {
          $`notify-send "Selected node IDs: ${nodeIds.join(', ')}"`;
        }}
      />
    </Box>
  );
};

export default Testbed;
