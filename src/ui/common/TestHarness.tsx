import React from "react";
import { Box, useInput } from "ink";
import { KeysContext } from "./Context.mts";
import { KeymapInstance } from "./Keymapping.mts";

interface TestHarnessProps {
  children: React.ReactNode;
  keymap: KeymapInstance;
}

// TestHarness simulates the global key handling from Root.tsx
const TestHarness: React.FC<TestHarnessProps> = ({ keymap, children }) => {
  useInput((input, key) => {
    const result = keymap.handleKeyEvent(input, key);
    if (result && result.handler) {
      result.handler();
    }
  });

  return (
    <KeysContext.Provider value={{ keymap }}>
      <Box>{children}</Box>
    </KeysContext.Provider>
  );
};

export default TestHarness;
