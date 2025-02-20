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

const SelectionList: React.FC<SelectionListProps> = ({
  initialItems,
  onSelected,
}) => {
  const {
    mode,
    getItems,
    getSelectedItems,
    findMode,
    selectMode,
    commitMode,
    filterBySearchString,
    trimLastCharacter,
    clearSearchString,
    toggleSelectionAtHighlightedIndex,
    highlightDown,
    highlightUp,
  } = useSelectionList<Item>({ initialItems });

  const { keymap }: any = useContext(KeysContext);

  // shared keymap, persists regardless of mode
  useEffect(() => {
    keymap.pushKeymap([
      {
        sequence: [key("", "rightArrow")],
        description: "Enter select mode",
        name: "selectMode",
        handler: selectMode,
      },
      {
        sequence: [key("", "leftArrow")],
        description: "Enter find mode",
        name: "findMode",
        handler: findMode,
      },
      {
        sequence: [key("", "upArrow")],
        description: "Enter commit mode",
        name: "commitMode",
        handler: commitMode,
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
          },
          {
            sequence: [key("", "delete")],
            description: "Clear search string",
            name: "clearSearch",
            handler: clearSearchString,
          },
          {
            sequence: [key("", "pageUp")],
            description: "Trim last character",
            name: "trimLast",
            handler: trimLastCharacter,
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
            sequence: [key(" ")],
            description: "Select items",
            name: "selectItems",
            handler: toggleSelectionAtHighlightedIndex,
          },
          {
            sequence: [key("\r", "return")],
            description: "commit mode",
            name: "commit",
            handler: () => {
              commitMode();
            },
          },
        ];
        break;

      case "commit":
        keymapConfig = [
          {
            sequence: [key("y")],
            description: "Yes",
            name: "yes",
            handler: () => {
              onSelected && onSelected(getSelectedItems());
              findMode();
              //TOFIX pop keymap?
            },
          },
          {
            sequence: [key("n")],
            description: "No",
            name: "no",
            handler: findMode, //TOFIX pop keymap?
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
