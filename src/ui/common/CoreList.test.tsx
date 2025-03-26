import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import TestHarness from "./TestHarness.tsx";
import { Keymap, KeymapInstance } from "./Keymapping.mts";
import CoreList from "./CoreList.tsx";

let keymap: KeymapInstance;

// Mock lists for testing
const mockLists = [
  [
    { id: "list1-item1", display: "List 1 Item 1" },
    { id: "list1-item2", display: "List 1 Item 2" },
  ],
  [
    { id: "list2-item1", display: "List 2 Item 1" },
    { id: "list2-item2", display: "List 2 Item 2" },
  ],
  [{ id: "list3-item1", display: "List 3 Item 1" }],
];

describe("CoreList", () => {
  beforeEach(() => {
    // replace the keymap for each test
    keymap = Keymap([]);
    vi.clearAllMocks();
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
    it("switches from search mode to select mode when Enter is pressed", async () => {
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
  });
  describe("multiple list support", () => {
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
  describe("pagination", () => {
    // Tests will be added here in the future
  });
  describe("search functionality", () => {
    it("clears search string when delete key is pressed", async () => {
      const { stdin, lastFrame } = render(
        <TestHarness keymap={keymap}>
          <CoreList
            lists={[
              [
                { id: "item1", display: "Test Item" },
                { id: "item2", display: "Another Item" },
              ],
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
      stdin.write("\u007F"); // Delete key
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
              [
                { id: "item1", display: "Test Item" },
                { id: "item2", display: "Testing Item" },
                { id: "item3", display: "Another Item" },
              ],
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

      // Press pageUp key to trim last character (simulating backspace)
      stdin.write("\u001B[5~"); // PageUp key
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Search should now be "testin"
      expect(lastFrame()).toContain('(filtered: "testin")');
      expect(lastFrame()).toContain("Testing Item");
      expect(lastFrame()).not.toContain("Test Item");

      // Trim more characters
      stdin.write("\u001B[5~"); // PageUp key
      stdin.write("\u001B[5~"); // PageUp key
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
              [
                { id: "item1", display: "Test Item" },
                { id: "item2", display: "Another Item" },
              ],
            ]}
          />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Type search string with special keys that should be ignored
      stdin.write("t");
      stdin.write("\\"); // Backslash should be ignored in search
      stdin.write("e");
      stdin.write("{"); // Brace should be ignored in search
      stdin.write("s");
      stdin.write("}"); // Brace should be ignored in search
      stdin.write("t");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Search should only contain "test"
      expect(lastFrame()).toContain('(filtered: "test")');
      expect(lastFrame()).not.toContain('(filtered: "t\\e{s}t")');
    });
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
});
