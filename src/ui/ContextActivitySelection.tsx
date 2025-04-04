import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Activity } from "../types.mts";
import CoreList, { List, ListItem } from "./common/CoreList.tsx";

import { contextActivityTree } from "../models/activity.mts";
import {
  createContext,
  getCurrentContext,
  updateContext,
} from "../models/context.mts";
import { executeAction } from "../actions.mts";

const ContextActivitySelection: React.FC = () => {
  const [lists, setLists] = useState<Array<List>>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const tree = await contextActivityTree();

      const newItems: ListItem[] = tree.map((activity) => ({
        id: activity.activityId,
        display:
          "  ".repeat(activity.depth || 0) +
          (activity.depth && activity.depth > 0 ? "└─ " : "") +
          activity.name,
        data: activity,
        selected: activity.selected,
      }));

      setLists([
        {
          id: "contextActivities",
          display: "Select Activities for Context",
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

  return (
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading activities...</Text>
      ) : (
        <CoreList
          lists={lists}
          multiple={true}
          initialMode="select"
          onSelected={async (selectedItems: ListItem[]) => {
            const activities = selectedItems.map(
              (item) => item.data as Activity,
            );
            const activityIds = activities.map(
              (activity) => activity.activityId,
            );

            try {
              const currentContext = await getCurrentContext();

              if (currentContext) {
                await updateContext({
                  contextId: currentContext.contextId,
                  activityIds: activityIds,
                });
              } else {
                await createContext({
                  name: `Context ${new Date().toLocaleString()}`,
                  activityIds: activityIds,
                });
              }
              await executeAction("activityNavigate");
            } catch (error) {
              console.error("Error updating context:", error);
            }
          }}
        />
      )}
    </Box>
  );
};

export default ContextActivitySelection;
