import { useState, useCallback, useMemo } from "react";
import { Item } from "./useHotkeySelection.mts";

interface UseSelectionStateOptions<T extends Item> {
  items: T[];
  multiple?: boolean;
  immediate?: boolean;
  onSelected?: (selectedItems: T[]) => void;
}

interface UseSelectionStateReturn<T extends Item> {
  selectedIds: Set<string>;
  toggleSelection: (itemId: string) => void;
  isSelected: (itemId: string) => boolean;
  completeSelection: () => void;
  clearSelection: () => void;
  selectedItems: T[];
}

/**
 * Hook to manage selection state for items
 * Supports single or multiple selection
 */
export default function useSelectionState<T extends Item>({
  items,
  multiple = false,
  immediate = true,
  onSelected,
}: UseSelectionStateOptions<T>): UseSelectionStateReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toggle selection of an item
  const toggleSelection = useCallback(
    (itemId: string) => {
      setSelectedIds((prevSelectedIds) => {
        const newSelectedIds = new Set(prevSelectedIds);
        
        if (newSelectedIds.has(itemId)) {
          newSelectedIds.delete(itemId);
        } else {
          // If not in multiple selection mode, clear previous selections
          if (!multiple) {
            newSelectedIds.clear();
          }
          newSelectedIds.add(itemId);
        }
        
        // If immediate and not in multiple selection mode, trigger onSelected
        if (immediate && !multiple && onSelected) {
          const selectedItems = items.filter(item => 
            newSelectedIds.has(item.id)
          );
          onSelected(selectedItems);
        }
        
        return newSelectedIds;
      });
    },
    [items, multiple, immediate, onSelected]
  );

  // Check if an item is selected
  const isSelected = useCallback(
    (itemId: string) => {
      return selectedIds.has(itemId);
    },
    [selectedIds]
  );

  // Complete the selection process (for multiple selection)
  const completeSelection = useCallback(() => {
    if (onSelected && selectedIds.size > 0) {
      const selectedItems = items.filter(item => 
        selectedIds.has(item.id)
      );
      onSelected(selectedItems);
    }
  }, [items, selectedIds, onSelected]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Get the currently selected items
  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.has(item.id));
  }, [items, selectedIds]);

  return {
    selectedIds,
    toggleSelection,
    isSelected,
    completeSelection,
    clearSelection,
    selectedItems,
  };
}
