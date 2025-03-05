import { useState } from "react";

export type Item = {
  id: string;
  display: string;
  data: any;
  highlighted?: boolean;
  // action keymap?
};

export type Modes = "find" | "select" | "act";

type Props<T> = {
  initialItems: T[];
};

type Return<T> = {
  // state
  items: T[];
  mode: string;
  getItems: () => T[]; // hack; highlighted state
  highlightedItem: () => Item | undefined;
  // search
  searchString: string;
  filterBySearchString: (searchString: string) => void;
  clearSearchString: () => void;
  trimLastCharacter: () => void;
  // navigation
  highlightDown: () => void;
  highlightUp: () => void;
  // modes                   // TOFIX: hack
  findMode: () => void;
  selectMode: () => void;
  actMode: () => void;
};

const useActionList = <T extends Item>({
  initialItems,
}: Props<T>): Return<T> => {
  const [mode, setMode] = useState<Modes>("select");
  const [items, setItems] = useState<T[]>(initialItems);
  const [searchString, setSearchString] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

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

  const highlightedItem = () => {
    if (items.length === 0) return;
    return items[highlightedIndex];
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

  return {
    items,
    mode,
    highlightedItem,
    getItems,
    searchString,
    filterBySearchString,
    clearSearchString,
    highlightDown,
    highlightUp,
    findMode,
    selectMode,
    actMode,
    trimLastCharacter,
  };
};

export default useActionList;
