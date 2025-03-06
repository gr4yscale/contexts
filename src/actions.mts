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
  const action = getAction(id);
  if (!action) {
    throw new Error(`Action with ID "${id}" not found`);
  }

  await action.handler(...args);

  for (const listener of listeners) {
    listener(id);
  }
}
