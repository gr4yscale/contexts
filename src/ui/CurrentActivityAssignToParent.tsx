import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { useCurrentActivity } from "./common/useCurrentActivity.mts";
import CoreList, { ListItem } from "../ui/common/CoreList.tsx";
import { executeAction } from "../actions.mts";
import {
  updateActivity,
  activityTree,
  formatActivityWithHierarchy,
  ActivityTreeItem,
} from "../models/activity.mts";
import { Activity } from "../types.mts";
import * as logger from "../logger.mts";

const CurrentActivityAssignToParent: React.FC = () => {
  const { currentActivity, loading: currentActivityLoading } =
    useCurrentActivity();
  const [activities, setActivities] = useState<ListItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        const allActivities = await activityTree();
        const formattedActivities = await Promise.all(
          allActivities.map(async (act: ActivityTreeItem) => ({
            id: act.activityId,
            display: await formatActivityWithHierarchy(act, allActivities),
            data: act,
          })),
        );
        setActivities(formattedActivities);
      } catch (error) {
        logger.error("Error fetching activities for parent assignment:", error);
        setActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();
  }, []);

  const handleParentSelection = async (selectedItems: ListItem[]) => {
    if (!currentActivity) {
      logger.error("No current activity to assign parent to.");
      return;
    }
    if (selectedItems.length !== 1) {
      logger.error("Please select exactly one parent activity.");
      return;
    }
    const parentActivityItem = selectedItems[0];
    const parentActivity = parentActivityItem.data as Activity;

    // Prevent assigning an activity to itself or its own children as parent
    if (parentActivity.activityId === currentActivity.activityId) {
      logger.error("Cannot assign an activity to itself as parent.");
      return;
    }
    try {
      await updateActivity({
        activityId: currentActivity.activityId,
        parentActivityId: parentActivity.activityId,
      });
      executeAction("activityNavigate");
    } catch (error) {
      logger.error("Error assigning parent activity:", error);
    }
  };

  return (
    <Box flexDirection="column">
      <Text>Current Activity: {currentActivity?.name || "None"}</Text>

      {currentActivityLoading || loadingActivities ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Box flexDirection="column">
            <Text>Assign parent for: {currentActivity?.name}</Text>
            {activities.length > 0 ? (
              <CoreList
                items={activities.filter(
                  (act) => act.id !== currentActivity?.activityId,
                )} // Prevent selecting self
                onSelected={handleParentSelection}
                multiple={false}
                initialMode="select"
              />
            ) : (
              <Text>No activities available to select as parent.</Text>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default CurrentActivityAssignToParent;
