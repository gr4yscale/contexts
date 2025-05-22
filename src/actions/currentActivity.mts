import { nanoid } from "nanoid";
import * as logger from "../logger.mts";
import { ActionType, Action, registerAction } from "../actions.mts";
import { Activity } from "../types.mts";
import { createActivity } from "../models/activity.mts";

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
    logger.info(`Renaming activity ${activity.activityId}...`);
  },
};

export const currentActivityAssignToParentAction: CurrentActivityAction = {
  id: "currentActivityAssignToParent",
  name: "Assign Activity to Parent",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Activity) => {
    logger.info(`Assigning activity ${activity.activityId} to parent...`);
  },
};

export const currentActivityCreateChildActivityAction: CurrentActivityAction = {
  id: "currentActivityCreateChildActivity",
  name: "Create Child Activity",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Activity) => {
    const childActivityId = await createActivity({
      name: `Child of ${activity.name}`,
      parentActivityId: activity.activityId,
    });
    logger.info(`Created child activity with ID: ${childActivityId}`);
  },
};

export const currentActivityCreateSiblingActivityAction: CurrentActivityAction =
  {
    id: "currentActivityCreateSiblingActivity",
    name: "Create Sibling Activity",
    type: ActionType.CURRENT_ACTIVITY,
    handler: async (activity: Activity) => {
      const siblingActivityId = await createActivity({
        name: `Sibling of ${activity.name}`,
        parentActivityId: activity.parentActivityId,
      });
      logger.info(`Created sibling activity with ID: ${siblingActivityId}`);
    },
  };

export const currentActivityCreateRootActivityAction: CurrentActivityAction = {
  id: "currentActivityCreateRootActivity",
  name: "Create Root-level Activity",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async () => {
    const activityId = await createActivity({
      name: `${nanoid()}`,
      parentActivityId: `zydKL5p5RuJM50pQLHMM7`,
    });
    logger.info(`Created activity with ID: ${activityId}`);
  },
};

export const currentActivityDestroyAction: CurrentActivityAction = {
  id: "currentActivityDestroy",
  name: "Delete Activity",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Activity) => {
    logger.info(`Deleting activity ${activity.activityId}...`);
  },
};

registerAction(currentActivityRenameAction);
registerAction(currentActivityAssignToParentAction);
registerAction(currentActivityCreateChildActivityAction);
registerAction(currentActivityCreateSiblingActivityAction);
registerAction(currentActivityCreateRootActivityAction);
registerAction(currentActivityDestroyAction);
