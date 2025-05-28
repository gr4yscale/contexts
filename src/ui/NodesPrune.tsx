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
      // Get all nodes
      const nodes = await filteredNodeTree(NodeTreeFilter.ALL);

      // Enhance with X11 client counts
      const nodesWithCounts = await getNodesWithX11Counts(nodes);

      // Get all workspaces and create a set of their nodeIds
      const workspaces = await getAllWorkspaces();
      const workspaceNodeIds = new Set(
        workspaces.map((ws) => ws.nodeId),
      );

      // Filter nodes to include only those with an associated workspace
      const nodesWithWorkspaces = nodesWithCounts.filter((node) =>
        workspaceNodeIds.has(node.nodeId),
      );

      const newItems: ListItem[] = nodesWithWorkspaces.map((node) => ({
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
      console.error("Error fetching nodes:", error);
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
        <Text>Loading nodes...</Text>
      ) : (
        <Box flexDirection="column">
          <Text bold>Prune Workspaces for Nodes</Text>
          <CoreList
            items={items}
            multiple={true}
            initialMode="select"
            onSelected={async (selectedItems: ListItem[]) => {
              const nodes = selectedItems.map(
                (item) => item.data as Node,
              );

              try {
                await pruneNodes(nodes);
                await executeAction("nodeNavigate");
              } catch (error) {
                console.error("Error pruning nodes:", error);
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default NodesPrune;
