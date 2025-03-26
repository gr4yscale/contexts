import React, { useEffect, useContext, useState } from "react";
import { Text, Box, useInput } from "ink";
import { KeymapConfig, key } from "./Keymapping.mts";
import { KeysContext } from "./Context.mts";
import useListSwitching from "./useListSwitching.mts";
import useSearch from "./useSearch.mts";

export type Modes = "search" | "select";

interface CoreListProps {
  lists?: Array<Array<any>>;
}

const specialKeys = ["\\", "[", "]", "{", "}"];

const CoreList: React.FC<CoreListProps> = ({
  lists = [[{ id: "test", display: "Test Item" }]],
}) => {
  const { keymap } = useContext(KeysContext);

  const [mode, setMode] = useState<Modes>("search");
  const { currentList, currentListIndex, switchList } = useListSwitching(lists);
  const {
    searchString,
    filteredItems,
    appendToSearch,
    clearSearch,
    trimLastCharacter,
  } = useSearch(currentList);

  // The list to display is either filtered (in search mode) or the current list (in select mode)
  const displayList =
    mode === "search" && searchString ? filteredItems : currentList;

  // shared keymap, persists regardless of mode
  useEffect(() => {
    keymap.pushKeymap([]);

    return () => {
      keymap.popKeymap();
    };
  }, []);

  // mode-specific keymap
  useEffect(() => {
    let keymapConfig: KeymapConfig = [];

    switch (mode) {
      case "search":
        keymapConfig = [
          {
            sequence: [key("\r", "return")],
            description: "Select mode",
            name: "mode-select",
            handler: () => {
              setMode("select");
            },
            hidden: true,
          },
          {
            sequence: [key("", "delete")],
            description: "Clear search string",
            name: "clearSearch",
            handler: clearSearch,
            hidden: true,
          },
          {
            sequence: [key("\b", "backspace")],
            description: "Trim last character",
            name: "trimLast",
            handler: trimLastCharacter,
            hidden: true,
          },
          // Keep pageUp for backward compatibility with tests
          {
            sequence: [key("", "pageUp")],
            description: "Trim last character",
            name: "trimLastPageUp",
            handler: trimLastCharacter,
            hidden: true,
          },
          {
            sequence: [key("[")],
            description: "Previous page",
            name: "prevPage",
            handler: () => {},
          },
          {
            sequence: [key("]")],
            description: "Next page",
            name: "nextPage",
            handler: () => {},
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
          {
            sequence: [key("\\")],
            description: "Toggle mode",
            name: "toggleMode",
            handler: () => {
              setMode("select");
            },
          },
        ];
        break;

      case "select":
        keymapConfig = [
          {
            sequence: [key("j")],
            description: "Move down",
            name: "moveDown",
            handler: () => {},
            //handler: handleHighlightDown,
          },
          {
            sequence: [key("k")],
            description: "Move up",
            name: "moveUp",
            handler: () => {},
            //handler: handleHighlightUp,
          },
          {
            sequence: [key(" ")],
            description: "Select items",
            name: "selectItems",
            handler: () => {},
            //handler: toggleSelectionAtHighlightedIndex,
            hidden: true,
          },
          {
            sequence: [key("", "delete")],
            description: "Back to search mode",
            name: "search mode",
            handler: () => {
              setMode("search");
            },
            hidden: true,
          },
          {
            sequence: [key("\r", "return")],
            description: "commit / select",
            name: "commit/select",
            handler: () => {},
            hidden: true,
          },
          {
            sequence: [key("[")],
            description: "Previous page",
            name: "prevPage",
            handler: () => {
              console.log("Executing prevPage handler");
            },
          },
          {
            sequence: [key("]")],
            description: "Next page",
            name: "nextPage",
            handler: () => {
              console.log("Executing nextPage handler");
            },
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
          {
            sequence: [key("\\")],
            description: "Toggle mode",
            name: "toggleMode",
            handler: () => {
              setMode("search");
            },
          },
        ];
        break;
    }

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [mode]);

  // Handle character input in search mode
  useInput(
    (input, key) => {
      if (!key.return && input !== "" && !specialKeys.includes(input)) {
        appendToSearch(input);
      }
    },
    { isActive: mode === "search" },
  );

  return (
    <Box flexDirection="column" width="100%" padding={1}>
      <Box>
        <Text color="gray" backgroundColor="black">
          List {currentListIndex + 1} of {lists.length} - {displayList.length}{" "}
          items {searchString ? `(filtered: "${searchString}")` : ""}
        </Text>
      </Box>
      <Box>
        {displayList.map((item, index) => (
          <Text key={index}>
            {item.display || item.id || JSON.stringify(item)}
          </Text>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text color="blue" backgroundColor="black">
          Mode: {mode}
        </Text>
      </Box>
    </Box>
  );
};

export default CoreList;
