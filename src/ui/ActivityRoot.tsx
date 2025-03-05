import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";

import { key, KeymapConfig } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";

import CurrentActivityActions from "./CurrentActivityActions.tsx";
import ActivityNavigate from "./ActivityNavigate.tsx";
import ActivitySelection from "./ActivitySelection.tsx";
import TextInput from "./TextInput.tsx";
import { createActivity } from "../models/activity.mts";

type ActivityRootStates =
  | "initial"
  | "selection"
  | "navigation"
  | "currentActivity"
  | "createActivity";

const ActivityRoot: React.FC = () => {
  const [mode, setMode] = useState<ActivityRootStates>("initial");

  const { keymap }: any = useContext(KeysContext);

  useEffect(() => {
    let keymapConfig: KeymapConfig = [];

    switch (mode) {
      case "initial":
        keymapConfig = [
          {
            sequence: [key("a")],
            description: "current activity actions",
            name: "current-activity-actions",
            handler: () => {
              setMode("currentActivity");
              keymap.popKeymap();
            },
          },
          {
            sequence: [key("s")],
            description: "activity selection",
            name: "activity-select",
            handler: () => {
              setMode("selection");
              keymap.popKeymap();
            },
          },
          {
            sequence: [key("g")],
            description: "navigate",
            name: "activity-navigate",
            handler: () => {
              setMode("navigation");
              keymap.popKeymap();
            },
          },
          {
            sequence: [key("n")],
            description: "new activity",
            name: "activity-new",
            handler: () => {
              setMode("createActivity");
              keymap.popKeymap();
            },
          },
        ];
        break;
    }

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [mode]);

  return (
    <Box flexDirection="column">
      {mode === "currentActivity" && <CurrentActivityActions />}
      {mode === "navigation" && <ActivityNavigate />}
      {mode === "selection" && <ActivitySelection />}
      {mode === "createActivity" && (
        <TextInput
          callback={(name: string) => {
            if (name === "") return; // TODO validation
            createActivity({ name });
            setMode("initial");
          }}
        />
      )}
    </Box>
  );
};

export default ActivityRoot;
