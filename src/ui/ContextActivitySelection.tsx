import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Node } from "../types.mts";
import CoreList, { List, ListItem } from "./common/CoreList.tsx";

import {
  filteredNodeTree,
  NodeTreeFilter,
} from "../models/activity.mts";
import {
  createContext,
  getCurrentContext,
  updateContext,
} from "../models/context.mts";
import { executeAction } from "../actions.mts";

const ContextNodeSelection: React.FC = () => {
  const [lists, setLists] = useState<Array<List>>([
    { id: "initial", display: "initial", items: [] },
  ]);
  const [loading, setLoading] = useState(true);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const activities = await filteredNodeTree(NodeTreeFilter.ALL);
      //console.log(activities);

      const newItems: ListItem[] = activities.map((activity) => ({
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
          id: "contextNodes",
          display: "Select Nodes for Context",
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
    fetchNodes();
  }, []);

  return (
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading activities...</Text>
      ) : (
        <CoreList
          items={lists[0].items}
          multiple={true}
          initialMode="select"
          onSelected={async (selectedItems: ListItem[]) => {
            const activities = selectedItems.map(
              (item) => item.data as Node,
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

export default ContextNodeSelection;
