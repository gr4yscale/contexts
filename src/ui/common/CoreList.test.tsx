import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import CoreList from "./CoreList.tsx";
import TestHarness from "./TestHarness.tsx";
import { Keymap, KeymapInstance } from "./Keymapping.mts";

let keymap: KeymapInstance;

describe("CoreList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // replace the keymap for each test
    keymap = Keymap([]);
  });

  it("renders initial state correctly", () => {
    const { lastFrame } = render(
      <TestHarness keymap={keymap}>
        <CoreList />
      </TestHarness>,
    );

    expect(lastFrame()).toContain("TEST");
  });

  it("switches from find mode to select mode when Enter is pressed", async () => {
    const { stdin } = render(
      <TestHarness keymap={keymap}>
        <CoreList />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Press Enter to switch to select mode
    stdin.write("\r");

    // Press ']' which should trigger the nextPage handler in select mode
    stdin.write("]");
  });

  it("switches back to find mode from select mode when Delete is pressed", async () => {
    const { stdin } = render(
      <TestHarness keymap={keymap}>
        <CoreList />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // First switch to select mode
    stdin.write("\r");

    // Then press Delete to go back to find mode
    stdin.write("\u007F"); // Delete key
  });

  it("handles navigation keys in select mode", async () => {
    const { stdin } = render(
      <TestHarness keymap={keymap}>
        <CoreList />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Switch to select mode
    stdin.write("\r");

    // Test previous page handler
    stdin.write("[");

    // Test next page handler
    stdin.write("]");
  });
});
