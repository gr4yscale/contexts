import React, { useContext, useEffect, useState } from "react";
import { Box } from "ink";
import { Node } from "../types.mts";
import SelectionList from "./common/SelectionList.tsx";
import { KeymapConfig } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";

import { nodeTree, NodeTreeItem } from "../models/node.mts";

type NodeItem = {
  id: string;
  display: string;
  data: Node;
} & NodeTreeItem; // TOFIX type union

type NodeStates = "initial" | "find";

interface Props {
  onSelected?: (selectedItems: Item[]) => Promise<void>;
}

const NodeSelection: React.FC<Props> = ({ onSelected }) => {
  const [mode, setMode] = useState<NodeStates>("initial");
  const [items, setItems] = useState<Array<NodeItem>>([]);

  const fetchNodes = async () => {
    try {
      const tree = await nodeTree();

      const newItems = tree.map((node) => ({
        id: node.nodeId,
        node,
        selected: node.selected,
        display:
          "  ".repeat(node.depth || 0) +
          (node.depth || 0 > 0 ? "└─ " : "") +
          node.name,
      }));

      setItems(newItems);
      setMode("find");
      keymap.popKeymap();
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const { keymap }: any = useContext(KeysContext);

  useEffect(() => {
    let keymapConfig: KeymapConfig = [];

    switch (mode) {
      case "initial":
        keymapConfig = [];
        break;

      case "find":
        keymapConfig = [];
        break;
    }

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [mode]);

  return (
    <Box>
      {mode === "find" && (
        <SelectionList initialItems={items} onSelected={onSelected} />
      )}
    </Box>
  );
};

export default NodeSelection;
