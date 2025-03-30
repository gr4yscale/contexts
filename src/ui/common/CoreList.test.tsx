import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import TestHarness from "./TestHarness.tsx";
import { Keymap, KeymapInstance } from "./Keymapping.mts";
import CoreList from "./CoreList.tsx";

let keymap: KeymapInstance;

const mockLists = [
  {
    id: "list1",
    display: "List 1",
    items: [
      { id: "list1-item1", display: "List 1 Item 1" },
      { id: "list1-item2", display: "List 1 Item 2" },
    ],
  },
  {
    id: "list2",
    display: "List 2",
    items: [
      { id: "list2-item1", display: "List 2 Item 1" },
      { id: "list2-item2", display: "List 2 Item 2" },
    ],
  },
  {
    id: "list3",
    display: "List 3",
    items: [{ id: "list3-item1", display: "List 3 Item 1" }],
  },
];

describe("CoreList", () => {
  beforeEach(() => {
    // replace the keymap for each test
    keymap = Keymap([]);
    vi.clearAllMocks();
  });
  describe("basic rendering", () => {
    it("renders initial state correctly", () => {
      const { lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList lists={mockLists} />
        </TestHarness>,
      );
      expect(lastFrame()).toContain("List 1 of 3");
    });
  });
  describe("modes", () => {
    it("has two modes: search and select", async () => {
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList lists={mockLists} />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Default mode should be search
      expect(lastFrame()).toContain("Mode: search");

      // Switch to select mode
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(lastFrame()).toContain("Mode: select");

      // Switch back to search mode
      stdin.write("\u007F"); // Delete key
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(lastFrame()).toContain("Mode: search");
    });
    it("toggles between modes with backslash key", async () => {
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList lists={mockLists} />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(lastFrame()).toContain("Mode: search");

      // Toggle to select mode with backslash
      stdin.write("\\");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(lastFrame()).toContain("Mode: select");

      // Toggle back to search mode with backslash
      stdin.write("\\");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(lastFrame()).toContain("Mode: search");
    });
    it("switches search -> select mode when Enter is pressed", async () => {
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(lastFrame()).toContain("Mode: search");

      // Press Enter to switch to select mode
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(lastFrame()).toContain("Mode: select");
    });
    it("switching search -> select mode should not replace the visible items from a previous search", async () => {
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList
            lists={[
              {
                id: "list1",
                display: "List 1",
                items: [
                  { id: "item1", display: "Test Item" },
                  { id: "item2", display: "Another Item" },
                  { id: "item3", display: "Something Else" },
                ],
              },
            ]}
          />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Type search string to filter items
      stdin.write("test");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify only "Test Item" is visible
      const searchFrame = lastFrame();
      expect(searchFrame).toContain('(filtered: "test")');
      expect(searchFrame).toContain("Test Item");
      expect(searchFrame).not.toContain("Another Item");
      expect(searchFrame).not.toContain("Something Else");

      // Switch to select mode
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify filtered items are still the same in select mode
      const selectFrame = lastFrame();
      expect(selectFrame).toContain("Mode: select");
      expect(selectFrame).toContain("Test Item");
      expect(selectFrame).not.toContain("Another Item");
      expect(selectFrame).not.toContain("Something Else");
    });
  });
  describe("multiple lists", () => {
    it("switches to previous list when '{' is pressed in select mode", async () => {
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList lists={mockLists} />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // First go to next list
      stdin.write("}");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(lastFrame()).toContain("List 2 of 3");

      // Switch to select mode
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Press '{' to switch to previous list
      stdin.write("{");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(lastFrame()).toContain("List 1 of 3");
    });

    it("switches to next list when '}' is pressed in select mode", async () => {
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList lists={mockLists} />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Switch to select mode
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Press '}' to switch to next list
      stdin.write("}");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(lastFrame()).toContain("List 2 of 3");
    });
  });
  describe("search", () => {
    it("clears search string when delete key is pressed", async () => {
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList
            lists={[
              {
                id: "list1",
                display: "List 1",
                items: [
                  { id: "item1", display: "Test Item" },
                  { id: "item2", display: "Another Item" },
                ],
              },
            ]}
          />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Type search string
      stdin.write("test");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(lastFrame()).toContain('(filtered: "test")');

      // Press delete key to clear search
      stdin.write("\u007F"); // Delete key (ASCII 127)
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Search should be cleared
      expect(lastFrame()).not.toContain('(filtered: "test")');
      expect(lastFrame()).toContain("Test Item");
      expect(lastFrame()).toContain("Another Item");
    });
    it("trims last character when backspace is pressed", async () => {
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList
            lists={[
              {
                id: "list1",
                display: "List 1",
                items: [
                  { id: "item1", display: "Test Item" },
                  { id: "item2", display: "Testing Item" },
                  { id: "item3", display: "Another Item" },
                ],
              },
            ]}
          />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Type search string
      stdin.write("testing");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(lastFrame()).toContain('(filtered: "testing")');
      expect(lastFrame()).toContain("Testing Item");
      expect(lastFrame()).not.toContain("Test Item");

      // Press backspace key to trim last character
      stdin.write("\b");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Search should now be "testin"
      expect(lastFrame()).toContain('(filtered: "testin")');
      expect(lastFrame()).toContain("Testing Item");
      expect(lastFrame()).not.toContain("Test Item");

      // Trim more characters with backspace key
      stdin.write("\b");
      stdin.write("\b");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Search should now be "test"
      expect(lastFrame()).toContain('(filtered: "test")');
      expect(lastFrame()).toContain("Test Item");
      expect(lastFrame()).toContain("Testing Item");
    });
    it("ignores special keys in search mode", async () => {
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList
            lists={[
              {
                id: "list1",
                display: "List 1",
                items: [
                  { id: "item1", display: "Test Item" },
                  { id: "item2", display: "Another Item" },
                ],
              },
            ]}
          />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Type search string with special keys that should be ignored
      stdin.write("t");
      stdin.write("["); // Bracket should be ignored in search
      stdin.write("e");
      stdin.write("{"); // Brace should be ignored in search
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("s");
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("}"); // Brace should be ignored in search
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("t");
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Search should only contain "test"
      expect(lastFrame()).toContain('(filtered: "test")');
      expect(lastFrame()).not.toContain('(filtered: "t\\e{s}t")');
    });
  });
  describe("pagination", () => {
    it("shows pagination info in select mode", async () => {
      // Create a list with more than one page of items
      const manyItems = Array.from({ length: 15 }, (_, i) => ({
        id: `item${i}`,
        display: `Item ${i}`,
      }));

      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList
            lists={[
              {
                id: "list1",
                display: "List 1",
                items: manyItems,
              },
            ]}
          />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Switch to select mode
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should show pagination info
      expect(lastFrame()).toContain("Page: 1/");
    });
    it("navigates to next page when ']' is pressed in select mode", async () => {
      // Create a list with more than one page of items
      const manyItems = Array.from({ length: 15 }, (_, i) => ({
        id: `item${i}`,
        display: `Item ${i}`,
      }));

      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList
            lists={[
              {
                id: "list1",
                display: "List 1",
                items: manyItems,
              },
            ]}
          />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Switch to select mode
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // First page should show first 10 items
      expect(lastFrame()).toContain("Item 0");
      expect(lastFrame()).toContain("Item 9");
      expect(lastFrame()).not.toContain("Item 10");

      // Go to next page
      stdin.write("]");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second page should show remaining items
      expect(lastFrame()).toContain("Item 10");
      expect(lastFrame()).not.toContain("Item 0");
    });
    it("navigates to previous page when '[' is pressed in select mode", async () => {
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList
            lists={[
              {
                id: "list1",
                display: "List 1",
                // Create a list with more than one page of items
                items: Array.from({ length: 15 }, (_, i) => ({
                  id: `item${i}`,
                  display: `Item ${i}`,
                })),
              },
            ]}
          />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Switch to select mode
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Go to next page
      stdin.write("]");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Go back to previous page
      stdin.write("[");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should be back on first page
      expect(lastFrame()).toContain("Item 0");
      expect(lastFrame()).toContain("Item 9");
      expect(lastFrame()).not.toContain("Item 10");
    });
  });
  describe("selection", () => {
    it("selects items with hotkeys in select mode", async () => {
      const onSelected = vi.fn();
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList
            lists={[
              {
                id: "list1",
                display: "List 1",
                items: [
                  { id: "item1", display: "Item 1", data: {} },
                  { id: "item2", display: "Item 2", data: {} },
                ],
              },
            ]}
            onSelected={onSelected}
          />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Switch to select mode
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should show hotkeys
      expect(lastFrame()).toContain("[a]");
      expect(lastFrame()).toContain("[s]");

      // Select first item with hotkey
      stdin.write("a");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should highlight the selected item
      expect(lastFrame()).toContain("Item 1");
      expect(onSelected).toHaveBeenCalledWith([
        expect.objectContaining({ id: "item1" }),
      ]);
    });

    it("supports multiple selection", async () => {
      const onSelected = vi.fn();
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList
            lists={[
              {
                id: "list1",
                display: "List 1",
                items: [
                  { id: "item1", display: "Test Item 1", data: {} },
                  { id: "item2", display: "Test Item 2", data: {} },
                ],
              },
            ]}
            multiple={true}
            onSelected={onSelected}
          />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Switch to select mode
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Select first item with hotkey
      stdin.write("a");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should show selection indicator
      expect(lastFrame()).toContain("✓");

      // Select second item with hotkey
      stdin.write("s");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should have both items selected
      expect(lastFrame()).toContain("Test Item 1");
      expect(lastFrame()).toContain("Test Item 2");

      // onSelected should not be called yet in multiple mode until completed
      expect(onSelected).not.toHaveBeenCalled();

      // Complete selection with Enter
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Now onSelected should be called with both items
      expect(onSelected).toHaveBeenCalledWith([
        expect.objectContaining({ id: "item1" }),
        expect.objectContaining({ id: "item2" }),
      ]);
    });

    it("single selection calls onSelected immediately", async () => {
      const onSelected = vi.fn();
      const { stdin } = render(
        <TestHarness keymap={keymap}>
          <CoreList
            lists={[
              {
                id: "list1",
                display: "List 1",
                items: [
                  { id: "item1", display: "Test Item 1", data: {} },
                  { id: "item2", display: "Test Item 2", data: {} },
                ],
              },
            ]}
            multiple={false}
            onSelected={onSelected}
          />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Switch to select mode
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Select first item with hotkey
      stdin.write("a");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // onSelected should be called immediately in single selection mode
      expect(onSelected).toHaveBeenCalledWith([
        expect.objectContaining({ id: "item1" }),
      ]);

      // Reset mock
      onSelected.mockReset();

      // Select second item with hotkey
      stdin.write("s");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Only second item should be selected now
      expect(onSelected).toHaveBeenCalledWith([
        expect.objectContaining({ id: "item2" }),
      ]);
    });

    it("selection state should be preserved after navigating between pages", async () => {
      // Create a list with more than one page of items
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        id: `item${i}`,
        display: `Item ${i}`,
        data: {},
      }));

      const onSelected = vi.fn();
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList
            lists={[
              {
                id: "list1",
                display: "List 1",
                items: manyItems,
              },
            ]}
            multiple={true}
            onSelected={onSelected}
          />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Switch to select mode
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Select items on first page
      stdin.write("a"); // Select Item 0
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("s"); // Select Item 1
      await new Promise((resolve) => setTimeout(resolve, 50));

      // First page should have selected items
      const firstPageFrame = lastFrame();
      expect(firstPageFrame).toContain("Item 0");
      expect(firstPageFrame).toContain("Item 1");
      expect(firstPageFrame).toContain("✓"); // Selection indicator

      // Go to next page
      stdin.write("]");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Select an item on second page
      stdin.write("a"); // Select Item 10
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Go back to first page
      stdin.write("[");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // First page should still show selected items
      const backToFirstPageFrame = lastFrame();
      expect(backToFirstPageFrame).toContain("Item 0");
      expect(backToFirstPageFrame).toContain("Item 1");
      expect(backToFirstPageFrame).toContain("✓"); // Selection indicator

      // Complete selection with Enter
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // onSelected should be called with all selected items from both pages
      expect(onSelected).toHaveBeenCalledWith([
        expect.objectContaining({ id: "item0" }),
        expect.objectContaining({ id: "item1" }),
        expect.objectContaining({ id: "item10" }),
      ]);
    });

    describe("initial selection", () => {
      it("loads with pre-selected items in multiple selection mode", async () => {
        const { lastFrame, stdin } = render(
          <TestHarness keymap={keymap}>
            <CoreList
              lists={[
                {
                  id: "list1",
                  display: "List 1",
                  items: [
                    {
                      id: "item1",
                      display: "Item 1",
                      data: {},
                      selected: true,
                    },
                    {
                      id: "item2",
                      display: "Item 2",
                      data: {},
                      selected: false,
                    },
                    {
                      id: "item3",
                      display: "Item 3",
                      data: {},
                      selected: true,
                    },
                  ],
                },
              ]}
              multiple={true}
            />
          </TestHarness>,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Switch to select mode
        stdin.write("\r");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const frame = lastFrame();

        expect(frame).toContain("Item 1");
        expect(frame).toContain("Item 2");
        expect(frame).toContain("Item 3");

        expect(frame).toContain("✓"); // At least one checkmark should be present

        expect(frame).toContain("Selected: 2 items");
      });

      it("ignores initial selection in single selection mode", async () => {
        const { lastFrame, stdin } = render(
          <TestHarness keymap={keymap}>
            <CoreList
              lists={[
                {
                  id: "list1",
                  display: "List 1",
                  items: [
                    { id: "item1", display: "Item 1", data: {} },
                    { id: "item2", display: "Item 2", data: {} },
                  ],
                },
              ]}
              multiple={false}
              initialSelectedIds={["item2"]} // This should be ignored in single selection mode
            />
          </TestHarness>,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Switch to select mode
        stdin.write("\r");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const frame = lastFrame();

        // Verify no items are pre-selected in single selection mode
        expect(frame).not.toContain("Selected: 1 item");

        // In single selection mode, items aren't visually marked as selected until explicitly chosen
        // So we're verifying the component renders correctly without applying the initial selection
        expect(frame).toContain("Item 1");
        expect(frame).toContain("Item 2");
      });
    });
  });
});
