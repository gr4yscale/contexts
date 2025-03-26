import React, { useState, useEffect, useContext } from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";
import { Item } from "../../types.mts";
import { useFilter } from "./useFilter.mts";
import { usePagination } from "./usePagination.mts";
import { KeymapConfig, key } from "./Keymapping.mts";
import { KeysContext } from "./Context.mts";

interface BaseListProps {
  items: Item[];
  pageSize: number;
  onSelect?: (item: Item) => void;
}

const BaseList: React.FC<BaseListProps> = ({ items, pageSize, onSelect }) => {

  // Apply filtering hook
  const { filterMode, filterText, filteredItems, handleFilterKey, resetFilter } = useFilter({
    items,
  });

  // Apply pagination hook to filtered items
  const { currentPage, totalPages, currentItems, nextPage, prevPage } =
    usePagination({
      items: filteredItems,
      pageSize,
    });

  const { keymap } = useContext(KeysContext);

  // Set up keymapping for navigation and selection
  useEffect(() => {
    const keymapConfig: KeymapConfig = [
      {
        sequence: [key("[")],
        description: "Previous page",
        name: "prevPage",
        handler: () => {
          prevPage();
          setSelectedIndex(0);
        },
      },
      {
        sequence: [key("]")],
        description: "Next page",
        name: "nextPage",
        handler: () => {
          nextPage();
          setSelectedIndex(0);
        },
      },
      {
        sequence: [key("", "upArrow")],
        description: "Move up",
        name: "moveUp",
        handler: () => {
          setSelectedIndex(prev => Math.max(0, prev - 1));
        },
      },
      {
        sequence: [key("", "downArrow")],
        description: "Move down",
        name: "moveDown",
        handler: () => {
          setSelectedIndex(prev => Math.min(currentItems.length - 1, prev + 1));
        },
      },
      {
        sequence: [key("\r", "return")],
        description: "Select item",
        name: "selectItem",
        handler: () => {
          if (currentItems.length > 0 && onSelect) {
            onSelect(currentItems[selectedIndex]);
          }
        },
      },
      {
        sequence: [key("/")],
        description: "Filter",
        name: "filter",
        handler: () => {
          handleFilterKey("/", {});
          setSelectedIndex(0);
        },
      },
    ];

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [currentItems, selectedIndex, onSelect, nextPage, prevPage]);

  // Only use useInput for filter mode
  useInput(
    (input, key) => {
      if (filterMode) {
        if (handleFilterKey(input, key)) {
          setSelectedIndex(0);
        }
      }
    },
    { isActive: filterMode }
  );
  // Render empty state
  if (filteredItems.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>No items</Text>
        {filterMode && (
          <Text>
            Filter: <Text color="yellow">{filterText}</Text>
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Filter indicator */}
      {filterMode && (
        <Box marginBottom={1}>
          <Text>
            Filter: <Text color="yellow">{filterText}</Text>
          </Text>
        </Box>
      )}

      {/* Items list */}
      <Box flexDirection="column">
        {currentItems.map((item, index) => (
          <Box key={item.id}>
            <Text color={index === selectedIndex ? "green" : undefined}>
              {item.display}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Pagination info */}
      <Box marginTop={1}>
        <Text>
          Page {currentPage} of {totalPages}
        </Text>
      </Box>
    </Box>
  );
};

export default BaseList;
