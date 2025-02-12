import { useState } from "react";

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

  const toggleSelectionByIndex = (index: number): void => {
    if (index >= 0 && index < items.length) {
      const updatedItems = items.map((item, i) => {
        if (i === index) {
          return { ...item, selected: !item.selected };
        }
        return item;
      });
      setItems(updatedItems);
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
        selected: false,
      }));

    setSearchString(newSearchString);
    setItems(filteredItems);
    setHighlightedIndex(0);
  };

  const clearSearchString = (): void => {
    setSearchString("");
    setItems(initialItems);
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
        selected: false,
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
    return items.filter((item) => item.selected);
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
