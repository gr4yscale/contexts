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

interface NodeSelectionProps {
  onSelected: (nodeIds: string[]) => void;
  multiple?: boolean;
  initialSelection?: string[];
}

const NodeSelection: React.FC<NodeSelectionProps> = ({ 
  onSelected, 
  multiple = false,
  initialSelection = []
}) => {
  const [mode, setMode] = useState<Modes>("items");
  const [lists, setLists] = useState<Array<List>>([]);
  const [loading, setLoading] = useState(true);

  const { currentListItems, currentListIndex, switchListByIndex, switchListById } =
    useListSwitching(lists);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const nodes = await filteredNodeTree(NodeTreeFilter.ALL);

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
    } catch (error) {
      logger.error("Error fetching nodes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  // keymapping
  const { keymap } = useContext(KeysContext);

  // shared keymap
  useEffect(() => {
    keymap.pushKeymap([
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
      },
    ]);

    return () => {
      keymap.popKeymap();
    };
  }, []);

  return (
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading nodes...</Text>
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
