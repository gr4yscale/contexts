import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";

import { Activity } from "../types.mts";

import { key, KeymapConfig } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";
import { getCurrentContextActivities } from "../models/context.mts";
import { executeAction } from "../actions.mts";
import CoreList, { List, ListItem } from "./common/CoreList.tsx";

const ActivityNavigate: React.FC = () => {
  const [mode, setMode] = useState<ActivityNavigateStates>("find");
  const [lists, setLists] = useState<Array<List>>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const activities = await getCurrentContextActivities();
      const sortedActivities = [...activities].sort((a, b) => {
        const dateA = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
        const dateB = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
        return dateB - dateA;
      });

      const newItems: ListItem[] = sortedActivities.map((activity) => ({
        id: activity.activityId,
        display: `${activity.name}`,
        data: activity,
      }));

      setLists([
        {
          id: "activities",
          display: "Activities",
          items: newItems,
        },
      ]);
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
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading activities...</Text>
      ) : (
        <CoreList
          lists={lists}
          onSelected={(selectedItems: ListItem[]) => {
            if (selectedItems.length > 0) {
              const selectedItem = selectedItems[0];
              const activity = selectedItem.data as Activity;
              if (activity && activity.activityId) {
                executeAction("activateActivity", activity.activityId);
              } else {
                console.error(
                  "Selected item data is not a valid Activity:",
                  selectedItem,
                );
              }
            }
          }}
          multiple={false}
        />
      )}
    </Box>
  );
};

export default ActivityNavigate;
