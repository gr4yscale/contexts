import React from "react";
import { Box, Text } from "ink";
import { useCurrentNode } from "./common/useCurrentNode.mts";
import TextInput from "./TextInput.tsx";
import { executeAction } from "../actions.mts";

const CurrentNodeCreateChild: React.FC = () => {
  const { currentNode, loading } = useCurrentNode();

  return (
    <Box flexDirection="column">
      <Text>Current Node: {currentNode?.name || "None"}</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Box flexDirection="column">
          <Text>Create child activity for: {currentNode?.name}</Text>
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

export default CurrentNodeCreateChild;
