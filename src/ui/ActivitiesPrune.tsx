import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Activity } from "../types.mts";
import CoreList, { ListItem } from "./common/CoreList.tsx";

import {
  filteredActivityTree,
  ActivityTreeFilter,
} from "../models/activity.mts";
import { getAllWorkspaces } from "../models/workspace.mts";
import { executeAction } from "../actions.mts";
import {
  getActivitiesWithX11Counts,
  pruneActivities,
} from "../actions/activity-bulk.mts";

const ActivitiesPrune: React.FC = () => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // Get all activities
      const activities = await filteredActivityTree(ActivityTreeFilter.ALL);

      // Enhance with X11 client counts
      const activitiesWithCounts = await getActivitiesWithX11Counts(activities);

      // Get all workspaces and create a set of their activityIds
      const workspaces = await getAllWorkspaces();
      const workspaceActivityIds = new Set(
        workspaces.map((ws) => ws.activityId),
      );

      // Filter activities to include only those with an associated workspace
      const activitiesWithWorkspaces = activitiesWithCounts.filter((activity) =>
        workspaceActivityIds.has(activity.activityId),
      );

      const newItems: ListItem[] = activitiesWithWorkspaces.map((activity) => ({
        id: activity.activityId,
        display:
          activity.name +
          (activity.x11ClientCount !== undefined
            ? ` (${activity.x11ClientCount})`
            : ""),
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

  return (
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading activities...</Text>
      ) : (
        <Box flexDirection="column">
          <Text bold>Prune Workspaces for Activities</Text>
          <CoreList
            items={items}
            multiple={true}
            initialMode="select"
            onSelected={async (selectedItems: ListItem[]) => {
              const activities = selectedItems.map(
                (item) => item.data as Activity,
              );

              try {
                await pruneActivities(activities);
                await executeAction("activityNavigate");
              } catch (error) {
                console.error("Error pruning activities:", error);
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ActivitiesPrune;
