import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { useCurrentNode } from "./common/useCurrentNode.mts";
import CoreList, { ListItem } from "../ui/common/CoreList.tsx";
import { executeAction } from "../actions.mts";
import {
  updateNode,
  activityTree,
  formatNodeWithHierarchy,
  NodeTreeItem,
} from "../models/activity.mts";
import { Node } from "../types.mts";
import * as logger from "../logger.mts";

const CurrentNodeAssignToParent: React.FC = () => {
  const { currentNode, loading: currentNodeLoading } =
    useCurrentNode();
  const [activities, setActivities] = useState<ListItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        const allActivities = await activityTree();
        const formattedActivities = await Promise.all(
          allActivities.map(async (act: NodeTreeItem) => ({
            id: act.activityId,
            display: await formatNodeWithHierarchy(act, allActivities),
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
    if (!currentNode) {
      logger.error("No current activity to assign parent to.");
      return;
    }
    if (selectedItems.length !== 1) {
      logger.error("Please select exactly one parent activity.");
      return;
    }
    const parentNodeItem = selectedItems[0];
    const parentNode = parentNodeItem.data as Node;

    // Prevent assigning an activity to itself or its own children as parent
    if (parentNode.activityId === currentNode.activityId) {
      logger.error("Cannot assign an activity to itself as parent.");
      return;
    }
    try {
      await updateNode({
        activityId: currentNode.activityId,
        parentNodeId: parentNode.activityId,
      });
      executeAction("activityNavigate");
    } catch (error) {
      logger.error("Error assigning parent activity:", error);
    }
  };

  return (
    <Box flexDirection="column">
      <Text>Current Node: {currentNode?.name || "None"}</Text>

      {currentNodeLoading || loadingActivities ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Box flexDirection="column">
            <Text>Assign parent for: {currentNode?.name}</Text>
            {activities.length > 0 ? (
              <CoreList
                items={activities.filter(
                  (act) => act.id !== currentNode?.activityId,
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

export default CurrentNodeAssignToParent;
