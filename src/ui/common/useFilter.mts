import { useState, useEffect, useCallback } from "react";
import { Item } from "../../types.mts";

interface UseFilterOptions {
  items: Item[];
  initialFilter?: string;
}

export function useFilter({ items, initialFilter = "" }: UseFilterOptions) {
  const [filterMode, setFilterMode] = useState(false);
  const [filterText, setFilterText] = useState(initialFilter);
  const [filteredItems, setFilteredItems] = useState<Item[]>(items);

  // Apply filter to items
  useEffect(() => {
    if (filterText === "") {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item) =>
        item.display.toLowerCase().includes(filterText.toLowerCase()),
      );
      setFilteredItems(filtered);
    }
  }, [items, filterText]);

  // Handle key input for filtering
  const handleFilterKey = useCallback(
    (key: string) => {
      if (!filterMode) {
        if (key === "/") {
          setFilterMode(true);
          return true;
        }
        return false;
      }

      // In filter mode
      if (key === "escape") {
        setFilterMode(false);
        return true;
      } else if (key === "backspace") {
        setFilterText((prev) => prev.slice(0, -1));
        return true;
      } else if (key.length === 1) {
        setFilterText((prev) => prev + key);
        return true;
      }

      return false;
    },
    [filterMode],
  );

  const resetFilter = useCallback(() => {
    setFilterText("");
    setFilterMode(false);
  }, []);

  return {
    filterMode,
    filterText,
    filteredItems,
    handleFilterKey,
    resetFilter,
  };
}
