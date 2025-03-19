import React, { useEffect, useState } from "react";
import { Box } from "ink";
import { Activity } from "../types.mts";
import SelectionList from "./common/SelectionList.tsx";

import { contextActivityTree, ActivityTreeItem } from "../models/activity.mts";
import {
  createContext,
  getCurrentContext,
  updateContext,
} from "../models/context.mts";
import { executeAction } from "../actions.mts";

type ContextActivityItem = {
  id: string;
  display: string;
  data: Activity;
} & ActivityTreeItem; // TOFIX type union

type ContextActivityStates = "initial" | "find";

const ContextActivitySelection: React.FC = () => {
  const [mode, setMode] = useState<ContextActivityStates>("initial");
  const [items, setItems] = useState<Array<ContextActivityItem>>([]);

  const fetchActivities = async () => {
    try {
      const tree = await contextActivityTree();

      const newItems = tree.map((activity) => ({
        id: activity.activityId,
        activity,
        selected: activity.selected,
        display:
          "  ".repeat(activity.depth || 0) +
          (activity.depth || 0 > 0 ? "└─ " : "") +
          activity.name,
      }));

      setItems(newItems);
      setMode("find");
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <Box borderStyle="single" borderColor="gray">
      {mode === "find" && (
        <SelectionList
          initialItems={items}
          onSelected={async (items) => {
            const activities = items.map((item) => item.activity);
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
