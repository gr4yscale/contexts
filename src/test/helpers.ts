import { render as inkRender } from 'ink-testing-library';
import { vi } from 'vitest';

/**
 * Helper function to simulate key presses in ink components
 * @param stdin - The stdin from ink-testing-library
 * @param text - The text to type
 */
export const typeText = (stdin: any, text: string): void => {
  for (const char of text) {
    stdin.write(char);
  }
};

/**
 * Helper function to simulate pressing Enter
 * @param stdin - The stdin from ink-testing-library
 */
export const pressEnter = (stdin: any): void => {
  stdin.write('\r');
};

/**
 * Helper function to simulate pressing Escape
 * @param stdin - The stdin from ink-testing-library
 */
export const pressEscape = (stdin: any): void => {
  stdin.write('\u001b');
};

/**
 * Helper function to simulate arrow key presses
 * @param stdin - The stdin from ink-testing-library
 * @param direction - The direction of the arrow key
 */
export const pressArrow = (stdin: any, direction: 'up' | 'down' | 'left' | 'right'): void => {
  const arrows = {
    up: '\u001b[A',
    down: '\u001b[B',
    right: '\u001b[C',
    left: '\u001b[D',
  };
  stdin.write(arrows[direction]);
};

/**
 * Mock for executeAction function
 */
export const mockExecuteAction = () => {
  return vi.fn().mockImplementation((actionId: string, ...args: any[]) => {
    return Promise.resolve({ success: true, actionId, args });
  });
};

/**
 * Enhanced render function with common testing utilities
 */
export const render = (ui: React.ReactNode) => {
  const result = inkRender(ui);
  
  return {
    ...result,
    // Add helper methods
    type: (text: string) => typeText(result.stdin, text),
    pressEnter: () => pressEnter(result.stdin),
    pressEscape: () => pressEscape(result.stdin),
    pressArrow: (direction: 'up' | 'down' | 'left' | 'right') => pressArrow(result.stdin, direction),
  };
};
