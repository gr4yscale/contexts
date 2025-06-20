import React, { useState, useEffect } from "react";
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
  const [initialSelection, setInitialSelection] = useState<string[]>([]);

  useEffect(() => {
    const loadCurrentContext = async () => {
      try {
        const currentContext = await getCurrentContext();
        if (currentContext && currentContext.nodeIds) {
          setInitialSelection(currentContext.nodeIds);
        }
      } catch (error) {
        console.error("Error loading current context:", error);
      }
    };

    loadCurrentContext();
  }, []);

  return (
    <Box>
      <NodeSelection
        multiple={true}
        skipConfirmation={true}
        initialSelection={initialSelection}
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
