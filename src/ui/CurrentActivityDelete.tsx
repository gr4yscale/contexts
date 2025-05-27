import React from "react";
import { Box, Text } from "ink";
import { useCurrentNode } from "./common/useCurrentNode.mts";
import { executeAction } from "../actions.mts";
import Confirmation from "./common/Confirmation";

const CurrentNodeDelete: React.FC = () => {
  const { currentNode, loading } = useCurrentNode();

  const confirmDelete = () => {
    console.log("Deleting activity - not implemented yet");
    // Implementation would go here
    executeAction("actionExecute");
  };

  const cancelDelete = () => {
    executeAction("actionExecute");
  };

  return (
    <Box flexDirection="column">
      <Text>Current Node: {currentNode?.name || "None"}</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Confirmation
          message={`Are you sure you want to delete: ${currentNode?.name}?`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </Box>
  );
};

export default CurrentNodeDelete;
