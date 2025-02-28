import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";
import { Activity } from "../types.mts";
import { getCurrentActivity } from "../models/activity.mts";
import { KeysContext } from "./common/Context.mts";
import { key, KeymapConfig } from "./common/Keymapping.mts";
import TextInput from "./TextInput.tsx";

type ActivityStates = "initial" | "createChild" | "assignParent" | "rename";

const CurrentActivityActions: React.FC = () => {
  const [mode, setMode] = useState<ActivityStates>("initial");
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  const { keymap }: any = useContext(KeysContext);

  const fetchCurrentActivity = async () => {
    try {
      const activity = await getCurrentActivity();
      setCurrentActivity(activity);
    } catch (error) {
      console.error("Error fetching current activity:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentActivity();
  }, []);

  // Stub functions for activity actions
  const createChildActivityForCurrentActivity = () => {
    setMode("createChild");
    keymap.popKeymap();
  };

  const assignCurrentActivityToParent = () => {
    setMode("assignParent");
    keymap.popKeymap();
  };

  const renameCurrentActivity = () => {
    setMode("rename");
    keymap.popKeymap();
  };

  const deleteCurrentActivity = () => {
    console.log("Delete current activity - not implemented yet");
    // Implementation would go here
  };

  useEffect(() => {
    let keymapConfig: KeymapConfig = [];

    switch (mode) {
      case "initial":
        keymapConfig = [
          {
            sequence: [key("c")],
            description: "Create child activity",
            name: "create-child-activity",
            handler: createChildActivityForCurrentActivity,
          },
          {
            sequence: [key("p")],
            description: "Assign to parent",
            name: "assign-to-parent",
            handler: assignCurrentActivityToParent,
          },
          {
            sequence: [key("r")],
            description: "Rename current activity",
            name: "rename-current-activity",
            handler: renameCurrentActivity,
          },
          {
            sequence: [key("d")],
            description: "Delete current activity",
            name: "delete-current-activity",
            handler: deleteCurrentActivity,
          },
        ];
        break;

      case "createChild":
        // No keymaps needed for text input mode
        break;

      case "assignParent":
        // No keymaps needed for text input mode
        break;

      case "rename":
        // No keymaps needed for text input mode
        break;
    }

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [mode]);

  return (
    <Box flexDirection="column">
      <Text>Current Activity: {currentActivity?.name || "None"}</Text>
      <Text>Mode: {mode}</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <>
          {mode === "createChild" && (
            <Box flexDirection="column">
              <Text>Create child activity for: {currentActivity?.name}</Text>
              <TextInput
                callback={(name: string) => {
                  if (name === "") return; // TODO validation
                  console.log(`Creating child activity: ${name}`);
                  // TODO: call `createChildActivityForCurrentActivity`
                  setMode("initial");
                }}
              />
            </Box>
          )}

          {mode === "assignParent" && (
            <Box flexDirection="column">
              <Text>Assign parent for: {currentActivity?.name}</Text>
              {
                // TODO: put SelectionList here
                // TODO: in the onSelected callback of ActionList, call `assignCurrentActivityToParent`
                // setMode("initial");
              }
            </Box>
          )}

          {mode === "rename" && (
            <Box flexDirection="column">
              <Text>Rename activity: {currentActivity?.name}</Text>
              <TextInput
                callback={(name: string) => {
                  if (name === "") return; // TODO validation
                  console.log(`Renaming to: ${name}`);
                  // Implementation would go here
                  setMode("initial");
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default CurrentActivityActions;
