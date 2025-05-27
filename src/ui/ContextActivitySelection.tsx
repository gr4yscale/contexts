import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Node } from "../types.mts";
import CoreList, { List, ListItem } from "./common/CoreList.tsx";

import {
  filteredNodeTree,
  NodeTreeFilter,
} from "../models/node.mts";
import {
  createContext,
  getCurrentContext,
  updateContext,
} from "../models/context.mts";
import { executeAction } from "../actions.mts";

const ContextNodeSelection: React.FC = () => {
  const [lists, setLists] = useState<Array<List>>([
    { id: "initial", display: "initial", items: [] },
  ]);
  const [loading, setLoading] = useState(true);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const nodes = await filteredNodeTree(NodeTreeFilter.ALL);
      //console.log(nodes);

      const newItems: ListItem[] = nodes.map((node) => ({
        id: node.nodeId,
        display:
          "  ".repeat(node.depth || 0) +
          (node.depth && node.depth > 0 ? "└─ " : "") +
          node.name,
        data: node,
        selected: node.selected,
      }));

      setLists([
        {
          id: "contextNodes",
          display: "Select Nodes for Context",
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

  return (
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading nodes...</Text>
      ) : (
        <CoreList
          items={lists[0].items}
          multiple={true}
          initialMode="select"
          onSelected={async (selectedItems: ListItem[]) => {
            const nodes = selectedItems.map(
              (item) => item.data as Node,
            );
            const nodeIds = nodes.map(
              (node) => node.nodeId,
            );

            try {
              const currentContext = await getCurrentContext();

              if (currentContext) {
                await updateContext({
                  contextId: currentContext.contextId,
                  nodeIds: nodeIds,
                });
              } else {
                await createContext({
                  name: `Context ${new Date().toLocaleString()}`,
                  nodeIds: nodeIds,
                });
              }
              await executeAction("nodeNavigate");
            } catch (error) {
              console.error("Error updating context:", error);
            }
          }}
        />
      )}
    </Box>
  );
};

export default ContextNodeSelection;
