import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import SelectionList from "./SelectionList.tsx";
import { KeysContext } from "./Context.mts";
import { Keymap } from "./Keymapping.mts";

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
    const keymap = Keymap([]);
    const { lastFrame } = render(
      <KeysContext.Provider value={{ keymap }}>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </KeysContext.Provider>,
    );

    // Should show first page of items (20 items)
    expect(lastFrame()).toContain("Item 0");
    expect(lastFrame()).toContain("Item 19");
    expect(lastFrame()).not.toContain("Item 20");
  });

  it("filters items based on search input", () => {
    const keymap = Keymap([]);
    const { lastFrame, stdin } = render(
      <KeysContext.Provider value={{ keymap }}>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </KeysContext.Provider>,
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

  it("navigates between find and select modes", () => {
    const keymap = Keymap([]);
    const { lastFrame, stdin } = render(
      <KeysContext.Provider value={{ keymap }}>
        <SelectionList initialItems={mockItems} onSelected={mockOnSelected} />
      </KeysContext.Provider>,
    );

    // Initially in find mode
    // Simulate pressing Enter to switch to select mode
    stdin.write("\r");

    // Should now show pagination in select mode
    console.log(lastFrame());
    //expect(lastFrame()).toContain("1 / 2");
  });
});
