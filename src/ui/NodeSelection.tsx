import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";

import { Node } from "../types.mts";
import { filteredNodeTree, NodeTreeFilter, formatNodeWithHierarchy } from "../models/node.mts";
import * as logger from "../logger.mts";

import { KeymapConfig, key } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";

import CoreList, { List, ListItem } from "./common/CoreList.tsx";
import useListSwitching from "./common/useListSwitching.mts";

export type Modes = "lists" | "items";
export type ViewModes = "list" | "ranger";

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
  viewMode = "list"
}) => {
  const [mode, setMode] = useState<Modes>("items");
  const [lists, setLists] = useState<Array<List>>([]);
  const [loading, setLoading] = useState(true);
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [currentParentIds, setCurrentParentIds] = useState<string[]>([]);

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
        // ranger mode - start with root nodes (nodes with no parents)
        const rootNodes = nodes.filter(node => !node.parentIds || node.parentIds.length === 0);
        setCurrentParentIds([]);
        
        setLists([
          {
            id: "ranger",
            display: "Nodes",
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

  const getChildrenNodes = (parentIds: string[]) => {
    if (parentIds.length === 0) {
      // Return root nodes
      return allNodes.filter(node => !node.parentIds || node.parentIds.length === 0);
    }
    
    // Return nodes that have any of the parentIds as their parent
    return allNodes.filter(node => 
      node.parentIds && node.parentIds.some(parentId => parentIds.includes(parentId))
    );
  };

  const navigateToChildren = (selectedParentIds: string[]) => {
    const children = getChildrenNodes(selectedParentIds);
    setCurrentParentIds(selectedParentIds);
    
    setLists([
      {
        id: "ranger",
        display: "Nodes",
        items: children.map(node => ({
          id: node.nodeId,
          display: node.name,
          data: node,
          selected: initialSelection.includes(node.nodeId),
        })),
      },
    ]);
  };

  const navigateUp = () => {
    if (currentParentIds.length === 0) return;
    
    // Find the parents of current parent nodes
    const parentNodes = allNodes.filter(node => 
      currentParentIds.includes(node.nodeId)
    );
    
    // Get their parent IDs
    const grandParentIds = parentNodes.reduce((acc: string[], node) => {
      if (node.parentIds) {
        acc.push(...node.parentIds);
      }
      return acc;
    }, []);
    
    // Remove duplicates
    const uniqueGrandParentIds = [...new Set(grandParentIds)];
    
    if (uniqueGrandParentIds.length === 0) {
      // Go back to root
      navigateToChildren([]);
    } else {
      navigateToChildren(uniqueGrandParentIds);
    }
  };

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
      // ranger mode keybindings
      keymapConfig.push(
        {
          sequence: [key("h")],
          description: "Navigate up",
          name: "navigate-up",
          handler: navigateUp,
        }
      );
    }

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [viewMode, currentParentIds]);

  return (
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading nodes...</Text>
      ) : viewMode === "ranger" ? (
        <CoreList
          items={currentListItems}
          multiple={multiple}
          initialMode="select"
          onSelected={async (selectedItems: ListItem[]) => {
            if (multiple) {
              // In multiple selection mode, just select the items
              const nodeIds = selectedItems.map(
                (item) => (item.data as Node).nodeId,
              );
              onSelected(nodeIds);
            } else {
              // In single selection mode, navigate to children if they exist
              const selectedNode = selectedItems[0]?.data as Node;
              if (selectedNode) {
                const children = getChildrenNodes([selectedNode.nodeId]);
                if (children.length > 0) {
                  // Navigate to children
                  navigateToChildren([selectedNode.nodeId]);
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
