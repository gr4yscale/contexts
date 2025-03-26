import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import KeymapExample from "./KeymapExample.tsx";
import TestHarness from "../common/TestHarness.tsx";

describe("KeymapExample", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders initial state correctly", () => {
    const { lastFrame } = render(
      <TestHarness>
        <KeymapExample />
      </TestHarness>,
    );

    expect(lastFrame()).toContain("Keymap Example Component");
    expect(lastFrame()).toContain("Counter: 0");
    expect(lastFrame()).toContain("Last key pressed: None");
  });

  it.only("increments counter when 'a' key is pressed", async () => {
    const mockOnKeyPress = vi.fn();
    const { lastFrame, stdin, rerender } = render(
      <TestHarness>
        <KeymapExample onKeyPress={mockOnKeyPress} />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Initial state
    expect(lastFrame()).toContain("Counter: 0");

    // Press 'a' key to increment
    await new Promise((resolve) => setTimeout(resolve, 100));
    stdin.write("a");

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Re-render to show updated state
    rerender(
      <TestHarness>
        <KeymapExample onKeyPress={mockOnKeyPress} />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Counter should be incremented
    expect(lastFrame()).toContain("Counter: 1");
    expect(lastFrame()).toContain("Last key pressed: a");
    expect(mockOnKeyPress).toHaveBeenCalledWith("a");
  });

  it("decrements counter when 'd' key is pressed", async () => {
    const mockOnKeyPress = vi.fn();
    const { lastFrame, stdin, rerender } = render(
      <TestHarness>
        <KeymapExample onKeyPress={mockOnKeyPress} />
      </TestHarness>,
    );

    // First increment to 2
    await new Promise((resolve) => setTimeout(resolve, 100));
    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 100));
    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Re-render to show updated state
    rerender(
      <TestHarness>
        <KeymapExample onKeyPress={mockOnKeyPress} />
      </TestHarness>,
    );

    // Counter should be 2
    expect(lastFrame()).toContain("Counter: 2");

    // Press 'd' key to decrement
    await new Promise((resolve) => setTimeout(resolve, 100));
    stdin.write("d");
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Re-render to show updated state
    rerender(
      <TestHarness>
        <KeymapExample onKeyPress={mockOnKeyPress} />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Counter should be decremented
    expect(lastFrame()).toContain("Counter: 1");
    expect(lastFrame()).toContain("Last key pressed: d");
    expect(mockOnKeyPress).toHaveBeenCalledWith("d");
  });

  it("resets counter when 'r' key is pressed", async () => {
    const mockOnKeyPress = vi.fn();
    const { lastFrame, stdin, rerender } = render(
      <TestHarness>
        <KeymapExample onKeyPress={mockOnKeyPress} />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));
    // First increment to 3
    await new Promise((resolve) => setTimeout(resolve, 100));
    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 100));
    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 100));
    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Re-render to show updated state
    rerender(
      <TestHarness>
        <KeymapExample onKeyPress={mockOnKeyPress} />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Counter should be 3
    expect(lastFrame()).toContain("Counter: 3");

    // Press 'r' key to reset
    await new Promise((resolve) => setTimeout(resolve, 100));

    stdin.write("r");
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Re-render to show updated state
    rerender(
      <TestHarness>
        <KeymapExample onKeyPress={mockOnKeyPress} />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Counter should be reset to 0
    expect(lastFrame()).toContain("Counter: 0");
    expect(lastFrame()).toContain("Last key pressed: r");
    expect(mockOnKeyPress).toHaveBeenCalledWith("r");
  });

  it("prevents counter from going below 0", async () => {
    const { lastFrame, stdin, rerender } = render(
      <TestHarness>
        <KeymapExample />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Initial state
    expect(lastFrame()).toContain("Counter: 0");

    // Try to decrement below 0
    await new Promise((resolve) => setTimeout(resolve, 100));
    stdin.write("d");
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Re-render to show updated state
    rerender(
      <TestHarness>
        <KeymapExample />
      </TestHarness>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Counter should still be 0
    expect(lastFrame()).toContain("Counter: 0");
    expect(lastFrame()).toContain("Last key pressed: d");
  });

  // it("sets counter to 10 when 'gg' sequence is pressed", async () => {
  //   const mockOnKeyPress = vi.fn();
  //   const { lastFrame, stdin, rerender } = render(
  //     <TestHarness>
  //       <KeymapExample onKeyPress={mockOnKeyPress} />
  //     </TestHarness>,
  //   );

  //   // Initial state
  //   expect(lastFrame()).toContain("Counter: 0");

  //   // Press 'g' then 'g' for the sequence
  //   await new Promise((resolve) => setTimeout(resolve, 100));
  //   stdin.write("g");
  //   await new Promise((resolve) => setTimeout(resolve, 100));
  //   stdin.write("g");
  //   await new Promise((resolve) => setTimeout(resolve, 400));

  //   // Counter should be set to 10
  //   expect(lastFrame()).toContain("Counter: 10");
  //   expect(lastFrame()).toContain("Last key pressed: gg");
  //   expect(mockOnKeyPress).toHaveBeenCalledWith("gg");
  // });
});
