import React, { useEffect, useContext, useState } from "react";
import { Text, Box, useInput } from "ink";
import { KeymapConfig, key } from "./Keymapping.mts";
import { KeysContext } from "./Context.mts";
import useListSwitching from "./useListSwitching.mts";
import useSearch from "./useSearch.mts";
import usePaging from "./usePaging.mts";
import useHotkeySelection from "./useHotkeySelection.mts";
import useSelectionState from "./useSelectionState.mts";

export type Modes = "search" | "select";

interface CoreListProps {
  lists?: Array<Array<any>>;
  multiple?: boolean;
  immediate?: boolean;
  onSelected?: (selectedItems: any[]) => void;
}

const ITEMS_PER_PAGE = 10;
const specialKeys = ["\\", "[", "]", "{", "}"];

const CoreList: React.FC<CoreListProps> = ({
  lists = [[{ id: "test", display: "Test Item" }]],
  multiple = false,
  immediate = true,
  onSelected,
}) => {
  const [mode, setMode] = useState<Modes>("search");

  // list switching
  const { currentList, currentListIndex, switchList } = useListSwitching(lists);

  // search
  const {
    searchString,
    filteredItems,
    appendToSearch,
    clearSearch,
    trimLastCharacter,
  } = useSearch(currentList);

  // paging
  const itemsToPage = mode === "search" ? filteredItems : currentList;

  const { currentPage, totalPages, paginatedItems, nextPage, prevPage } =
    usePaging(mode === "search" ? filteredItems : currentList, ITEMS_PER_PAGE);

  // selection state
  const {
    selectedIds,
    toggleSelection,
    isSelected,
    completeSelection,
    clearSelection,
    selectedItems,
  } = useSelectionState({
    items: currentList,
    multiple,
    immediate,
    onSelected,
  });

  // hotkey selection
  const { getItemHotkey, handleKeyPress, currentSequence, clearSequence } =
    useHotkeySelection({
      items: paginatedItems,
      onHotkeySelected: (item) => {
        toggleSelection(item.id);
        if (!multiple) {
          completeSelection();
        }
      },
      keys: "asdfghjkl;",
    });

  // keymapping
  const { keymap } = useContext(KeysContext);

  // shared keymap
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
            hidden: true,
          },
          {
            sequence: [key("]")],
            description: "Next page",
            name: "nextPage",
            handler: () => {},
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
            handler: () => {
              completeSelection();
            },
            hidden: true,
          },
          {
            sequence: [key("[")],
            description: "Previous page",
            name: "prevPage",
            handler: prevPage,
          },
          {
            sequence: [key("]")],
            description: "Next page",
            name: "nextPage",
            handler: nextPage,
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

  // handle character input in search mode
  useInput(
    (input, key) => {
      if (!key.return && input !== "" && !specialKeys.includes(input)) {
        appendToSearch(input);
      }
    },
    { isActive: mode === "search" },
  );

  // handle hotkey input in select mode
  useInput(
    (input, key) => {
      if (!key.return && input !== "" && !specialKeys.includes(input)) {
        handleKeyPress(input);
      }
    },
    { isActive: mode === "select" },
  );

  return (
    <Box flexDirection="column" width="100%" padding={1}>
      <Box>
        <Text color="gray" backgroundColor="black">
          List {currentListIndex + 1} of {lists.length} - {itemsToPage.length}{" "}
          items {searchString ? `(filtered: "${searchString}")` : ""}
          {mode === "select" && totalPages > 1
            ? ` (Page ${currentPage + 1}/${totalPages})`
            : ""}
        </Text>
      </Box>
      <Box flexDirection="column">
        {paginatedItems.map((item, index) => (
          <Text key={index}>
            {mode === "select" && (
              <Text color="yellow">[{getItemHotkey(item.id)}] </Text>
            )}
            <Text
              color={isSelected(item.id) ? "green" : "white"}
              backgroundColor={isSelected(item.id) ? "blue" : undefined}
            >
              {item.display || item.id || JSON.stringify(item)}
            </Text>
            {isSelected(item.id) && multiple && <Text color="cyan"> ✓</Text>}
          </Text>
        ))}
      </Box>
      {mode === "select" && currentSequence && (
        <Box marginTop={1}>
          <Text color="green">Current sequence: {currentSequence}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color="blue" backgroundColor="black">
          Mode: {mode}
        </Text>
      </Box>
    </Box>
  );
};

export default CoreList;
