import { $ } from "zx";
import React, { useEffect, useState } from "react";
import { Box } from "ink";
import CoreList, { List } from "./common/CoreList.tsx";
import {
  filteredNodeTree,
  NodeTreeFilter,
} from "../models/node.mts";

const Testbed: React.FC = () => {
  const [lists, setLists] = useState<Array<List>>([]);

  const fetchNodes = async () => {
    try {
      const nodes = await filteredNodeTree(NodeTreeFilter.ALL);

      const items = tree.map((node) => ({
        id: node.nodeId,
        node,
        selected: node.selected,
        display:
          "  ".repeat(node.depth || 0) +
          (node.depth || 0 > 0 ? "└─ " : "") +
          node.name,
      }));
      setLists([{ items, id: "default", display: "default" }]);
    } catch (error) {
      console.error("Error fetching nodes:", error);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  return (
    <Box flexDirection="column" width="100%">
      <CoreList
        lists={lists}
        multiple={true}
        onSelected={(items) => {
          $`notify-send items: "${items}"`;
        }}
      />
    </Box>
  );
};

export default Testbed;
