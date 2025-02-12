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
  actMode: () => void;
  commitMode: () => void;
  trimLastCharacter: () => void;
};

function useExample<T extends Item>({
  initialItems,
}: UseExampleProps<T>): UseExampleReturn<T> {
  const [items, setItems] = useState<T[]>(
    initialItems.map((item) => ({ ...item, selected: false })),
  );
  const [mode, setMode] = useState<"find" | "select" | "act" | "commit">(
    "find",
  );

  const [searchString, setSearchString] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  // Select or deselect an item by index
  const selectByIndex = (index: number): void => {
    if (index >= 0 && index < items.length) {
      const updatedItems = items.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            selected: !item.selected,
          };
        }
        return item;
      });
      setItems(updatedItems);
    } else {
      throw new Error("Index out of bounds");
    }
  };

  // Get all items with their current states (selected and highlighted)
  const getItems = (): T[] => {
    return items.map((item, index) => ({
      ...item,
      highlighted: index === highlightedIndex,
    })) as T[];
  };

  // Filter items by search string
  const filterBySearchString = (nextString: string): void => {
    const newSearchString = searchString + nextString;

    const filteredItems = initialItems
      .filter((item: Item) =>
        item.display.toLowerCase().includes(newSearchString.toLowerCase()),
      )
      .map((item) => ({
        ...item,
        selected: false,
      }));

    setSearchString(newSearchString);
    setItems(filteredItems);
    setHighlightedIndex(0); // Reset highlight when filtering
  };

  // Clear the search string and reset the list
  const clearSearchString = (): void => {
    setSearchString("");
    setItems(initialItems.map((item) => ({ ...item, selected: false })));
    setHighlightedIndex(0); // Reset highlight when clearing
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
    selectByIndex(highlightedIndex);
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
    return items.filter((item) => item.selected);
  };

  const actMode = (): void => {
    setMode("act");
  };

  const commitMode = (): void => {
    setMode("commit");
  };

  const trimLastCharacter = (): void => {
    const newSearchString = searchString.slice(0, -1);
    setSearchString(newSearchString);

    const filteredItems = initialItems
      .filter((item: Item) =>
        item.display.toLowerCase().includes(newSearchString.toLowerCase()),
      )
      .map((item) => ({
        ...item,
        selected: false,
      }));

    setItems(filteredItems);
  };

  const appendSearchString = (append: string): void => {
    setSearchString(searchString + append);
  };

  return {
    items,
    mode,
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
    actMode,
    commitMode,
    trimLastCharacter,
  };
}

export default useExample;
