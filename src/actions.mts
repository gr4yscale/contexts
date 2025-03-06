import { Activity } from "./types.mts";

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

// actions that are generic, not context specific
export interface BaseAction extends Action {
  type: ActionType.BASE;
  handler: () => Promise<void> | void;
}

// actions that operate on the current activity
export interface CurrentActivityAction extends Action {
  type: ActionType.CURRENT_ACTIVITY;
  handler: (activity: Activity) => Promise<void> | void;
}

// actions that navigate betwen activities
export interface NavigationAction extends Action {
  type: ActionType.NAVIGATION;
  handler: (activityId?: string) => Promise<void> | void;
}

// actions that act on a resource
export interface ResourceAction extends Action {
  type: ActionType.RESOURCE;
  handler: (resourceId: string) => Promise<void> | void;
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

export const runFirefoxAction: BaseAction = {
  id: "runFirefox",
  name: "Run Firefox",
  type: ActionType.BASE,
  handler: async () => {
    console.log("Running Firefox...");
  },
};

export const runEmacsAction: BaseAction = {
  id: "runEmacs",
  name: "Run Emacs",
  type: ActionType.BASE,
  handler: async () => {
    console.log("Running Emacs...");
  },
};

export const currentActivityRenameAction: CurrentActivityAction = {
  id: "currentActivityRename",
  name: "Rename Activity",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Activity) => {
    console.log(`Renaming activity ${activity.id}...`);
  },
};

export const currentActivityAssignToParentAction: CurrentActivityAction = {
  id: "currentActivityAssignToParent",
  name: "Assign Activity to Parent",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Activity) => {
    console.log(`Assigning activity ${activity.id} to parent...`);
  },
};

export const currentActivityCreateChildActivityAction: CurrentActivityAction = {
  id: "currentActivityCreateChildActivity",
  name: "Create Child Activity",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Activity) => {
    console.log(`Creating child activity for ${activity.id}...`);
  },
};

export const currentActivityDestroyAction: CurrentActivityAction = {
  id: "currentActivityDestroy",
  name: "Delete Activity",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Activity) => {
    console.log(`Deleting activity ${activity.id}...`);
  },
};

export const openResourceAction: ResourceAction = {
  id: "openResource",
  name: "Open Resource",
  type: ActionType.RESOURCE,
  handler: async (resourceId: string) => {
    console.log(`Opening resource ${resourceId}...`);
  },
};

export const resourcePlayInMpvAction: ResourceAction = {
  id: "resourcePlayInMpv",
  name: "Play in MPV",
  type: ActionType.RESOURCE,
  handler: async (resourceId: string) => {
    console.log(`Playing resource ${resourceId} in MPV...`);
  },
};

export const runRangerAction: BaseAction = {
  id: "runRanger",
  name: "Run Ranger",
  type: ActionType.BASE,
  handler: async () => {
    console.log("Running Ranger file manager...");
  },
};

registerAction(runFirefoxAction);
registerAction(runEmacsAction);
registerAction(runRangerAction);

registerAction(currentActivityRenameAction);
registerAction(currentActivityAssignToParentAction);
registerAction(currentActivityCreateChildActivityAction);
registerAction(currentActivityDestroyAction);

registerAction(openResourceAction);
registerAction(resourcePlayInMpvAction);
