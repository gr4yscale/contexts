import React, { useCallback, useEffect } from "react";
import { Box, Text } from "ink";
import { useInput } from "ink";
import { Item } from "../../types.mts";
import { useFilter } from "./useFilter.mts";
import { usePagination } from "./usePagination.mts";

interface BaseListProps {
  items: Item[];
  pageSize: number;
  onSelect?: (item: Item) => void;
}

const BaseList: React.FC<BaseListProps> = ({ items, pageSize, onSelect }) => {
  // Apply filtering hook
  const { filterMode, filterText, filteredItems, handleFilterKey } = useFilter({
    items,
  });

  // Apply pagination hook to filtered items
  const { currentPage, totalPages, currentItems, handlePaginationKey } =
    usePagination({
      items: filteredItems,
      pageSize,
    });

  // Handle keyboard input
  useInput((input, key) => {
    // First check if filter is handling the key
    if (handleFilterKey(input)) {
      return;
    }

    // Then check if pagination is handling the key
    if (handlePaginationKey(input)) {
      return;
    }

    // Handle selection (Enter key)
    if (key.return && currentItems.length > 0 && onSelect) {
      onSelect(currentItems[0]);
    }
  });

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
            <Text>{item.display}</Text>
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
