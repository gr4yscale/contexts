import { useState } from "react";

export type Item = {
  id: string;
  display: string;
  data: any;
  highlighted?: boolean;
  selected?: boolean;
};

type UseExampleProps<T> = {
  initialItems: T[];
};

type UseExampleReturn<T> = {
  // state
  items: T[];
  mode: string;
  selectedIndices: Set<number>;
  searchString: string;
  // search
  filterBySearchString: (searchString: string) => void;
  appendSearchString: (append: string) => void;
  clearSearchString: () => void;
  // selection
  selectByIndex: (index: number) => void;
  getItems: () => T[];
  getSelectedItems: () => T[];
  highlightDown: () => void;
  highlightUp: () => void;
  selectAtHighlightedIndex: () => void;
  // modes
  findMode: () => void;
  selectMode: () => void;
  commitMode: () => void;
  trimLastCharacter: () => void;
};

function useExample<T extends Item>({
  initialItems,
}: UseExampleProps<T>): UseExampleReturn<T> {
  const [items, setItems] = useState<T[]>(initialItems);
  const [mode, setMode] = useState<"find" | "select" | "commit">("find");

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

  // Get all items with their current states (selected and highlighted)
  const getItems = (): T[] => {
    return items.map((item, index) => ({
      ...item,
      highlighted: index === highlightedIndex,
      selected: selectedIndices.has(index)
    })) as T[];
  };

  // Filter items by search string
  const filterBySearchString = (
    nextString: string): void => {
    setSearchString(searchString + nextString);

    const filteredItems = initialItems.filter((item: Item) => item.display.toLowerCase().includes(searchString.toLowerCase()))
    setItems(filteredItems);
    setHighlightedIndex(null); // Reset highlight when filtering
  };

  // Clear the search string and reset the list
  const clearSearchString = (): void => {
    setSearchString("");
    setItems(initialItems);
    setHighlightedIndex(null); // Reset highlight when clearing
  };

  // Move highlight down
  const highlightDown = (): void => {
    if (items.length === 0) return;
    setHighlightedIndex((prev) =>
      prev === null || prev === items.length - 1 ? 0 : prev + 1
    );
  };

  // Move highlight up
  const highlightUp = (): void => {
    if (items.length === 0) return;
    setHighlightedIndex((prev) =>
      prev === null || prev === 0 ? items.length - 1 : prev - 1
    );
  };

  // Select the item at the highlighted index
  const selectAtHighlightedIndex = (): void => {
    if (highlightedIndex !== null) {
      selectByIndex(highlightedIndex);
    }
  };

  // modes
  const findMode = (): void => {
    setMode("find");
  };
  const selectMode = (): void => {
    setMode("select");
  };
  // Get only the selected items
  const getSelectedItems = (): T[] => {
    return Array.from(selectedIndices)
      .map(index => items[index])
      .filter((item): item is T => item !== undefined);
  };

  const commitMode = (): void => {
    setMode("commit");
    console.log('changed to commit mode')
  };

  const trimLastCharacter = (): void => {
    setSearchString(searchString.slice(0, -1));
    const filteredItems = initialItems.filter((item: Item) => 
      item.display.toLowerCase().includes(searchString.slice(0, -1).toLowerCase())
    );
    setItems(filteredItems);
  };

  const appendSearchString = (append: string): void => {
    setSearchString(searchString + append);
  };

  return {
    items,
    mode,
    selectedIndices,
    searchString,
    filterBySearchString,
    appendSearchString,
    selectByIndex,
    clearSearchString,
    getItems,
    getSelectedItems,
    highlightDown,
    highlightUp,
    selectAtHighlightedIndex,
    findMode,
    selectMode,
    commitMode,
    trimLastCharacter,
  };
}

export default useExample;
