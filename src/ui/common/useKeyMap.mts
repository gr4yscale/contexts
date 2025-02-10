import { Key } from "ink";

// Types for key sequences and commands
export type KeyEvent = {
  input: string;
  key: Key;
};

export type KeySequence = KeyEvent[];

export type Command = {
  name: string;
  handler: () => void | Promise<void>;
};

export type KeyMap = {
  sequence: KeyEvent[];
  command?: Command;
  keymap?: KeyMapConfig;
  description?: string;
};

export type KeyMapConfig = KeyMap[];

export type KeyMapResult = {
  command?: Command;
  pendingKeymap?: KeyMapConfig;
  description?: string;
};

// Utility to check if two key events match
const keyEventsMatch = (event1: KeyEvent, event2?: KeyEvent): boolean => {
  // Match input
  if (!event2) return false;
  if (event1.input !== event2.input) return false;

  // Match special keys
  const specialKeys = [
    "return",
    "escape",
    "delete",
    "tab",
    "upArrow",
    "downArrow",
    "leftArrow",
    "rightArrow",
    "pageDown",
    "pageUp",
  ] as const;

  for (const key of specialKeys) {
    if (event1.key[key] !== event2.key[key]) return false;
  }

  return true;
};

// Utility to check if a sequence matches the current buffer
const sequenceMatches = (
  sequence: KeySequence,
  buffer: KeySequence,
): boolean => {
  if (sequence.length !== buffer.length) return false;
  return sequence.every((event, index) => keyEventsMatch(event, buffer[index]));
};

export const useKeyMap = (initialConfig: KeyMapConfig) => {
  let keyBuffer: KeySequence = [];
  let currentConfig: KeyMapConfig = initialConfig;
  let maxSequenceLength = Math.max(
    ...initialConfig.map((km) => km.sequence.length),
  );

  const resetState = () => {
    keyBuffer = [];
    currentConfig = initialConfig;
    maxSequenceLength = Math.max(
      ...initialConfig.map((km) => km.sequence.length),
    );
  };

  const handleKeyEvent = (input: string, key: Key): KeyMapResult | null => {
    const currentEvent: KeyEvent = { input, key };

    // Handle escape key to reset state
    if (key.escape) {
      resetState();
      return null;
    }

    // Add new event to buffer
    keyBuffer.push(currentEvent);

    // Trim buffer if it exceeds max length
    if (keyBuffer.length > maxSequenceLength) {
      keyBuffer = keyBuffer.slice(-maxSequenceLength);
    }

    // Check for matching sequences
    for (const keyMap of currentConfig) {
      if (sequenceMatches(keyMap.sequence, keyBuffer)) {
        // Clear buffer after match
        keyBuffer = [];

        if (keyMap.command) {
          // Execute command and reset to initial config
          currentConfig = initialConfig;
          return {
            command: keyMap.command,
            description: keyMap.description,
          };
        } else if (keyMap.keymap) {
          // Update current config to nested keymap
          currentConfig = keyMap.keymap;
          maxSequenceLength = Math.max(
            ...keyMap.keymap.map((km) => km.sequence.length),
          );
          return {
            pendingKeymap: keyMap.keymap,
            description: keyMap.description,
          };
        }
      }
    }

    return null;
  };

  return {
    handleKeyEvent,
    resetState,
    getCurrentConfig: () => currentConfig,
  };
};

// Helper to create a key event
export const key = (input: string, specialKey?: string): KeyEvent => ({
  input,
  key: {
    return: specialKey === "return",
    escape: specialKey === "escape",
    delete: specialKey === "delete",
    tab: specialKey === "tab",
    pageDown: specialKey === "pageDown",
    pageUp: specialKey === "pageUp",
    ctrl: false,
    meta: false,
    shift: false,
    upArrow: specialKey === "upArrow",
    downArrow: specialKey === "downArrow",
    leftArrow: specialKey === "leftArrow",
    rightArrow: specialKey === "rightArrow",
    backspace: specialKey === "backspace",
  },
});
