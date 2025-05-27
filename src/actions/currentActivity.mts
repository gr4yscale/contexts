import { nanoid } from "nanoid";
import * as logger from "../logger.mts";
import { ActionType, Action, registerAction } from "../actions.mts";
import { Activity } from "../types.mts";
import { createNode } from "../models/activity.mts";

// actions that operate on the current activity
interface CurrentNodeAction extends Action {
  type: ActionType.CURRENT_ACTIVITY;
  handler: (activity: Node) => Promise<void> | void;
}

export const currentNodeRenameAction: CurrentNodeAction = {
  id: "currentNodeRename",
  name: "Rename Node",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Node) => {
    logger.info(`Renaming activity ${activity.activityId}...`);
  },
};

export const currentNodeAssignToParentAction: CurrentNodeAction = {
  id: "currentNodeAssignToParent",
  name: "Assign Node to Parent",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Node) => {
    logger.info(`Assigning activity ${activity.activityId} to parent...`);
  },
};

export const currentNodeCreateChildNodeAction: CurrentNodeAction = {
  id: "currentNodeCreateChildNode",
  name: "Create Child Node",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Node) => {
    const childNodeId = await createNode({
      name: `Child of ${activity.name}`,
      parentNodeId: activity.activityId,
    });
    logger.info(`Created child activity with ID: ${childNodeId}`);
  },
};

export const currentNodeCreateSiblingNodeAction: CurrentNodeAction =
  {
    id: "currentNodeCreateSiblingNode",
    name: "Create Sibling Node",
    type: ActionType.CURRENT_ACTIVITY,
    handler: async (activity: Node) => {
      const siblingNodeId = await createNode({
        name: `Sibling of ${activity.name}`,
        parentNodeId: activity.parentNodeId,
      });
      logger.info(`Created sibling activity with ID: ${siblingNodeId}`);
    },
  };

export const currentNodeCreateRootNodeAction: CurrentNodeAction = {
  id: "currentNodeCreateRootNode",
  name: "Create Root-level Node",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async () => {
    const activityId = await createNode({
      name: `${nanoid()}`,
      parentNodeId: `zydKL5p5RuJM50pQLHMM7`,
    });
    logger.info(`Created activity with ID: ${activityId}`);
  },
};

export const currentNodeDestroyAction: CurrentNodeAction = {
  id: "currentNodeDestroy",
  name: "Delete Node",
  type: ActionType.CURRENT_ACTIVITY,
  handler: async (activity: Node) => {
    logger.info(`Deleting activity ${activity.activityId}...`);
  },
};

registerAction(currentNodeRenameAction);
registerAction(currentNodeAssignToParentAction);
registerAction(currentNodeCreateChildNodeAction);
registerAction(currentNodeCreateSiblingNodeAction);
registerAction(currentNodeCreateRootNodeAction);
registerAction(currentNodeDestroyAction);
