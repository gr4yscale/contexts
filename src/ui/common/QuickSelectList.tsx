import React, { useEffect, useContext } from "react";
import { Text, Box } from "ink";
import { KeymapConfig, key } from "./Keymapping.mts";
import { KeysContext } from "./Context.mts";
import { Item } from "./useActionList.mts";

import useQuickSelect from "./useQuickSelect.mts";

interface QuickSelectListProps {
  initialItems: Item[];
  onSelected?: (selectedItem: Item) => void;
  keys?: string;
  maxSequenceLength?: number;
}

const QuickSelectList: React.FC<QuickSelectListProps> = ({
  initialItems,
  onSelected,
  keys = "asdfghjkl;",
  maxSequenceLength = 3,
}) => {
  const {
    items,
    currentSequence,
    appendToSequence,
    clearSequence,
    getSelectedItem,
    getItemSequence,
    isComplete,
  } = useQuickSelect<Item>({
    initialItems,
    keys,
    maxSequenceLength,
  });

  const { keymap }: any = useContext(KeysContext);

  // Handle selection when sequence is complete
  useEffect(() => {
    if (isComplete && onSelected) {
      const selectedItem = getSelectedItem();
      if (selectedItem) {
        onSelected(selectedItem);
        clearSequence();
      }
    }
  }, [isComplete, getSelectedItem, onSelected, clearSequence]);

  // Set up keymap for quick selection keys
  useEffect(() => {
    const keymapConfig: KeymapConfig = [];

    // Add each key from the keys string as a handler
    keys.split("").forEach((k) => {
      keymapConfig.push({
        sequence: [key(k)],
        description: `Type ${k}`,
        name: `key-${k}`,
        handler: () => appendToSequence(k),
        hidden: true,
      });
    });

    // Add escape/delete to clear the sequence
    keymapConfig.push({
      sequence: [key("", "escape")],
      description: "Clear sequence",
      name: "clear-sequence",
      handler: clearSequence,
      hidden: true,
    });

    keymapConfig.push({
      sequence: [key("", "delete")],
      description: "Clear sequence",
      name: "clear-sequence-delete",
      handler: clearSequence,
      hidden: true,
    });

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [appendToSequence, clearSequence, keys]);

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginLeft={2}>
        <Text>{currentSequence}</Text>
      </Box>
      {items.map((item: Item) => (
        <Box key={item.id} paddingLeft={2}>
          <Text color="white">
            <Text bold color="cyan">
              {getItemSequence(item)}
            </Text>{" "}
            {item.display}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

export default QuickSelectList;
