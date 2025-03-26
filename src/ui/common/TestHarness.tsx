import React, { useEffect } from "react";
import { Box, useInput } from "ink";
import { KeysContext } from "./Context.mts";
import { Keymap } from "./Keymapping.mts";

interface TestHarnessProps {
  children: React.ReactNode;
}

const TestHarness: React.FC<TestHarnessProps> = ({ children }) => {
  const keymap = Keymap([]);

  // Create a context value with the keymap
  const contextValue = {
    keymap,
  };

  // This simulates the global key handling from Root.tsx
  useInput((input, key) => {
    const result = keymap.handleKeyEvent(input, key);
    if (result && result.handler) {
      result.handler();
    }
  });

  return (
    <KeysContext.Provider value={contextValue}>
      <Box>{children}</Box>
    </KeysContext.Provider>
  );
};

export default TestHarness;

// import React, { PropsWithChildren } from "react";
// import { useInput } from "ink";
// import { KeysContext } from "./Context.mts";

// import { Keymap } from "./Keymapping.mts";

// // define root keymap
// const keymap = Keymap([]);

// const TestHarness: React.FC<PropsWithChildren> = ({ children }) => {
//   // global key handling
//   useInput((input, key) => {
//     console.log("handling key", input);
//     const result = keymap.handleKeyEvent(input, key);
//     if (result) {
//       if (result.handler) {
//         console.log("handler found");
//         result.handler();
//       }
//     } else {
//       console.log("unhandled key");
//     }
//   });

//   return (
//     <KeysContext.Provider value={{ keymap }}>{children}</KeysContext.Provider>
//   );
// };

//export default TestHarness;
