import React from "react";
import { Box, Text } from "ink";
import { useCurrentActivity } from "./common/useCurrentActivity.mts";
import ActivitySelection from "./ActivitySelection.tsx";
import { executeAction } from "../actions.mts";

const CurrentActivityAssignToParent: React.FC = () => {
  const { currentActivity, loading } = useCurrentActivity();

  return (
    <Box flexDirection="column">
      <Text>Current Activity: {currentActivity?.name || "None"}</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Box flexDirection="column">
            <Text>Assign parent for: {currentActivity?.name}</Text>
            <ActivitySelection
              onSelected={async (items) => {
                console.log(items);
                executeAction("actionExecute");
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default CurrentActivityAssignToParent;
