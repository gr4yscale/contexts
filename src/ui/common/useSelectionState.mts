import { useState, useCallback, useMemo, useEffect } from "react";

interface UseSelectionStateOptions<T> {
  items: T[];
  multiple?: boolean;
  onSelected?: (selectedItems: T[]) => void;
  onSelectionChange?: (selectedItems: T[]) => void;
  initialSelection?: string[];
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
  onSelectionChange,
  initialSelection = [],
}: UseSelectionStateOptions<T>): UseSelectionStateReturn<T> {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Initialize selection state based on initialSelection prop or items' selected property
  useEffect(() => {
    if (initialSelection.length > 0) {
      // Use the provided initialSelection
      setSelectedIds(initialSelection);
    } else if (multiple) {
      // Fall back to items' selected property
      const initialSelectedIds = items
        .filter((item) => item.selected)
        .map((item) => item.id);

      if (initialSelectedIds.length > 0) {
        setSelectedIds(initialSelectedIds);
      }
    }
  }, [items, multiple, initialSelection]);

  // Toggle selection of an item
  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        let newSelection: string[];
        
        // For single selection mode, replace the selection
        if (!multiple) {
          newSelection = prev.includes(id) ? [] : [id];
        } else {
          // For multiple selection mode, toggle the selection
          newSelection = prev.includes(id)
            ? prev.filter((selectedId) => selectedId !== id)
            : [...prev, id];
        }
        
        // Call onSelectionChange with the new selection
        if (onSelectionChange) {
          const selectedItems = items.filter((item) => newSelection.includes(item.id));
          onSelectionChange(selectedItems);
        }
        
        return newSelection;
      });
    },
    [multiple, items, onSelectionChange],
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
