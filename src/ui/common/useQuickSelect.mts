import { useState, useCallback, useMemo } from "react";
import { Item } from "./useActionList.mts";

interface UseQuickSelectOptions<T extends Item> {
  initialItems: T[];
  keys?: string;
  maxSequenceLength?: number;
}

interface UseQuickSelectReturn<T extends Item> {
  items: T[];
  currentSequence: string;
  appendToSequence: (key: string) => void;
  clearSequence: () => void;
  getSelectedItem: () => T | null;
  getItemSequence: (item: T) => string;
  isComplete: boolean;
}

/**
 * Hook to manage quick selection of items using short key sequences
 */
export default function useQuickSelect<T extends Item>({
  initialItems,
  keys = "asdfghjkl;",
  maxSequenceLength = 3,
}: UseQuickSelectOptions<T>): UseQuickSelectReturn<T> {
  const [currentSequence, setCurrentSequence] = useState<string>("");
  const [isComplete, setIsComplete] = useState<boolean>(false);

  // Generate key sequences for each item
  const itemSequences = useMemo(() => {
    const sequences: Record<string, string> = {};
    const availableKeys = keys.split("");

    // For lists with fewer than availableKeys.length items, use single character sequences
    if (initialItems.length <= availableKeys.length) {
      initialItems.forEach((item, index) => {
        sequences[item.id] = availableKeys[index];
      });
      return sequences;
    }

    // For larger lists, use two or three character sequences
    const firstLevelSize = Math.ceil(Math.sqrt(initialItems.length));

    initialItems.forEach((item, index) => {
      const firstKeyIndex = Math.floor(index / firstLevelSize);
      const secondKeyIndex = index % firstLevelSize;

      if (
        firstKeyIndex >= availableKeys.length ||
        secondKeyIndex >= availableKeys.length
      ) {
        // Need three characters for this many items
        const thirdLevelSize = firstLevelSize;
        const firstKeyIdx = Math.floor(
          index / (thirdLevelSize * thirdLevelSize),
        );
        const secondKeyIdx = Math.floor(
          (index % (thirdLevelSize * thirdLevelSize)) / thirdLevelSize,
        );
        const thirdKeyIdx = index % thirdLevelSize;

        sequences[item.id] =
          availableKeys[firstKeyIdx] +
          availableKeys[secondKeyIdx] +
          availableKeys[thirdKeyIdx];
      } else {
        // Two characters are sufficient
        sequences[item.id] =
          availableKeys[firstKeyIndex] + availableKeys[secondKeyIndex];
      }
    });

    return sequences;
  }, [initialItems, keys]);

  // Filter items based on the current sequence
  const filteredItems = useMemo(() => {
    if (currentSequence === "") {
      return initialItems;
    }

    return initialItems.filter((item) => {
      const sequence = itemSequences[item.id];
      return sequence.startsWith(currentSequence);
    });
  }, [initialItems, currentSequence, itemSequences]);

  // Append a key to the current sequence
  const appendToSequence = useCallback(
    (key: string) => {
      if (!keys.includes(key)) return;

      setCurrentSequence((prev) => {
        const newSequence = prev + key;

        // Check if this sequence uniquely identifies an item
        const matchingItems = initialItems.filter((item) =>
          itemSequences[item.id].startsWith(newSequence),
        );

        if (matchingItems.length === 1) {
          setIsComplete(true);
        }

        return newSequence;
      });
    },
    [initialItems, itemSequences, keys],
  );

  // Clear the current sequence
  const clearSequence = useCallback(() => {
    setCurrentSequence("");
    setIsComplete(false);
  }, []);

  // Get the selected item if the sequence is complete
  const getSelectedItem = useCallback(() => {
    if (filteredItems.length === 1) {
      return filteredItems[0];
    }
    return null;
  }, [filteredItems]);

  // Get the sequence for a specific item
  const getItemSequence = useCallback(
    (item: T) => {
      return itemSequences[item.id] || "";
    },
    [itemSequences],
  );

  return {
    items: filteredItems,
    currentSequence,
    appendToSequence,
    clearSequence,
    getSelectedItem,
    getItemSequence,
    isComplete,
  };
}
