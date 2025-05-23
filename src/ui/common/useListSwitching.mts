import { useState, useCallback } from "react";
import { ListItem, List } from "./CoreList";

const useListSwitching = (lists: Array<List>) => {
  const [currentListIndex, setCurrentListIndex] = useState(0);

  const switchList = useCallback(
    (index: number) => {
      if (index >= 0 && index < lists.length) {
        setCurrentListIndex(index);
      }
    },
    [lists.length],
  );

  const resetList = useCallback(() => {
    setCurrentListIndex(0);
  }, []);

  return {
    currentListIndex,
    currentListItems: lists[currentListIndex]?.items || [],
    switchList,
    resetList,
  };
};

export default useListSwitching;
