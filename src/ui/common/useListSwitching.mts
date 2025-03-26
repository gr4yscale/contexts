import { useState, useCallback } from "react";

export type Item = {
  id: string;
  display: string;
  data: any;
  highlighted?: boolean;
  // action keymap?
};

const useListSwitching = (lists: Item[][]) => {
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
    currentList: lists[currentListIndex] || [],
    switchList,
    resetList,
  };
};

export default useListSwitching;
