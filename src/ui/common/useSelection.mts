import { useState, useCallback } from "react";

interface UseSelectionOptions {
  multiSelect?: boolean;
}

/**
 * Custom hook to manage selection state for a list of items
 *
 * @param options Configuration options for selection behavior
 * @returns Selection state and methods to manipulate it
 */
const useSelection = (options: UseSelectionOptions = {}) => {
  const { multiSelect = false } = options;

  // Set of selected item IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /**
   * Toggle selection state of an item by its ID
   *
   * @param id The ID of the item to toggle
   */
  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const newSelection = new Set(prev);

        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          // If not multiSelect, clear previous selections before adding new one
          if (!multiSelect) {
            newSelection.clear();
          }
          newSelection.add(id);
        }

        return newSelection;
      });
    },
    [multiSelect],
  );

  /**
   * Select a specific item by ID (replaces current selection in single select mode)
   *
   * @param id The ID of the item to select
   */
  const selectItem = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const newSelection = multiSelect ? new Set(prev) : new Set();
        newSelection.add(id);
        return newSelection;
      });
    },
    [multiSelect],
  );

  /**
   * Deselect a specific item by ID
   *
   * @param id The ID of the item to deselect
   */
  const deselectItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSelection = new Set(prev);
      newSelection.delete(id);
      return newSelection;
    });
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * Check if an item is selected
   *
   * @param id The ID of the item to check
   * @returns True if the item is selected
   */
  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.has(id);
    },
    [selectedIds],
  );

  /**
   * Get an array of all selected IDs
   */
  const getSelectedIds = useCallback(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);

  return {
    selectedIds,
    toggleSelection,
    selectItem,
    deselectItem,
    clearSelection,
    isSelected,
    getSelectedIds,
  };
};

export default useSelection;
