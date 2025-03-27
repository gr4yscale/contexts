import { useState, useCallback, useMemo, useEffect } from "react";

export type Item = {
  id: string;
  display: string;
  data: any;
  highlighted?: boolean;
  // action keymap?
};

interface UseHotkeySelectionOptions<T extends Item> {
  items: T[];
  onHotkeySelected: (item: T) => void;
  keys?: string;
  maxSequenceLength?: number;
}

interface UseHotkeySelectionReturn {
  getItemHotkey: (itemId: string) => string;
  handleKeyPress: (key: string) => void;
  currentSequence: string;
  clearSequence: () => void;
}

/**
 * Hook to manage hotkey selection of items using short key sequences
 * This hook doesn't manage selection state, it only generates key sequences
 * and calls a callback when a key sequence matches an item
 */
export default function useHotkeySelection<T extends Item>({
  items,
  onHotkeySelected,
  keys = "asdfghjkl;",
  maxSequenceLength = 3,
}: UseHotkeySelectionOptions<T>): UseHotkeySelectionReturn {
  const [currentSequence, setCurrentSequence] = useState<string>("");

  // Generate key sequences for each item
  const itemHotkeys = useMemo(() => {
    const hotkeys: Record<string, string> = {};
    const availableKeys = keys.split("");

    // For lists with fewer than availableKeys.length items, use single character sequences
    if (items.length <= availableKeys.length) {
      items.forEach((item, index) => {
        hotkeys[item.id] = availableKeys[index];
      });
      return hotkeys;
    }

    // For larger lists, use two or three character sequences
    const firstLevelSize = Math.ceil(Math.sqrt(items.length));

    items.forEach((item, index) => {
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

        hotkeys[item.id] =
          availableKeys[firstKeyIdx] +
          availableKeys[secondKeyIdx] +
          availableKeys[thirdKeyIdx];
      } else {
        // Two characters are sufficient
        hotkeys[item.id] =
          availableKeys[firstKeyIndex] + availableKeys[secondKeyIndex];
      }
    });

    return hotkeys;
  }, [items, keys]);

  // Check if the current sequence matches any item
  useEffect(() => {
    if (currentSequence === "") return;

    // Find items that exactly match the current sequence
    const exactMatch = items.find(
      (item) => itemHotkeys[item.id] === currentSequence,
    );

    if (exactMatch) {
      onHotkeySelected(exactMatch);
      setCurrentSequence("");
    } else {
      // Check if there are any potential matches (items whose hotkeys start with the current sequence)
      const potentialMatches = items.filter((item) =>
        itemHotkeys[item.id].startsWith(currentSequence),
      );

      // If there are no potential matches, clear the sequence
      if (potentialMatches.length === 0) {
        setCurrentSequence("");
      }
    }
  }, [currentSequence, items, itemHotkeys, onHotkeySelected]);

  // Handle key press
  const handleKeyPress = useCallback(
    (key: string) => {
      if (!keys.includes(key)) return;

      setCurrentSequence((prev) => {
        // Don't exceed max sequence length
        if (prev.length >= maxSequenceLength) return prev;
        return prev + key;
      });
    },
    [keys, maxSequenceLength],
  );

  // Get the hotkey for a specific item
  const getItemHotkey = useCallback(
    (itemId: string) => {
      return itemHotkeys[itemId] || "";
    },
    [itemHotkeys],
  );

  // Clear the current sequence
  const clearSequence = useCallback(() => {
    setCurrentSequence("");
  }, []);

  return {
    getItemHotkey,
    handleKeyPress,
    currentSequence,
    clearSequence,
  };
}
