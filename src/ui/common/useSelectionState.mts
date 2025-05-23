import { useState, useCallback, useMemo, useEffect } from "react";

interface UseSelectionStateOptions<T> {
  items: T[];
  multiple?: boolean;
  onSelected?: (selectedItems: T[]) => void;
}

interface UseSelectionStateReturn<T> {
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  isSelected: (id: string) => boolean;
  completeSelection: () => void;
  clearSelection: () => void;
  selectedItems: T[];
}

/**
 * Hook to manage selection state for a list of items
 * Supports single or multiple selection modes
 */
export default function useSelectionState<
  T extends { id: string; selected?: boolean },
>({
  items,
  multiple = false,
  onSelected,
}: UseSelectionStateOptions<T>): UseSelectionStateReturn<T> {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Initialize selection state based on items' selected property
  useEffect(() => {
    if (multiple) {
      const initialSelectedIds = items
        .filter((item) => item.selected)
        .map((item) => item.id);

      if (initialSelectedIds.length > 0) {
        setSelectedIds(initialSelectedIds);
      }
    }
  }, [items, multiple]);

  // Toggle selection of an item
  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        // For single selection mode, replace the selection
        if (!multiple) {
          return prev.includes(id) ? [] : [id];
        }

        // For multiple selection mode, toggle the selection
        return prev.includes(id)
          ? prev.filter((selectedId) => selectedId !== id)
          : [...prev, id];
      });
    },
    [multiple],
  );

  // Check if an item is selected
  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.includes(id);
    },
    [selectedIds],
  );

  // Complete the selection process for multiple selection
  const completeSelection = useCallback(() => {
    // *hack to get the latest selectedIds state*
    // we use the function form of `setSelectedIds`
    // this avoids the "state closure issue":
    // otherwise, this function is capturing the `selectedIds` state
    // at the time the function is created, not when it's called

    // useRef would perhaps be a better choice here...

    setSelectedIds((currentIds) => {
      if (onSelected && currentIds.length > 0) {
        // the selected items at the time completeSelection was called (see above)
        const selected = items.filter((item) => currentIds.includes(item.id));
        onSelected(selected);
        return currentIds;
      }
      return [];
    });
  }, [items, onSelected, multiple]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  return {
    selectedIds,
    toggleSelection,
    isSelected,
    completeSelection,
    clearSelection,
    selectedItems,
  };
}
