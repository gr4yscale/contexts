import { useState, useCallback } from "react";
import { ListItem, List } from "./CoreList";

const useListSwitching = (lists: Array<List>) => {
  const [currentListIndex, setCurrentListIndex] = useState(0);

  const switchListByIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < lists.length) {
        setCurrentListIndex(index);
      }
    },
    [lists.length],
  );

  const switchListById = useCallback(
    (id: string) => {
      const index = lists.findIndex((list) => list.id === id);
      if (index !== -1) {
        setCurrentListIndex(index);
      }
    },
    [lists],
  );

  const resetList = useCallback(() => {
    setCurrentListIndex(0);
  }, []);

  return {
    currentListIndex,
    currentListItems: lists[currentListIndex]?.items || [],
    switchListByIndex,
    switchListById,
    resetList,
  };
};

export default useListSwitching;
