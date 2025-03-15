import React from "react";
import { Box, Text } from "ink";
import { useCurrentActivity } from "./common/useCurrentActivity.mts";
import { executeAction } from "../actions.mts";
import Confirmation from "./common/Confirmation";

const CurrentActivityDelete: React.FC = () => {
  const { currentActivity, loading } = useCurrentActivity();

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
      <Text>Current Activity: {currentActivity?.name || "None"}</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Confirmation
          message={`Are you sure you want to delete: ${currentActivity?.name}?`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </Box>
  );
};

export default CurrentActivityDelete;
