import React from "react";
import { Box, useInput, Key } from "ink";
import { useKeyMap, KeyMapConfig } from "./useKeyMap.ts";

interface Props {
  keyMapConfig: KeyMapConfig;
  onUnhandledInput?: (input: string, key: Key) => void;
  children: React.ReactNode;
}

export const InteractiveComponent: React.FC<Props> = ({
  keyMapConfig,
  onUnhandledInput,
  children,
}) => {
  const keymap = useKeyMap(keyMapConfig);

  // Handle key events
  useInput((input, key) => {
    const result = keymap.handleKeyEvent(input, key);

    if (result) {
      if (result.command) {
        result.command.handler();
      }
    } else if (onUnhandledInput) {
      onUnhandledInput(input, key);
    }
  });

  return <Box flexDirection="column">{children}</Box>;
};
