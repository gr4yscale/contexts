import { Key } from "ink";

export type KeyEvent = {
  input: string;
  key: Key;
};

export type Keymap = {
  sequence: KeyEvent[];
  name?: string;
  handler?: () => void | Promise<void>;
  keymap?: KeymapConfig;
  description?: string;
  hidden?: boolean;
};

export type KeymapConfig = Keymap[];

export type KeymapResult = {
  name?: string;
  handler?: () => void | Promise<void>;
  pendingKeymap?: KeymapConfig;
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
const sequenceMatches = (sequence: KeyEvent[], buffer: KeyEvent[]): boolean => {
  if (sequence.length !== buffer.length) return false;
  return sequence.every((event, index) => keyEventsMatch(event, buffer[index]));
};

export type KeymapInstance = {
  handleKeyEvent: (input: string, key: Key) => KeymapResult | null;
  resetState: () => void;
  getCurrentConfig: () => KeymapConfig;
  pushKeymap: (newConfig: KeymapConfig) => void;
  popKeymap: () => boolean;
  keyBuffer: KeyEvent[];
  lastKeyPressed: string;
  lastCommandExecuted: string;
  registerListener: (listener: () => void) => void;
  getCurrentState: () => { lastCommandExecuted: string; lastKeyPressed: string; keymap: KeymapConfig };
};

export const Keymap = (initialConfig: KeymapConfig): KeymapInstance => {
  let keyBuffer: KeyEvent[] = [];
  let keymapStack: KeymapConfig[] = [initialConfig];
  let listeners: Function[] = [];
  let lastKeyPressed = "";
  let lastCommandExecuted = "";

  //const getCurrentConfig = () => keymapStack[keymapStack.length - 1];

  const getCurrentConfig = () => {
    return keymapStack.flat();
  };

  const getMaxSequenceLength = (config: KeymapConfig) => {
    return Math.max(...config.map((km) => km.sequence.length));
  };

  const pushKeymap = (newConfig: KeymapConfig) => {
    keymapStack = [...keymapStack, newConfig];
    listeners.forEach((listener) => listener());
  };

  const popKeymap = () => {
    if (keymapStack.length > 1) {
      const newStack = keymapStack.slice(0, -1);
      keymapStack = newStack;
      listeners.forEach((listener) => listener());
      return true;
    }
    return false;
  };

  const resetState = () => {
    keyBuffer = [];
    keymapStack = [initialConfig];
    lastKeyPressed = "";
    lastCommandExecuted = "";
    listeners = [];
  };
  
  const registerListener = (listener: Function) => {
    listeners.push(listener);
  };

  const handleKeyEvent = (input: string, key: Key): KeymapResult | null => {
    const currentEvent: KeyEvent = { input, key };

    // Handle escape key to reset state
    // if (key.escape) {
    //   if (keymapStack.length > 1) {
    //     popKeymap();
    //   } else {
    //     resetState();
    //   }
    //   return null;
    // }

    // Add new event to buffer
    const newBuffer = [...keyBuffer, currentEvent];

    // Trim buffer if it exceeds max length
    const currentMaxLength = getMaxSequenceLength(getCurrentConfig());
    const trimmedBuffer =
      newBuffer.length > currentMaxLength
        ? newBuffer.slice(-currentMaxLength)
        : newBuffer;

    keyBuffer = trimmedBuffer;

    // Update last key pressed state
    let lastKey = "";
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
    for (const specialKey of specialKeys) {
      if (key[specialKey]) {
        lastKey = specialKey;
        break;
      }
    }
    if (!lastKey) {
      lastKey = input;
    }

    lastKeyPressed = lastKey;

    // Check for matching sequences
    const currentConfig = getCurrentConfig();
    for (const keyMap of currentConfig) {
      if (sequenceMatches(keyMap.sequence, trimmedBuffer)) {
        // Clear buffer after match
        keyBuffer = [];

        if (keyMap.handler) {
          // Execute handler but maintain current keymap stack
          const result = {
            name: keyMap.name,
            handler: keyMap.handler,
            description: keyMap.description,
          };
          lastCommandExecuted = keyMap.name || "";
          listeners.forEach((listener) => listener());
          return result;
        } else if (keyMap.keymap) {
          pushKeymap(keyMap.keymap);
          const result = {
            pendingKeymap: keyMap.keymap,
            description: keyMap.description,
          };
          lastCommandExecuted = "pushKeymap";
          listeners.forEach((listener) => listener());
          return result;
        }
      }
    }

    return null;
  };

  const getCurrentState = () => {
    return { lastCommandExecuted, lastKeyPressed, keymap: getCurrentConfig() };
  };

  return {
    handleKeyEvent,
    resetState,
    getCurrentConfig,
    pushKeymap,
    popKeymap,
    keyBuffer,
    lastKeyPressed,
    lastCommandExecuted,
    registerListener,
    getCurrentState,
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
