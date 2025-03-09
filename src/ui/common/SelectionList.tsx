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
    highlightToIndex,
  } = useSelectionList<Item>({ initialItems });

  // paging
  const [currentPage, setCurrentPage] = React.useState(0);
  const itemsPerPage = 20;

  const nextPage = () => {
    const items = getItems();
    const maxPage = Math.ceil(items.length / itemsPerPage) - 1;
    if (currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
      // Reset highlight to first item on the new page
      const newPageStartIndex = (currentPage + 1) * itemsPerPage;
      highlightToIndex(newPageStartIndex);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      // Reset highlight to first item on the new page
      const newPageStartIndex = (currentPage - 1) * itemsPerPage;
      highlightToIndex(newPageStartIndex);
    }
  };

  const handleHighlightDown = () => {
    if (mode === "select") {
      const items = getItems();
      const currentPageStartIndex = currentPage * itemsPerPage;
      const currentPageEndIndex = Math.min(
        (currentPage + 1) * itemsPerPage - 1,
        items.length - 1,
      );

      // Get the current highlighted index from the items
      const currentHighlightedIndex = items.findIndex(
        (item) => item.highlighted,
      );

      if (currentHighlightedIndex >= currentPageEndIndex) {
        // If at the end of the page, go to the first item on the page
        highlightToIndex(currentPageStartIndex);
      } else {
        // Otherwise just move down
        highlightDown();
      }
    } else {
      highlightDown();
    }
  };

  const handleHighlightUp = () => {
    if (mode === "select") {
      const items = getItems();
      const currentPageStartIndex = currentPage * itemsPerPage;
      const currentPageEndIndex = Math.min(
        (currentPage + 1) * itemsPerPage - 1,
        items.length - 1,
      );

      // Get the current highlighted index from the items
      const currentHighlightedIndex = items.findIndex(
        (item) => item.highlighted,
      );

      if (currentHighlightedIndex <= currentPageStartIndex) {
        // If at the start of the page, go to the last item on the page
        highlightToIndex(currentPageEndIndex);
      } else {
        // Otherwise just move up
        highlightUp();
      }
    } else {
      highlightUp();
    }
  };

  const getCurrentPageItems = () => {
    const items = getItems();
    const startIndex = currentPage * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

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
            handler: handleHighlightDown,
          },
          {
            sequence: [key("k")],
            description: "Move up",
            name: "moveUp",
            handler: handleHighlightUp,
          },
          {
            sequence: [key(" ")],
            description: "Select items",
            name: "selectItems",
            handler: toggleSelectionAtHighlightedIndex,
          },
          {
            sequence: [key("", "delete")],
            description: "Back to find mode",
            name: "find mode",
            handler: findMode,
          },
          {
            sequence: [key("\r", "return")],
            description: "commit mode",
            name: "commit",
            handler: () => {
              commitMode();
            },
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
  }, [mode, toggleSelectionAtHighlightedIndex]); // the keymapping side effects depend on the mode state variable; useEffect will run every render without mode defined in the useEffect deps array

  useEffect(() => {
    setCurrentPage(0);
  }, [mode]);

  // Update the search string with freeform text when we are in find mode
  useInput(
    (input, key) => {
      if (input != "" && !key.return) {
        filterBySearchString(input);
        setCurrentPage(0);
      }
    },
    { isActive: mode === "find" },
  );

  return (
    <Box flexDirection="column">
      {mode === "select" && (
        <Box marginBottom={1}>
          <Text>
            Page {currentPage + 1} of{" "}
            {Math.ceil(getItems().length / itemsPerPage)}
          </Text>
        </Box>
      )}
      {(mode === "select"
        ? getCurrentPageItems()
        : getItems().slice(0, itemsPerPage)
      ).map((i: Item) => (
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
