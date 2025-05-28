import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { useCurrentNode } from "./common/useCurrentNode.mts";
import CoreList, { ListItem } from "../ui/common/CoreList.tsx";
import { executeAction } from "../actions.mts";
import {
  updateNode,
  nodeTree,
  formatNodeWithHierarchy,
  NodeTreeItem,
} from "../models/node.mts";
import { Node } from "../types.mts";
import * as logger from "../logger.mts";

const CurrentNodeAssignToParent: React.FC = () => {
  const { currentNode, loading: currentNodeLoading } =
    useCurrentNode();
  const [nodes, setNodes] = useState<ListItem[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(true);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        setLoadingNodes(true);
        const allNodes = await nodeTree();
        const formattedNodes = await Promise.all(
          allNodes.map(async (act: NodeTreeItem) => ({
            id: act.nodeId,
            display: await formatNodeWithHierarchy(act, allNodes),
            data: act,
          })),
        );
        setNodes(formattedNodes);
      } catch (error) {
        logger.error("Error fetching nodes for parent assignment:", error);
        setNodes([]);
      } finally {
        setLoadingNodes(false);
      }
    };

    fetchNodes();
  }, []);

  const handleParentSelection = async (selectedItems: ListItem[]) => {
    if (!currentNode) {
      logger.error("No current node to assign parent to.");
      return;
    }
    if (selectedItems.length !== 1) {
      logger.error("Please select exactly one parent node.");
      return;
    }
    const parentNodeItem = selectedItems[0];
    const parentNode = parentNodeItem.data as Node;

    // Prevent assigning an node to itself or its own children as parent
    if (parentNode.nodeId === currentNode.nodeId) {
      logger.error("Cannot assign an node to itself as parent.");
      return;
    }
    try {
      await updateNode({
        nodeId: currentNode.nodeId,
        parentNodeId: parentNode.nodeId,
      });
      executeAction("nodeNavigate");
    } catch (error) {
      logger.error("Error assigning parent node:", error);
    }
  };

  return (
    <Box flexDirection="column">
      <Text>Current Node: {currentNode?.name || "None"}</Text>

      {currentNodeLoading || loadingNodes ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Box flexDirection="column">
            <Text>Assign parent for: {currentNode?.name}</Text>
            {nodes.length > 0 ? (
              <CoreList
                items={nodes.filter(
                  (act) => act.id !== currentNode?.nodeId,
                )} // Prevent selecting self
                onSelected={handleParentSelection}
                multiple={false}
                initialMode="select"
              />
            ) : (
              <Text>No nodes available to select as parent.</Text>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default CurrentNodeAssignToParent;
