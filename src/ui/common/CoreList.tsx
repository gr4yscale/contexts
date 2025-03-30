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

export type ListItem = {
  id: string;
  display: string;
  selected?: boolean;
  [key: string]: any;
};

export type List = {
  id: string;
  display: string;
  items: Array<ListItem>;
};

interface CoreListProps {
  lists?: Array<List>;
  multiple?: boolean;
  onSelected?: (selectedItems: any[]) => void;
  initialMode?: Modes;
}

const ITEMS_PER_PAGE = 10;
const specialKeys = ["\\", "[", "]", "{", "}"];

const CoreList: React.FC<CoreListProps> = ({
  lists = [
    { display: "Test List", items: [{ id: "test", display: "Test Item" }] },
  ],
  multiple = false,
  onSelected,
  initialMode = "search",
}) => {
  const [mode, setMode] = useState<Modes>(initialMode);

  // list switching
  const { currentListItems, currentListIndex, switchList } =
    useListSwitching(lists);

  // search
  const {
    searchString,
    filteredItems,
    appendToSearch,
    clearSearch,
    trimLastCharacter,
  } = useSearch(currentListItems);

  // paging
  const itemsToPage =
    searchString.length > 0 ? filteredItems : currentListItems;

  const { currentPage, totalPages, paginatedItems, nextPage, prevPage } =
    usePaging(itemsToPage, ITEMS_PER_PAGE);

  // selection state
  const {
    selectedIds,
    toggleSelection,
    isSelected,
    completeSelection,
    clearSelection,
    selectedItems,
  } = useSelectionState({
    items: currentListItems,
    multiple,
    onSelected,
  });

  // hotkey selection
  const { getItemHotkey, handleKeyPress, currentSequence, clearSequence } =
    useHotkeySelection({
      items: paginatedItems,
      onHotkeySelected: (item) => {
        if (multiple) {
          toggleSelection(item.id);
        } else {
          onSelected && onSelected([item]);
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
            sequence: [key("", "backspace")],
            description: "Trim last character",
            name: "trimLast",
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
            handler: completeSelection,
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
    <Box
      flexDirection="column"
      width="100%"
      borderStyle="single"
      borderColor="gray"
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={0}
    >
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
      <Box marginTop={1}>
        <Box flexDirection="column" width="100%">
          <Box>
            <Text color="blue">
              {`List ${currentListIndex + 1} of ${lists.length}`}
            </Text>
            <Text> | </Text>
            <Text color="blue">List: {lists[currentListIndex]?.display}</Text>
            <Text> | </Text>
            <Text color="blue">Mode: {mode}</Text>
            {totalPages > 1 && (
              <>
                <Text> | </Text>
                <Text color="blue">
                  Page: {currentPage + 1}/{totalPages}
                </Text>
              </>
            )}
            {selectedIds.length > 0 && (
              <>
                <Text> | </Text>
                <Text color="blue">
                  Selected: {selectedIds.length} item
                  {selectedIds.length !== 1 ? "s" : ""}
                </Text>
              </>
            )}
            {searchString && (
              <>
                <Text> | </Text>
                <Text color="blue">{`(filtered: "${searchString}")`}</Text>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CoreList;
