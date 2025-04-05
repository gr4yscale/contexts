import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";

import { Activity } from "../types.mts";
import { getCurrentContextActivities } from "../models/context.mts";
import { executeAction } from "../actions.mts";

import { KeymapConfig, key } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";

import CoreList, { List, ListItem } from "./common/CoreList.tsx";
import useListSwitching from "./common/useListSwitching.mts";

export type Modes = "lists" | "items";

const ActivityNavigate: React.FC = () => {
  const [mode, setMode] = useState<Modes>("items");

  const [lists, setLists] = useState<Array<List>>([]);

  const { currentListItems, currentListIndex, switchList } =
    useListSwitching(lists);

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

  // keymapping
  const { keymap } = useContext(KeysContext);

  // shared keymap
  useEffect(() => {
    keymap.pushKeymap([
      {
        sequence: [key("`")],
        description: "Toggle List/Items",
        name: "toggle-list-or-items",
        handler: () => {
          if (mode === "lists") {
            setMode("items");
          } else {
            setMode("lists");
          }
        },
        hidden: true,
      },
      {
        sequence: [key("{")],
        description: "Previous list",
        name: "prevList",
        handler: () => {
          switchList(currentListIndex - 1);
        },
      },
      {
        sequence: [key("}")],
        description: "Next list",
        name: "nextList",
        handler: () => {
          switchList(currentListIndex + 1);
        },
      },
    ]);

    return () => {
      keymap.popKeymap();
    };
  }, []);

  return (
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading activities...</Text>
      ) : mode === "items" ? (
        <CoreList
          items={currentListItems}
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
          initialMode="select"
        />
      ) : (
        <CoreList
          items={lists}
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
          initialMode="select"
        />
      )}
    </Box>
  );
};

export default ActivityNavigate;
