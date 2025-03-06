import { ActionType, Action, registerAction } from "../actions.mts";

import { Activity } from "../types.mts";

// actions that operate on the current activity
interface CurrentActivityAction extends Action {
  type: ActionType.CURRENT_ACTIVITY;
  handler: (activity: Activity) => Promise<void> | void;
}

export const currentActivityRenameAction: CurrentActivityAction = {
  id: "currentActivityRename",
  name: "Rename Activity",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Activity) => {
    console.log(`Renaming activity ${activity.activityId}...`);
  },
};

export const currentActivityAssignToParentAction: CurrentActivityAction = {
  id: "currentActivityAssignToParent",
  name: "Assign Activity to Parent",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Activity) => {
    console.log(`Assigning activity ${activity.activityId} to parent...`);
  },
};

export const currentActivityCreateChildActivityAction: CurrentActivityAction = {
  id: "currentActivityCreateChildActivity",
  name: "Create Child Activity",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Activity) => {
    console.log(`Creating child activity for ${activity.activityId}...`);
  },
};

export const currentActivityDestroyAction: CurrentActivityAction = {
  id: "currentActivityDestroy",
  name: "Delete Activity",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Activity) => {
    console.log(`Deleting activity ${activity.activityId}...`);
  },
};

registerAction(currentActivityRenameAction);
registerAction(currentActivityAssignToParentAction);
registerAction(currentActivityCreateChildActivityAction);
registerAction(currentActivityDestroyAction);
