import { Activity } from "./types.mts";

export enum ActionType {
  BASE = "base",
  CURRENT_ACTIVITY = "currentActivity",
}

export interface Action {
  id: string;
  name: string;
  type: ActionType;
  handler: (...args: any[]) => Promise<void> | void;
}

// actions that operate on the current activity
export interface CurrentActivityAction extends Action {
  type: ActionType.CURRENT_ACTIVITY;
  handler: (activity: Activity) => Promise<void> | void;
}

// base actions
export interface BaseAction extends Action {
  type: ActionType.BASE;
  handler: () => Promise<void> | void;
}

export const actions: Record<string, Action> = {};

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
}

export const runFirefoxAction: BaseAction = {
  id: "runFirefox",
  name: "Run Firefox",
  type: ActionType.BASE,
  handler: async () => {
    console.log("Running Firefox...");
  },
};

export const assignCurrentActivityToParentAction: CurrentActivityAction = {
  id: "assignCurrentActivityToParent",
  name: "Assign to Parent",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Activity) => {
    console.log(`Assigning activity ${activity.id} to parent...`);
  },
};

registerAction(runFirefoxAction);
registerAction(assignCurrentActivityToParentAction);
