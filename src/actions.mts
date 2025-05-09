import * as logger from "./logger.mts";

export enum ActionType {
  BASE = "base",
  CURRENT_ACTIVITY = "currentActivity",
  RESOURCE = "resource",
  NAVIGATION = "navigation",
}

export interface Action {
  id: string;
  name: string;
  type: ActionType;
  handler: (...args: any[]) => Promise<void> | void;
}

type Listener = (command: string) => void;

let listeners: Listener[] = [];

export const actions: Record<string, Action> = {};

export const registerActionListener = (listener: Listener) => {
  listeners.push(listener);
};

export const unregisterActionListener = (listener: Listener) => {
  const idx = listeners.indexOf(listener);
  listeners.splice(idx, 1);
};

export function registerAction(action: Action): void {
  actions[action.id] = action;
}

export function getAction(id: string): Action | undefined {
  return actions[id];
}

export async function executeAction(id: string, ...args: any[]): Promise<void> {
  logger.debug(`Executing action: ${id}`, args);
  const action = getAction(id);
  if (!action) {
    logger.error(`Action with ID "${id}" not found`);
    throw new Error(`Action with ID "${id}" not found`);
  }

  try {
    await action.handler(...args);
    logger.debug(`Action completed: ${id}`);
  } catch (error) {
    logger.error(`Error executing action ${id}:`, error);
    throw error;
  }

  for (const listener of listeners) {
    listener(id);
  }
}
