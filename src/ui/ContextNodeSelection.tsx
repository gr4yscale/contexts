import React from "react";
import { Box, Text } from "ink";
import { Node } from "../types.mts";
import NodeSelection from "./NodeSelection.tsx";

import {
  createContext,
  getCurrentContext,
  updateContext,
} from "../models/context.mts";
import { executeAction } from "../actions.mts";

const ContextNodeSelection: React.FC = () => {
  return (
    <Box>
      <NodeSelection
        multiple={true}
        onSelected={async (nodeIds: string[]) => {
          try {
            const currentContext = await getCurrentContext();

            if (currentContext) {
              await updateContext({
                contextId: currentContext.contextId,
                nodeIds: nodeIds,
              });
            } else {
              await createContext({
                name: `Context ${new Date().toLocaleString()}`,
                nodeIds: nodeIds,
              });
            }
            await executeAction("nodeNavigate");
          } catch (error) {
            console.error("Error updating context:", error);
          }
        }}
      />
    </Box>
  );
};

export default ContextNodeSelection;
