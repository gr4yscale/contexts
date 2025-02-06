import { useState } from "react";

type UseSelectableListProps<T> = {
  initialItems: T[];
};

type UseSelectableListReturn<T> = {
  items: T[];
  selectedIndices: Set<number>;
  searchString: string;
  highlightedIndex: number | null;
  selectByIndex: (index: number) => void;
  filterBySearchString: (
    searchString: string,
    matchFn: (item: T, searchString: string) => boolean,
  ) => void;
  clearSearchString: () => void;
  getSelectedItems: () => T[];
  highlightDown: () => void;
  highlightUp: () => void;
  selectAtHighlightedIndex: () => void;
};

function useSelectableList<T>({
  initialItems,
}: UseSelectableListProps<T>): UseSelectableListReturn<T> {
  const [items, setItems] = useState<T[]>(initialItems);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [searchString, setSearchString] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  // Select or deselect an item by index
  const selectByIndex = (index: number): void => {
    if (index >= 0 && index < items.length) {
      const newSelectedIndices = new Set(selectedIndices);
      if (newSelectedIndices.has(index)) {
        newSelectedIndices.delete(index);
      } else {
        newSelectedIndices.add(index);
      }
      setSelectedIndices(newSelectedIndices);
    } else {
      throw new Error("Index out of bounds");
    }
  };

  // Filter items by search string
  const filterBySearchString = (
    searchString: string,
    matchFn: (item: T, searchString: string) => boolean,
  ): void => {
    setSearchString(searchString);
    const filteredItems = initialItems.filter((item) =>
      matchFn(item, searchString),
    );
    setItems(filteredItems);
    setHighlightedIndex(null); // Reset highlight when filtering
  };

  // Clear the search string and reset the list
  const clearSearchString = (): void => {
    setSearchString("");
    setItems(initialItems);
    setHighlightedIndex(null); // Reset highlight when clearing
  };

  // Get the list of selected items
  const getSelectedItems = (): T[] => {
    return Array.from(selectedIndices).map((index) => items[index]) as T[];
  };

  // Move highlight down
  const highlightDown = (): void => {
    if (items.length === 0) return;
    setHighlightedIndex((prev) =>
      prev === null || prev === items.length - 1 ? 0 : prev + 1,
    );
  };

  // Move highlight up
  const highlightUp = (): void => {
    if (items.length === 0) return;
    setHighlightedIndex((prev) =>
      prev === null || prev === 0 ? items.length - 1 : prev - 1,
    );
  };

  // Select the item at the highlighted index
  const selectAtHighlightedIndex = (): void => {
    if (highlightedIndex !== null) {
      selectByIndex(highlightedIndex);
    }
  };

  return {
    items,
    selectedIndices,
    searchString,
    highlightedIndex,
    selectByIndex,
    filterBySearchString,
    clearSearchString,
    getSelectedItems,
    highlightDown,
    highlightUp,
    selectAtHighlightedIndex,
  };
}

export default useSelectableList;
