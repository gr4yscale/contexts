import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";

import { key, KeymapConfig } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";

import CurrentActivityActions from "./CurrentActivityActions.tsx";
import ActivityNavigate from "./ActivityNavigate.tsx";
import ActivitySelection from "./ActivitySelection.tsx";

type ActivityRootStates =
  | "initial"
  | "selection"
  | "navigation"
  | "currentActivity";

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
      <Text>mode: {mode}</Text>
      {mode === "currentActivity" && <CurrentActivityActions />}
      {mode === "navigation" && <ActivityNavigate />}
      {mode === "selection" && <ActivitySelection />}
    </Box>
  );
};

export default ActivityRoot;
