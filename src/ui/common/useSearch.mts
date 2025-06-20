import { useState, useCallback, useMemo } from "react";

type Item = {
  id: string;
  display?: string;
  data?: any;
  highlighted?: boolean;
  // action keymap?
};

const useSearch = <T extends Item>(items: T[]) => {
  const [searchString, setSearchString] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchString) return items;
    return items.filter((item) => {
      const displayText = item.display || item.id || JSON.stringify(item);
      return displayText.toLowerCase().includes(searchString.toLowerCase());
    });
  }, [items, searchString]);

  const clearSearch = useCallback(() => {
    setSearchString("");
  }, []);

  const appendToSearch = useCallback((char: string) => {
    setSearchString((prev) => prev + char);
  }, []);

  const trimLastCharacter = useCallback(() => {
    setSearchString((prev) => prev.slice(0, -1));
  }, []);

  return {
    searchString,
    filteredItems,
    setSearchString,
    clearSearch,
    appendToSearch,
    trimLastCharacter,
  };
};

export default useSearch;
