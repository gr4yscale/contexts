import React from "react";
import { Box, Text } from "ink";
import { useCurrentNode } from "./common/useCurrentNode.mts";
import TextInput from "./TextInput.tsx";
import { updateNode } from "../models/node.mts";
import { executeAction } from "../actions.mts";

const CurrentNodeRename: React.FC = () => {
  const { currentNode, loading } = useCurrentNode();

  return (
    <Box flexDirection="column">
      <Text>Current Node: {currentNode?.name || "None"}</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Box flexDirection="column">
          <Text>Rename node: {currentNode?.name}</Text>
          <TextInput
            callback={(name: string) => {
              if (name === "") return; // TODO validation
              if (currentNode) {
                updateNode({
                  nodeId: currentNode.nodeId,
                  name: name,
                });
              }
              executeAction("nodeNavigate");
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default CurrentNodeRename;
