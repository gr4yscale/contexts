import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import SelectionList from "./SelectionList.tsx";
import TestHarness from "./TestHarness.tsx";

// need a harness that provides `useInput` like in Root.tsx
// filter mode works because useInput

// keymapping needs mocking?

describe("SelectionList", () => {
  const mockItems = Array.from({ length: 30 }, (_, i) => ({
    id: `item-${i}`,
    display: `Item ${i}`,
    data: { id: i, name: `Item ${i}` },
  }));

  const mockOnSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders initial items correctly", () => {
    const { lastFrame } = render(
      <TestHarness>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </TestHarness>,
    );

    // Should show first page of items (20 items)
    expect(lastFrame()).toContain("Item 0");
    expect(lastFrame()).toContain("Item 19");
    expect(lastFrame()).not.toContain("Item 20");
  });

  it("filters items based on search input", () => {
    const { lastFrame, stdin } = render(
      <TestHarness>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </TestHarness>,
    );

    // Write to stdin to simulate user typing
    stdin.write("2");

    // Should show items containing "2"
    expect(lastFrame()).toContain("Item 2");
    expect(lastFrame()).toContain("Item 20");
    expect(lastFrame()).toContain("Item 22");
    expect(lastFrame()).not.toContain("Item 10");
    expect(lastFrame()).not.toContain("Item 11");
  });

  it("navigates between find and select modes", async () => {
    const { lastFrame, stdin, rerender } = render(
      <TestHarness>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </TestHarness>,
    );

    // Initially in find mode
    // Simulate pressing Enter to switch to select mode
    stdin.write("\r");

    // Wait for a moment to let the state update
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Force a re-render to see the updated state
    rerender(
      <TestHarness>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </TestHarness>,
    );

    // Should now show pagination in select mode
    expect(lastFrame()).toContain("1 / 2");
  });

  it("handles vim keys navigation in select mode", async () => {
    const { lastFrame, stdin, rerender } = render(
      <TestHarness>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </TestHarness>,
    );

    // Switch to select mode
    stdin.write("\r");

    // Wait for a moment to let the state update
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Force a re-render to see the updated state
    rerender(
      <TestHarness>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </TestHarness>,
    );

    // Navigate down
    stdin.write("j");

    // Wait for a moment to let the state update
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Force a re-render to see the updated state
    rerender(
      <TestHarness>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </TestHarness>,
    );

    // Check if selection changed
    expect(lastFrame()).toContain("Item 1");
  });

  it("handles test key", async () => {
    const { lastFrame, stdin, rerender } = render(
      <TestHarness>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </TestHarness>,
    );

    // First press Enter to switch to select mode where key handlers are active
    stdin.write("\r");

    // Wait for a moment to let the state update
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Force a re-render to see the updated state
    rerender(
      <TestHarness>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </TestHarness>,
    );

    // Now press the test key
    stdin.write("x");

    // Wait for a moment to let the state update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Force a re-render to see the updated state
    rerender(
      <TestHarness>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </TestHarness>,
    );

    // Check if the test key handler was executed
    expect(lastFrame()).toContain("TEST");
  });
});
