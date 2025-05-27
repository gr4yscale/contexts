import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Node } from "../types.mts";
import CoreList, { ListItem } from "./common/CoreList.tsx";

import {
  filteredNodeTree,
  NodeTreeFilter,
} from "../models/node.mts";
import { getAllWorkspaces } from "../models/workspace.mts";
import { executeAction } from "../actions.mts";
import {
  getNodesWithX11Counts,
  pruneNodes,
} from "../actions/node-bulk.mts";

const NodesPrune: React.FC = () => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      // Get all activities
      const activities = await filteredNodeTree(NodeTreeFilter.ALL);

      // Enhance with X11 client counts
      const activitiesWithCounts = await getNodesWithX11Counts(activities);

      // Get all workspaces and create a set of their nodeIds
      const workspaces = await getAllWorkspaces();
      const workspaceNodeIds = new Set(
        workspaces.map((ws) => ws.nodeId),
      );

      // Filter activities to include only those with an associated workspace
      const activitiesWithWorkspaces = activitiesWithCounts.filter((node) =>
        workspaceNodeIds.has(node.nodeId),
      );

      const newItems: ListItem[] = activitiesWithWorkspaces.map((node) => ({
        id: node.nodeId,
        display:
          node.name +
          (node.x11ClientCount !== undefined
            ? ` (${node.x11ClientCount})`
            : ""),
        data: node,
      }));

      setItems(newItems);
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
        <Box flexDirection="column">
          <Text bold>Prune Workspaces for Nodes</Text>
          <CoreList
            items={items}
            multiple={true}
            initialMode="select"
            onSelected={async (selectedItems: ListItem[]) => {
              const activities = selectedItems.map(
                (item) => item.data as Node,
              );

              try {
                await pruneNodes(activities);
                await executeAction("nodeNavigate");
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

export default NodesPrune;
