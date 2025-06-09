import React, { useEffect, useState, useContext, useCallback } from "react";
import { Box, Text } from "ink";

import { Node } from "../types.mts";
import { filteredNodeTree, NodeTreeFilter, formatNodeWithHierarchy, getChildNodes } from "../models/node.mts";
import * as logger from "../logger.mts";

import { KeymapConfig, key } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";

import CoreList, { List, ListItem } from "./common/CoreList.tsx";
import useListSwitching from "./common/useListSwitching.mts";

export type Modes = "lists" | "items";
export type ViewModes = "list" | "dag";
export type DagModes = "navigate" | "select";

interface NodeSelectionProps {
  onSelected: (nodeIds: string[]) => void;
  multiple?: boolean;
  initialSelection?: string[];
  viewMode?: ViewModes;
}

const NodeSelection: React.FC<NodeSelectionProps> = ({ 
  onSelected, 
  multiple = false,
  initialSelection = [],
  viewMode = "dag"
}) => {
  const [mode, setMode] = useState<Modes>("items");
  const [lists, setLists] = useState<Array<List>>([]);
  const [loading, setLoading] = useState(true);
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [currentParentIds, setCurrentParentIds] = useState<string[]>([]);
  const [dagMode, setDagMode] = useState<DagModes>("navigate");
  const [initialParentsSelected, setInitialParentsSelected] = useState(false);

  const { currentListItems, currentListIndex, switchListByIndex, switchListById } =
    useListSwitching(lists);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const nodes = await filteredNodeTree(NodeTreeFilter.ALL);
      setAllNodes(nodes);

      if (viewMode === "list") {
        // Filter nodes accessed in the last 2 weeks
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        const recentNodes = nodes.filter(node => {
          if (!node.lastAccessed) return false;
          const lastAccessed = new Date(node.lastAccessed);
          return lastAccessed >= twoWeeksAgo;
        });

        const formatNodes = async (nodeList: Node[]) => {
          return await Promise.all(
            nodeList.map(async (node) => {
              const hierarchyPath = await formatNodeWithHierarchy(node, nodes);
              return {
                id: node.nodeId,
                display: hierarchyPath,
                data: node,
                selected: initialSelection.includes(node.nodeId),
              };
            })
          );
        };

        const formattedRecentNodes = await formatNodes(recentNodes);
        const formattedAllNodes = await formatNodes(nodes);

        setLists([
          {
            id: "recent",
            display: "Recent Nodes",
            items: formattedRecentNodes,
          },
          {
            id: "all",
            display: "All Nodes",
            items: formattedAllNodes,
          },
        ]);
      } else {
        // dag mode - start with root nodes for initial selection
        const rootNodes = nodes.filter(node => !node.parentNodeId);
        setCurrentParentIds([]);
        setInitialParentsSelected(false);
        
        setLists([
          {
            id: "dag",
            display: "Select Initial Parent Nodes",
            items: rootNodes.map(node => ({
              id: node.nodeId,
              display: node.name,
              data: node,
              selected: initialSelection.includes(node.nodeId),
            })),
          },
        ]);
      }
    } catch (error) {
      logger.error("Error fetching nodes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChildrenNodes = useCallback(async (parentIds: string[]) => {
    if (parentIds.length === 0) {
      // Return root nodes
      return allNodes.filter(node => !node.parentNodeId);
    }
    
    // Get children from database for each parent
    const allChildren: Node[] = [];
    for (const parentId of parentIds) {
      const children = await getChildNodes(parentId);
      allChildren.push(...children);
    }
    
    // Remove duplicates
    const uniqueChildren = allChildren.filter((node, index, self) => 
      index === self.findIndex(n => n.nodeId === node.nodeId)
    );
    
    return uniqueChildren;
  }, [allNodes]);

  const navigateToChildren = useCallback(async (selectedParentIds: string[]) => {
    const children = await getChildrenNodes(selectedParentIds);
    setCurrentParentIds(selectedParentIds);
    setInitialParentsSelected(true);
    
    setLists([
      {
        id: "dag",
        display: "Nodes",
        items: children.map(node => ({
          id: node.nodeId,
          display: node.name,
          data: node,
          selected: initialSelection.includes(node.nodeId),
        })),
      },
    ]);
  }, [getChildrenNodes, initialSelection]);

  const navigateUp = useCallback(async () => {
    if (currentParentIds.length === 0) return;
    
    // Find the parents of current parent nodes
    const parentNodes = allNodes.filter(node => 
      currentParentIds.includes(node.nodeId)
    );
    
    // Get their parent IDs
    const grandParentIds = parentNodes.reduce((acc: string[], node) => {
      if (node.parentNodeId) {
        acc.push(node.parentNodeId);
      }
      return acc;
    }, []);
    
    // Remove duplicates
    const uniqueGrandParentIds = [...new Set(grandParentIds)];
    
    if (uniqueGrandParentIds.length === 0) {
      // Go back to root
      await navigateToChildren([]);
    } else {
      await navigateToChildren(uniqueGrandParentIds);
    }
  }, [currentParentIds, allNodes, navigateToChildren]);

  useEffect(() => {
    fetchNodes();
  }, [viewMode]);

  // keymapping
  const { keymap } = useContext(KeysContext);

  // shared keymap
  useEffect(() => {
    const keymapConfig: KeymapConfig = [
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
    ];

    if (viewMode === "list") {
      keymapConfig.push(
        {
          sequence: [key("{")],
          description: "Previous list",
          name: "prevList",
          handler: () => {
            switchListByIndex(currentListIndex - 1);
          },
        },
        {
          sequence: [key("}")],
          description: "Next list",
          name: "nextList",
          handler: () => {
            switchListByIndex(currentListIndex + 1);
          },
        }
      );
    } else {
      // dag mode keybindings
      keymapConfig.push(
        {
          sequence: [key("h")],
          description: "Navigate up",
          name: "navigate-up",
          handler: navigateUp,
        },
        {
          sequence: [key("t")],
          description: "Toggle navigate/select mode",
          name: "toggle-dag-mode",
          handler: () => {
            setDagMode(dagMode === "navigate" ? "select" : "navigate");
          },
        }
      );
    }

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [viewMode, currentParentIds, dagMode, currentListIndex, initialParentsSelected, mode, navigateUp, switchListByIndex]);

  return (
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading nodes...</Text>
      ) : viewMode === "dag" ? (
        <CoreList
          items={currentListItems}
          multiple={multiple}
          initialMode="select"
          onSelected={async (selectedItems: ListItem[]) => {
            if (!initialParentsSelected) {
              // Initial selection of parent nodes - navigate to their children
              const parentNodeIds = selectedItems.map(
                (item) => (item.data as Node).nodeId,
              );
              await navigateToChildren(parentNodeIds);
            } else if (dagMode === "select" || multiple) {
              const nodeIds = selectedItems.map(
                (item) => (item.data as Node).nodeId,
              );
              onSelected(nodeIds);
            } else {
              // In navigate mode, navigate to children if they exist
              const selectedNode = selectedItems[0]?.data as Node;
              if (selectedNode) {
                const children = await getChildrenNodes([selectedNode.nodeId]);
                if (children.length > 0) {
                  // Navigate to children
                  await navigateToChildren([selectedNode.nodeId]);
                } else {
                  // No children, select this node
                  onSelected([selectedNode.nodeId]);
                }
              }
            }
          }}
        />
      ) : mode === "items" ? (
        <CoreList
          items={currentListItems}
          multiple={multiple}
          initialMode="select"
          onSelected={async (selectedItems: ListItem[]) => {
            const nodeIds = selectedItems.map(
              (item) => (item.data as Node).nodeId,
            );
            onSelected(nodeIds);
          }}
        />
      ) : (
        <CoreList
          items={lists}
          onSelected={(selectedLists: List[]) => {
            if (selectedLists.length > 0) {
              const selectedList = selectedLists[0];
              switchListById(selectedList.id);
              setMode("items");
            }
          }}
          multiple={false}
          initialMode="select"
        />
      )}
    </Box>
  );
};

export default NodeSelection;
