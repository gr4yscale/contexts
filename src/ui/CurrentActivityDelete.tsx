import React, { useEffect, useContext } from "react";
import { Box, Text } from "ink";
import { useCurrentActivity } from "./common/useCurrentActivity.mts";
import { KeysContext } from "./common/Context.mts";
import { key, KeymapConfig } from "./common/Keymapping.mts";
import { executeAction } from "../actions.mts";

const CurrentActivityDelete: React.FC = () => {
  const { currentActivity, loading } = useCurrentActivity();
  const { keymap }: any = useContext(KeysContext);

  const confirmDelete = () => {
    console.log("Deleting activity - not implemented yet");
    // Implementation would go here
    executeAction("actionExecute");
  };

  const cancelDelete = () => {
    executeAction("actionExecute");
  };

  useEffect(() => {
    const keymapConfig: KeymapConfig = [
      {
        sequence: [key("y")],
        description: "Confirm delete",
        name: "confirm-delete",
        handler: confirmDelete,
      },
      {
        sequence: [key("n")],
        description: "Cancel",
        name: "cancel-delete",
        handler: cancelDelete,
      },
    ];

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, []);

  return (
    <Box flexDirection="column">
      <Text>Current Activity: {currentActivity?.name || "None"}</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Box flexDirection="column">
          <Text>Are you sure you want to delete: {currentActivity?.name}?</Text>
          <Text>Press (y) to confirm or (n) to cancel</Text>
        </Box>
      )}
    </Box>
  );
};

export default CurrentActivityDelete;
