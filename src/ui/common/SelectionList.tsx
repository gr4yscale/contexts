import React, { useEffect, useContext } from "react";
import { Text, Box, useInput } from "ink";
import useSelectionList, { Item } from "./useSelectionList.mts";
import { KeymapConfig, key } from "./Keymapping.mts";
import { KeysContext } from "./Context.mts";

interface SelectionListProps {
  initialItems: Item[];
  onSelected?: (selectedItems: Item[]) => void;
  onAct?: (selectedItems: Item[]) => void;
}

const SelectionList: React.FC<SelectionListProps> = ({ initialItems }) => {
  const {
    mode,
    getItems,
    getSelectedItems,
    selectMode,
    findMode,
    actMode,
    filterBySearchString,
    trimLastCharacter,
    clearSearchString,
    toggleSelectionAtHighlightedIndex,
    highlightDown,
    highlightUp,
  } = useSelectionList<Item>({ initialItems });

  const { keymap }: any = useContext(KeysContext);

  useEffect(() => {
    // shared keymap, persists regardless of mode
    keymap.pushKeymap([
      {
        sequence: [key("", "rightArrow")],
        description: "Enter select mode",
        command: { name: "selectMode", handler: selectMode },
      },
      {
        sequence: [key("", "leftArrow")],
        description: "Enter find mode",
        command: { name: "findMode", handler: findMode },
      },
    ]);

    return () => {
      keymap.popKeymap();
    };
  }, []);

  useEffect(() => {
    // push a keymap for the current mode
    let keymapConfig: KeymapConfig = [];

    switch (mode) {
      case "find":
        keymapConfig = [
          {
            sequence: [key("\r", "return")],
            description: "Enter select mode (selectionlist)",
            command: {
              name: "selectMode",
              handler: selectMode,
            },
          },
          {
            sequence: [key("", "delete")],
            description: "Clear search string",
            command: {
              name: "clearSearch",
              handler: clearSearchString,
            },
          },
          {
            sequence: [key("", "pageUp")],
            description: "Trim last character",
            command: {
              name: "trimLast",
              handler: trimLastCharacter,
            },
          },
        ];
        break;

      case "select":
        keymapConfig = [
          {
            sequence: [key("j")],
            description: "Move down",
            command: {
              name: "moveDown",
              handler: highlightDown,
            },
          },
          {
            sequence: [key("k")],
            description: "Move up",
            command: {
              name: "moveUp",
              handler: highlightUp,
            },
          },
          {
            sequence: [key(" ")],
            description: "Select items",
            command: {
              name: "selectItems",
              handler: toggleSelectionAtHighlightedIndex,
            },
          },
          {
            sequence: [key("\r", "return")],
            description: "Enter commit mode",
            command: {
              name: "commit",
              handler: () => {
                if (getSelectedItems().length > 0) {
                  actMode();
                }
              },
            },
          },
        ];
        break;

      case "commit":
        keymapConfig = [
          {
            sequence: [key("y")],
            description: "Yes",
            command: {
              name: "yes",
              handler: findMode,
            },
          },
          {
            sequence: [key("n")],
            description: "No",
            command: {
              name: "no",
              handler: () => {},
            },
          },
        ];
        break;
    }

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [mode]); // the keymapping side effects depend on the mode state variable; useEffect will run every render without mode defined in the useEffect deps array

  // Update the search string with freeform text when we are in find mode
  useInput(
    (input, key) => {
      if (input != "" && !key.return) filterBySearchString(input);
    },
    { isActive: mode === "find" },
  );

  return (
    <Box flexDirection="column">
      <Text>mode: {mode}</Text>
      {getItems().map((i: Item) => (
        <Box key={i.id} paddingLeft={2}>
          <Text>
            {i.highlighted && mode === "select" ? "> " : "  "}
            {i.selected ? "* " : "  "}
            {i.display}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

export default SelectionList;
