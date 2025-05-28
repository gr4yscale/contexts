import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";

import { Node } from "../types.mts";
import {
  filteredNodeTree,
  NodeTreeFilter,
  formatNodeWithHierarchy,
} from "../models/node.mts";
import { executeAction } from "../actions.mts";
import * as logger from "../logger.mts";

import { KeymapConfig, key } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";

import CoreList, { List, ListItem } from "./common/CoreList.tsx";
import useListSwitching from "./common/useListSwitching.mts";

export type Modes = "lists" | "items";

const NodeNavigate: React.FC = () => {
  const [mode, setMode] = useState<Modes>("items");

  const [lists, setLists] = useState<Array<List>>([]);

  const { currentListItems, currentListIndex, switchList } =
    useListSwitching(lists);

  const [loading, setLoading] = useState(true);

  const fetchNodes = async () => {
    try {
      // here we will use a different fetcher; use a generic?
      const nodes = await filteredNodeTree(NodeTreeFilter.CONTEXT);

      const sortedNodes = [...nodes].sort((a, b) => {
        const dateA = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
        const dateB = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
        return dateB - dateA;
      });

      // Format nodes with hierarchy paths
      const formattedNodes = await Promise.all(
        sortedNodes.map(async (node) => {
          const hierarchyPath = await formatNodeWithHierarchy(node, sortedNodes);
          return {
            id: node.nodeId,
            display: hierarchyPath,
            data: node,
          };
        })
      );

      const newItems: ListItem[] = formattedNodes;

      setLists([
        {
          id: "nodes",
          display: "Nodes",
          items: newItems,
        },
      ]);
    } catch (error) {
      console.error("Error fetching nodes:", error);
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
          switchList(currentListIndex - 1);
        },
      },
      {
        sequence: [key("}")],
        description: "Next list",
        name: "nextList",
        handler: () => {
          switchList(currentListIndex + 1);
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
          onSelected={(selectedItems: ListItem[]) => {
            if (selectedItems.length > 0) {
              const selectedItem = selectedItems[0];
              const node = selectedItem.data as Node;
              if (node && node.nodeId) {
                executeAction("activateNode", node.nodeId);
              } else {
                console.error(
                  "Selected item data is not a valid Node:",
                  selectedItem,
                );
              }
            }
          }}
          multiple={false}
          initialMode="select"
        />
      ) : (
        <CoreList
          items={lists}
          onSelected={(selectedItems: ListItem[]) => {
            if (selectedItems.length > 0) {
              const selectedItem = selectedItems[0];
              const node = selectedItem.data as Node;
              if (node && node.nodeId) {
                executeAction("activateNode", node.nodeId);
              } else {
                console.error(
                  "Selected item data is not a valid Node:",
                  selectedItem,
                );
              }
            }
          }}
          multiple={false}
          initialMode="select"
        />
      )}
    </Box>
  );
};

export default NodeNavigate;
