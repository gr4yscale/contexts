import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";

import { Activity } from "../types.mts";

import ActionList from "./common/ActionList.tsx";

import { key, KeymapConfig } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";
import { Item } from "./common/useActionList.mts";
import { getCurrentContextActivities } from "../models/context.mts";

import { executeAction } from "../actions.mts";

type ActivityItem = { id: string; display: string; data: Activity };
type ActivityNavigateStates = "initial" | "find";

const ActivityNavigate: React.FC = () => {
  const [mode, setMode] = useState<ActivityNavigateStates>("find");
  const [items, setItems] = useState<Array<ActivityItem>>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const activities = await getCurrentContextActivities();
      const sortedActivities = [...activities].sort((a, b) => {
        if (!a.lastAccessed) return 1;
        if (!b.lastAccessed) return -1;
        return (
          new Date(b.lastAccessed).getTime() -
          new Date(a.lastAccessed).getTime()
        );
      });

      const newItems = sortedActivities.map((activity) => ({
        id: activity.activityId,
        display: `${activity.name}`,
        //display: `${activity.lastAccessed}  ${activity.name}`,
        data: activity,
      }));
      setItems(newItems);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const itemActionKeymap = (item: Item): KeymapConfig => [
    {
      sequence: [key("\r", "return")],
      description: "activate acivity",
      name: "activity-activate",
      handler: () => {
        const activity = item.data;
        executeAction("activateActivity", activity.activityId);
        fetchActivities();
        // go back to Root or ActivityRoot
      },
      hidden: true,
    },
    {
      sequence: [key(" ")],
      description: "Item action: handy keybind",
      name: "item-act-handy",
      handler: () => {
        //console.log(`handy action for ${item.display}`);
      },
      hidden: true,
    },
  ];

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
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading activities...</Text>
      ) : (
        mode === "find" && (
          <ActionList initialItems={items} actionKeymap={itemActionKeymap} />
        )
      )}
    </Box>
  );
};

export default ActivityNavigate;
