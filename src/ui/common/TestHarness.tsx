import React, { useEffect } from "react";
import { Box, useInput } from "ink";
import { KeysContext } from "./Context.mts";
import { Keymap } from "./Keymapping.mts";

interface TestHarnessProps {
  children: React.ReactNode;
}

const keymap = Keymap([]);

// Create a context value with the keymap
const contextValue = {
  keymap,
};

const TestHarness: React.FC<TestHarnessProps> = ({ children }) => {
  // This simulates the global key handling from Root.tsx
  useInput((input, key) => {
    console.log("TestHarness received key:", input, key);

    // Try to handle the key event
    const result = keymap.handleKeyEvent(input, key);
    if (result && result.handler) {
      console.log(
        "TestHarness executing handler for:",
        result.name || "unnamed handler",
      );
      result.handler();
    } else {
      console.log("TestHarness: No handler found for key", input);
    }
  });

  return (
    <KeysContext.Provider value={contextValue}>
      <Box>{children}</Box>
    </KeysContext.Provider>
  );
};

export default TestHarness;
