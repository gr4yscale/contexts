import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";

import { Activity } from "../types.mts";
import {
  activityTree,
  ActivityTreeItem,
  getAllActivities,
  getCurrentActivity,
  updateActivity,
} from "../models/activity.mts";

import ActionList from "./common/ActionList.tsx";

import { key, KeymapConfig } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";
import { Item } from "./common/useActionList.mts";
import { getContextActivities } from "../models/context.mts";

type ActivityItem = { id: string; display: string; data: Activity };
type ActivityNavigateStates = "initial" | "find";

const ActivityNavigate: React.FC = () => {
  const [mode, setMode] = useState<ActivityNavigateStates>("find");
  const [items, setItems] = useState<Array<ActivityItem>>([]);
  const [loading, setLoading] = useState(true);

  const itemActionKeymap = (item: Item): KeymapConfig => [
    {
      sequence: [key("\r", "return")],
      description: "Item action: default",
      name: "item-action-default",
      handler: () => {
        //console.log(`default action for ${item.display}`);
      },
    },
    {
      sequence: [key(" ")],
      description: "Item action: handy keybind",
      name: "item-act-handy",
      handler: () => {
        //console.log(`handy action for ${item.display}`);
      },
    },
  ];

  const fetchActivities = async () => {
    try {
      //const activities = await getAllActivities();
      const activities = await getContextActivities();
      const newItems = activities.map((activity) => ({
        id: activity.activityId,
        display: activity.name,
        data: activity,
      }));
      setItems(newItems);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const { keymap }: any = useContext(KeysContext);

  useEffect(() => {
    let keymapConfig: KeymapConfig = [];

    switch (mode) {
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
    <Box flexDirection="column">
      <Text>mode: {mode}</Text>

      {mode === "find" && (
        <ActionList initialItems={items} actionKeymap={itemActionKeymap} />
      )}
    </Box>
  );
};

export default ActivityNavigate;
