import React, { useContext, useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Activity } from "../types.mts";
import { handleCommand } from "../handleCommand.mts";
import SelectionList from "./common/SelectionList.tsx";
import { key, KeymapConfig } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";

import { activityTree, ActivityTreeItem } from "../models/activity.mts";

type ActivityItem = {
  id: string;
  display: string;
  data: Activity;
} & ActivityTreeItem; // TOFIX type union

type ActivityStates = "initial" | "find";

const ActivitySelection: React.FC = () => {
  const [mode, setMode] = useState<ActivityStates>("initial");
  const [items, setItems] = useState<Array<ActivityItem>>([]);

  const fetchActivities = async () => {
    try {
      const tree = await activityTree();

      const limited = tree.slice(0, 20);

      const newItems = limited.map((activity) => ({
        id: activity.activityId,
        activity,
        display:
          "  ".repeat(activity.depth || 0) +
          (activity.depth || 0 > 0 ? "└─ " : "") +
          activity.name,
      }));

      // TODO map this properly

      setItems(newItems);
      setMode("find");
      keymap.popKeymap();
    } catch (error) {
      console.error("Error fetching active activities:", error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const { keymap }: any = useContext(KeysContext);

  useEffect(() => {
    let keymapConfig: KeymapConfig = [];

    switch (mode) {
      case "initial":
        keymapConfig = [
          // {
          //   sequence: [key("g")],
          //   description: "show activity list",
          //   name: "activity-list-show",
          //   handler: () => {
          //     setMode("find");
          //     keymap.popKeymap();
          //   },
          // },
          // {
          //   sequence: [key("x")],
          //   description: "Filter activity goto list",
          //   name: "filter-activity-list",
          //   handler: () => {
          //     console.log("filter workspace");
          //   },
          // },
        ];
        break;

      case "find":
        keymapConfig = [
          // {
          //   sequence: [key("z")],
          //   description: "Initial mode",
          //   name: "set-mode-initial",
          //   handler: () => {
          //     setMode("initial");
          //   },
          // },
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
            const activities = items.map((item) => item.activity);
            const firstActivity = activities[0];
            if (firstActivity) {
              await handleCommand("activateActivity", firstActivity.activityId);
              // TOFIX: move activateActivity out of navigation.mts
              //fetchActivities();
            }
          }}
        />
      )}
    </Box>
  );
};

export default ActivitySelection;
