import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import KeymapExample from "./KeymapExample.tsx";
import TestHarness from "../common/TestHarness.tsx";
import { Keymap, KeymapInstance } from "../common/Keymapping.mts";

let keymap: KeymapInstance;

describe("KeymapExample", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // replace the keymap for each test
    // this ^^ works because of the pattern where useEffect has keymap in its dependencies list
    keymap = Keymap([]);
  });

  it("renders initial state correctly", () => {
    const { lastFrame } = render(
      <TestHarness keymap={keymap}>
        <KeymapExample />
      </TestHarness>,
    );

    expect(lastFrame()).toContain("Keymap Example Component");
    expect(lastFrame()).toContain("Counter: 0");
    expect(lastFrame()).toContain("Last key pressed: None");
  });

  it("increments counter when 'a' key is pressed", async () => {
    const mockOnKeyPress = vi.fn();

    const { lastFrame, stdin} = render(
      <TestHarness keymap={keymap}>
        <KeymapExample onKeyPress={mockOnKeyPress} />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // First increment to 2
    stdin.write("a");
    stdin.write("a");

    // Counter should be 2
    expect(lastFrame()).toContain("Counter: 2");
    expect(lastFrame()).toContain("Last key pressed: a");
    expect(mockOnKeyPress).toHaveBeenCalledWith("a");
  });

  it("decrements counter when 'd' key is pressed", async () => {
    const mockOnKeyPress = vi.fn();
    const { lastFrame, stdin} = render(
      <TestHarness keymap={keymap}>
        <KeymapExample onKeyPress={mockOnKeyPress} />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // First increment to 2
    stdin.write("a");
    stdin.write("a");

    // Counter should be 2
    expect(lastFrame()).toContain("Counter: 2");

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Press 'd' key to decrement
    stdin.write("d");

    // Counter should be decremented
    expect(lastFrame()).toContain("Counter: 1");
    expect(lastFrame()).toContain("Last key pressed: d");
    expect(mockOnKeyPress).toHaveBeenCalledWith("d");
  });

  it("resets counter when 'r' key is pressed", async () => {
    const mockOnKeyPress = vi.fn();
    const { lastFrame, stdin} = render(
      <TestHarness keymap={keymap}>
        <KeymapExample onKeyPress={mockOnKeyPress} />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // First increment to 3
    stdin.write("a");
    stdin.write("a");
    stdin.write("a");

    // Counter should be 3
    expect(lastFrame()).toContain("Counter: 3");

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Press 'r' key to reset
    stdin.write("r");

    // Counter should be reset to 0
    expect(lastFrame()).toContain("Counter: 0");
    expect(lastFrame()).toContain("Last key pressed: r");
    expect(mockOnKeyPress).toHaveBeenCalledWith("r");
  });

  it("prevents counter from going below 0", async () => {
    const { lastFrame, stdin} = render(
      <TestHarness keymap={keymap}>
        <KeymapExample />
      </TestHarness>,
    );

    // Initial state
    expect(lastFrame()).toContain("Counter: 0");

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Try to decrement below 0
    stdin.write("d");

    // Counter should still be 0
    expect(lastFrame()).toContain("Counter: 0");
    expect(lastFrame()).toContain("Last key pressed: d");
  });

  it("sets counter to 10 when 'gg' sequence is pressed", async () => {
    const mockOnKeyPress = vi.fn();
    const { lastFrame, stdin } = render(
      <TestHarness keymap={keymap}>
        <KeymapExample onKeyPress={mockOnKeyPress} />
      </TestHarness>,
    );

    // Initial state
    expect(lastFrame()).toContain("Counter: 0");

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Press 'g' then 'g' for the sequence
    stdin.write("g");
    stdin.write("g");

    // Counter should be set to 10
    expect(lastFrame()).toContain("Counter: 10");
    expect(lastFrame()).toContain("Last key pressed: gg");
    expect(mockOnKeyPress).toHaveBeenCalledWith("gg");
  });
});
