import React, { useEffect, useContext } from "react";
import { Text, Box, useInput } from "ink";
import useActionList, { Item } from "./useActionList.mts";
import { KeymapConfig, key } from "./Keymapping.mts";
import { KeysContext } from "./Context.mts";

interface ActionListProps {
  initialItems: Item[];
  onSelected?: (selectedItems: Item[]) => void;
  actionKeymap?: (item: Item) => KeymapConfig;
}

const ActionList: React.FC<ActionListProps> = ({
  initialItems,
  actionKeymap,
}) => {
  const {
    mode,
    getItems,
    highlightedItem,
    findMode,
    selectMode,
    filterBySearchString,
    trimLastCharacter,
    clearSearchString,
    highlightDown,
    highlightUp,
  } = useActionList<Item>({ initialItems });

  const { keymap }: any = useContext(KeysContext);

  // shared keymap, persists regardless of mode
  useEffect(() => {
    keymap.pushKeymap([
      {
        sequence: [key("", "leftArrow")],
        description: "Enter find mode",
        name: "findMode",
        handler: findMode,
        hidden: true,
      },
    ]);

    return () => {
      keymap.popKeymap();
    };
  }, []);

  // mode-specific keymap
  useEffect(() => {
    let keymapConfig: KeymapConfig = [];

    switch (mode) {
      case "find":
        keymapConfig = [
          {
            sequence: [key("\r", "return")],
            description: "Select mode",
            name: "mode-select",
            handler: () => {
              keymap.popKeymap();
              selectMode();
            },
            hidden: true,
          },
          {
            sequence: [key("", "delete")],
            description: "Clear search string",
            name: "clearSearch",
            handler: clearSearchString,
            hidden: true,
          },
          {
            sequence: [key("", "pageUp")],
            description: "Trim last character",
            name: "trimLast",
            handler: trimLastCharacter,
            hidden: true,
          },
        ];
        break;

      case "select":
        keymapConfig = [
          {
            sequence: [key("j")],
            description: "Move down",
            name: "moveDown",
            handler: highlightDown,
          },
          {
            sequence: [key("k")],
            description: "Move up",
            name: "moveUp",
            handler: highlightUp,
          },
          {
            sequence: [key("", "delete")],
            description: "Back to find mode",
            name: "back-find",
            handler: findMode,
          },
        ];

        break;
    }

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [mode]); // the keymapping side effects depend on the mode state variable; useEffect will run every render without mode defined in the useEffect deps array

  // item-specific keymap for actions on highlighted item, coming from props
  useEffect(() => {
    if (mode !== "select") return;
    const item = highlightedItem();
    if (actionKeymap && item) {
      const map = actionKeymap(item);
      keymap.pushKeymap(map);
    }

    return () => {
      keymap.popKeymap();
    };
  }, [highlightedItem]);

  // Update the search string with freeform text when we are in find mode
  useInput(
    (input, key) => {
      if (input != "" && !key.return) filterBySearchString(input);
    },
    { isActive: mode === "find" },
  );

  return (
    <Box flexDirection="column">
      {getItems().map((i: Item) => (
        <Box key={i.id} paddingLeft={2}>
          <Text>
            {i.highlighted && mode === "select" ? "> " : "  "}
            {i.display}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

export default ActionList;
