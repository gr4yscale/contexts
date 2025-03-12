import React from "react";
import { Box, Text } from "ink";
import { useCurrentActivity } from "./common/useCurrentActivity.mts";
import TextInput from "./TextInput.tsx";
import { executeAction } from "../actions.mts";

const CurrentActivityCreateChild: React.FC = () => {
  const { currentActivity, loading } = useCurrentActivity();

  return (
    <Box flexDirection="column">
      <Text>Current Activity: {currentActivity?.name || "None"}</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Box flexDirection="column">
          <Text>Create child activity for: {currentActivity?.name}</Text>
          <TextInput
            callback={(name: string) => {
              if (name === "") return; // TODO validation
              console.log(`Creating child activity: ${name}`);
              // TODO: call actual implementation
              executeAction("actionExecute");
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default CurrentActivityCreateChild;
