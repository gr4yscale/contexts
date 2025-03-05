import { useState, useEffect } from "react";

export type Item = {
  id: string;
  display: string;
  data: any;
  highlighted?: boolean;
  selected?: boolean;
};

export type Modes = "find" | "select" | "act" | "commit";

type Props<T> = {
  initialItems: T[];
};

type Return<T> = {
  // state
  items: T[];
  mode: string;
  getItems: () => T[]; // hack; highlighted state
  getSelectedItems: () => T[]; // merge this with ^^
  // search
  searchString: string;
  filterBySearchString: (searchString: string) => void;
  clearSearchString: () => void;
  trimLastCharacter: () => void;
  // selection
  highlightDown: () => void;
  highlightUp: () => void;
  toggleSelectionAtHighlightedIndex: () => void;
  // modes                   // TOFIX: hack
  findMode: () => void;
  selectMode: () => void;
  actMode: () => void;
  commitMode: () => void;
};

const useSelectionList = <T extends Item>({
  initialItems,
}: Props<T>): Return<T> => {
  const [mode, setMode] = useState<Modes>("find");
  const [items, setItems] = useState<T[]>(initialItems);
  const [searchString, setSearchString] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  // Track selection state separately using a Map with item IDs as keys
  // Initialize selection state from initialItems
  const [selectionState, setSelectionState] = useState<Map<string, boolean>>(
    new Map(initialItems.map((item) => [item.id, item.selected || false])),
  );

  // Update items to reflect current selection state whenever items change
  useEffect(() => {
    const updatedItems = items.map((item) => ({
      ...item,
      selected: selectionState.get(item.id) || false,
    }));

    if (JSON.stringify(updatedItems) !== JSON.stringify(items)) {
      setItems(updatedItems);
    }
  }, [selectionState]);

  const toggleSelectionByIndex = (index: number): void => {
    if (index >= 0 && index < items.length) {
      const item = items[index];
      const newSelectionState = new Map(selectionState);
      const currentSelected = selectionState.get(item.id) || false;
      newSelectionState.set(item.id, !currentSelected);
      setSelectionState(newSelectionState);
      // The useEffect will update the items array
    } else {
      throw new Error("Index out of bounds");
    }
  };

  const filterBySearchString = (nextString: string): void => {
    const newSearchString = searchString + nextString;

    const filteredItems = initialItems
      .filter((item: Item) =>
        item.display.toLowerCase().includes(newSearchString.toLowerCase()),
      )
      .map((item) => ({
        ...item,
        selected: selectionState.get(item.id) || false,
      }));

    setSearchString(newSearchString);
    setItems(filteredItems);
    setHighlightedIndex(0);
  };

  const clearSearchString = (): void => {
    setSearchString("");

    // Show all items with their current selection state
    const updatedItems = initialItems.map((item) => ({
      ...item,
      selected: selectionState.get(item.id) || false,
    }));

    setItems(updatedItems);
    setHighlightedIndex(0);
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
        selected: selectionState.get(item.id) || false,
      }));

    setItems(filteredItems);
  };

  const highlightDown = (): void => {
    if (items.length === 0) return;
    setHighlightedIndex((prev) =>
      prev === null || prev === items.length - 1 ? 0 : prev + 1,
    );
  };

  const highlightUp = (): void => {
    if (items.length === 0) return;
    setHighlightedIndex((prev) =>
      prev === null || prev === 0 ? items.length - 1 : prev - 1,
    );
  };

  const toggleSelectionAtHighlightedIndex = (): void => {
    toggleSelectionByIndex(highlightedIndex);
  };

  const getSelectedItems = (): T[] => {
    // Get all selected items from the full initialItems list based on selection state
    return initialItems
      .filter((item) => selectionState.get(item.id) === true)
      .map((item) => ({
        ...item,
        selected: true,
      })) as T[];
  };

  // TOFIX: hacks
  const getItems = (): T[] => {
    return items.map((item, index) => ({
      ...item,
      highlighted: index === highlightedIndex,
    })) as T[];
  };

  const findMode = (): void => {
    setMode("find");
    clearSearchString();
  };
  const selectMode = (): void => {
    setMode("select");
  };

  const actMode = (): void => {
    setMode("act");
  };

  const commitMode = (): void => {
    setItems(getSelectedItems());
    setMode("commit");
  };

  return {
    items,
    mode,
    searchString,
    filterBySearchString,
    clearSearchString,
    getItems,
    getSelectedItems,
    highlightDown,
    highlightUp,
    toggleSelectionAtHighlightedIndex,
    findMode,
    selectMode,
    actMode,
    commitMode,
    trimLastCharacter,
  };
};

export default useSelectionList;
