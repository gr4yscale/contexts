import React from "react";
import { render as inkRender } from "ink-testing-library";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BaseList from "./BaseList.tsx";
import { KeysContext } from "./Context.mts";
import { Keymap } from "./Keymapping.mts";

/**
 * BaseList Component
 *
 * A flexible list component that provides:
 * - Uses KeysContext for key handling (filter mode is an exception)
 * - Rendering of items with customizable page size
 * - Interactive filtering with real-time results
 * - Pagination with navigation controls
 * - Multiple Item selection with onItemsSelected callback
 * - Support for switching between multiple lists
 */

// Mock keymap for testing
// const mockKeymap = {
//   pushKeymap: vi.fn(),
//   popKeymap: vi.fn(),
//   handleKey: vi.fn(),
// };

const keymap = Keymap([]);

// Custom render function that provides KeysContext
const render = (ui: React.ReactNode) => {
  return inkRender(
    <KeysContext.Provider value={{ keymap: keymap }}>
      {ui}
    </KeysContext.Provider>,
  );
};

// Mock data for testing
const testItems = [
  { id: "1", display: "Item 1", data: { value: "one" } },
  { id: "2", display: "Item 2", data: { value: "two" } },
  { id: "3", display: "Item 3", data: { value: "three" } },
  { id: "4", display: "Item 4", data: { value: "four" } },
  { id: "5", display: "Item 5", data: { value: "five" } },
  { id: "6", display: "Item 6", data: { value: "six" } },
  { id: "7", display: "Item 7", data: { value: "seven" } },
  { id: "8", display: "Item 8", data: { value: "eight" } },
];

describe("BaseList", () => {
  describe("Basic Rendering", () => {
    it("renders a list of items", () => {
      const { lastFrame } = render(<BaseList items={testItems} pageSize={5} />);

      // Should show first 5 items
      expect(lastFrame()).toContain("Item 1");
      expect(lastFrame()).toContain("Item 5");
      expect(lastFrame()).not.toContain("Item 6");
    });

    it("handles empty items array", () => {
      const { lastFrame } = render(<BaseList items={[]} pageSize={5} />);

      expect(lastFrame()).toContain("No items");
    });
  });
});
