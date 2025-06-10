import React from "react";
import { Box, Text } from "ink";
import { useCurrentNode } from "./common/useCurrentNode.mts";
import NodeSelection from "./NodeSelection.tsx";
import { executeAction } from "../actions.mts";
import { addNodeRelationship } from "../models/node.mts";
import * as logger from "../logger.mts";

const CurrentNodeAssignToParent: React.FC = () => {
  const { currentNode, loading: currentNodeLoading } = useCurrentNode();

  const handleParentSelection = async (nodeIds: string[]) => {
    if (!currentNode) {
      logger.error("No current node to assign parent to.");
      return;
    }
    if (nodeIds.length !== 1) {
      logger.error("Please select exactly one parent node.");
      return;
    }
    const parentNodeId = nodeIds[0];

    // Prevent assigning a node to itself as parent
    if (parentNodeId === currentNode.nodeId) {
      logger.error("Cannot assign a node to itself as parent.");
      return;
    }
    try {
      await addNodeRelationship(parentNodeId, currentNode.nodeId);
      executeAction("nodeNavigate");
    } catch (error) {
      logger.error("Error assigning parent node:", error);
    }
  };

  return (
    <Box flexDirection="column">
      <Text>Current Node: {currentNode?.name || "None"}</Text>

      {currentNodeLoading ? (
        <Text>Loading...</Text>
      ) : (
        <Box flexDirection="column">
          <Text>Assign parent for: {currentNode?.name}</Text>
          <NodeSelection
            onSelected={handleParentSelection}
            multiple={false}
          />
        </Box>
      )}
    </Box>
  );
};

export default CurrentNodeAssignToParent;
