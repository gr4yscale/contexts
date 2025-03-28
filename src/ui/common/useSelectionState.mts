import { useState, useCallback, useMemo } from "react";

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
export default function useSelectionState<T extends { id: string }>({
  items,
  multiple = false,
  onSelected,
}: UseSelectionStateOptions<T>): UseSelectionStateReturn<T> {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  // Complete the selection process (for multiple selection)
  const completeSelection = useCallback(() => {
    // Capture the current state to avoid race conditions
    const currentIds = [...selectedIds];

    console.log("captureSelection:");
    console.log(currentIds);

    if (onSelected && currentIds.length > 0) {
      console.log("in");

      // Get the selected items at the moment of completion
      const currentSelectedItems = items.filter((item) =>
        currentIds.includes(item.id),
      );

      // Call onSelected with the current selection
      onSelected(currentSelectedItems);

      // If not in multiple selection mode, clear the selection after completion
      if (!multiple) {
        setSelectedIds([]);
      }
    }
  }, [selectedIds, items, onSelected, multiple]);

  // Clear the current selection
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Get the currently selected items
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
