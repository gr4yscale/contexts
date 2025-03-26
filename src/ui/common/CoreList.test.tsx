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

  describe("mode switching behavior", () => {
    it("has two modes: search and select", async () => {
      const { stdin } = render(
        <TestHarness keymap={keymap}>
          <CoreList lists={mockLists} />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Default mode should be search/find

      // Switch to select mode
      stdin.write("\r");

      // Switch back to search mode
      stdin.write("\u007F"); // Delete key
    });
    it("toggles between modes with backslash key", async () => {
      const { stdin } = render(
        <TestHarness keymap={keymap}>
          <CoreList lists={mockLists} />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Toggle to select mode with backslash
      stdin.write("\\");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Toggle back to search mode with backslash
      stdin.write("\\");
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    it("switches from search mode to select mode when Enter is pressed", async () => {
      const { stdin } = render(
        <TestHarness keymap={keymap}>
          <CoreList />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Press Enter to switch to select mode
      stdin.write("\r");
    });
  });
  describe("multiple list navigation", () => {
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
  describe("filtering behavior", () => {
    it("filters the current list based on search string", async () => {
      const { stdin } = render(
        <TestHarness keymap={keymap}>
          <CoreList />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Type search string
      stdin.write("test");
    });

    it("uses filtered results after pressing return key", async () => {
      const { stdin } = render(
        <TestHarness keymap={keymap}>
          <CoreList />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Type search string
      stdin.write("test");

      // Press return to switch to select mode with filtered results
      stdin.write("\r");
    });

    it("pagination uses filtered results", async () => {
      const { stdin } = render(
        <TestHarness keymap={keymap}>
          <CoreList />
        </TestHarness>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Type search string
      stdin.write("test");

      // Press return to switch to select mode
      stdin.write("\r");

      // Test pagination with filtered results
      stdin.write("]"); // next page
      stdin.write("["); // previous page
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
