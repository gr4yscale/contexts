import React from "react";
import { Box, Text } from "ink";
import { useCurrentActivity } from "./common/useCurrentActivity.mts";
import TextInput from "./TextInput.tsx";
import { executeAction } from "../actions.mts";

const CurrentActivityRename: React.FC = () => {
  const { currentActivity, loading } = useCurrentActivity();

  return (
    <Box flexDirection="column">
      <Text>Current Activity: {currentActivity?.name || "None"}</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Box flexDirection="column">
          <Text>Rename activity: {currentActivity?.name}</Text>
          <TextInput
            callback={(name: string) => {
              if (name === "") return; // TODO validation
              console.log(`Renaming to: ${name}`);
              // Implementation would go here
              executeAction("actionExecute");
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default CurrentActivityRename;
