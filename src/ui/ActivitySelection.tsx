import React, { useContext, useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Activity } from "../types.mts";
import { handleCommand } from "../handleCommand.mts";
import SelectionList from "./common/SelectionList.tsx";
import { key, KeymapConfig } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";

import activityDTO from "../models/activity.mts";

const { getActiveActivities } = await activityDTO();

type ActivityItem = { id: string; display: string; data: Activity };
type ActivityStates = "initial" | "find";

const ActivitySelection: React.FC = () => {
  const [mode, setMode] = useState<ActivityStates>("initial");
  const [items, setItems] = useState<Array<ActivityItem>>([]);

  const fetchActiveActivities = async () => {
    try {
      const activeActivities = await getActiveActivities();
      const sorted = activeActivities.sort(
        (l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime(),
      );
      const newItems = sorted.map((activity) => ({
        id: activity.activityId,
        display: activity.name,
        data: activity,
      }));
      setItems(newItems);
    } catch (error) {
      console.error("Error fetching active activities:", error);
    }
  };

  useEffect(() => {
    fetchActiveActivities();
  }, []);

  const { keymap }: any = useContext(KeysContext);

  useEffect(() => {
    let keymapConfig: KeymapConfig = [];

    switch (mode) {
      case "initial":
        keymapConfig = [
          {
            sequence: [key("g")],
            description: "show activity list",
            name: "activity-list-show",
            handler: () => {
              setMode("find");
              keymap.popKeymap();
            },
          },
          {
            sequence: [key("x")],
            description: "Filter activity goto list",
            name: "filter-activity-list",
            handler: () => {
              console.log("filter workspace");
            },
          },
        ];
        break;

      case "find":
        keymapConfig = [
          {
            sequence: [key("z")],
            description: "Initial mode",
            name: "set-mode-initial",
            handler: () => {
              setMode("initial");
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
    <Box>
      <Text>mode: {mode}</Text>
      {mode === "find" && (
        <SelectionList
          initialItems={items}
          onSelected={async (items) => {
            const activities = items.map((item) => item.data);

            const firstActivity = activities[0];
            if (firstActivity) {
              await handleCommand("activateActivity", firstActivity.activityId);
              // TOFIX: move activateActivity out of navigation.mts
              fetchActiveActivities();
            }
          }}
        />
      )}
    </Box>
  );
};

export default ActivitySelection;
