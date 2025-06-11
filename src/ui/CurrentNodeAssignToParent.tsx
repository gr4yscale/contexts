import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { useCurrentNode } from "./common/useCurrentNode.mts";
import NodeSelection from "./NodeSelection.tsx";
import { executeAction } from "../actions.mts";
import { setNodeParents, getParentNodeIds } from "../models/node.mts";
import * as logger from "../logger.mts";

const CurrentNodeAssignToParent: React.FC = () => {
  const { currentNode, loading: currentNodeLoading } = useCurrentNode();
  const [initialParentIds, setInitialParentIds] = useState<string[]>([]);
  const [loadingParents, setLoadingParents] = useState(true);

  useEffect(() => {
    const loadExistingParents = async () => {
      if (!currentNode) {
        setLoadingParents(false);
        return;
      }

      try {
        const parentIds = await getParentNodeIds(currentNode.nodeId);
        setInitialParentIds(parentIds);
      } catch (error) {
        logger.error("Error loading existing parent relationships:", error);
      } finally {
        setLoadingParents(false);
      }
    };

    loadExistingParents();
  }, [currentNode?.nodeId]);

  const handleParentSelection = async (nodeIds: string[]) => {
    if (!currentNode) {
      logger.error("No current node to assign parents to.");
      return;
    }

    // Filter out the current node to prevent self-assignment
    const validParentIds = nodeIds.filter(nodeId => nodeId !== currentNode.nodeId);
    
    if (validParentIds.length !== nodeIds.length) {
      logger.warn("Removed current node from parent selection to prevent self-assignment.");
    }

    try {
      await setNodeParents(currentNode.nodeId, validParentIds);
      executeAction("nodeNavigate");
    } catch (error) {
      logger.error("Error setting parent nodes:", error);
    }
  };

  return (
    <Box flexDirection="column">
      <Text>Current Node: {currentNode?.name || "None"}</Text>

      {currentNodeLoading || loadingParents ? (
        <Text>Loading...</Text>
      ) : (
        <Box flexDirection="column">
          <Text>Assign parents for: {currentNode?.name}</Text>
          <NodeSelection
            onSelected={handleParentSelection}
            multiple={true}
            initialSelection={initialParentIds}
          />
        </Box>
      )}
    </Box>
  );
};

export default CurrentNodeAssignToParent;
