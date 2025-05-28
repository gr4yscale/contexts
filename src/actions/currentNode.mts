import { nanoid } from "nanoid";
import * as logger from "../logger.mts";
import { ActionType, Action, registerAction } from "../actions.mts";
import { Node } from "../types.mts";
import { createNode } from "../models/node.mts";

// actions that operate on the current node
interface CurrentNodeAction extends Action {
  type: ActionType.CURRENT_NODE;
  handler: (node: Node) => Promise<void> | void;
}

export const currentNodeRenameAction: CurrentNodeAction = {
  id: "currentNodeRename",
  name: "Rename Node",
  type: ActionType.CURRENT_NODE,
  handler: async (node: Node) => {
    logger.info(`Renaming node ${node.nodeId}...`);
  },
};

export const currentNodeAssignToParentAction: CurrentNodeAction = {
  id: "currentNodeAssignToParent",
  name: "Assign Node to Parent",
  type: ActionType.CURRENT_NODE,
  handler: async (node: Node) => {
    logger.info(`Assigning node ${node.nodeId} to parent...`);
  },
};

export const currentNodeCreateChildNodeAction: CurrentNodeAction = {
  id: "currentNodeCreateChildNode",
  name: "Create Child Node",
  type: ActionType.CURRENT_NODE,
  handler: async (node: Node) => {
    const childNodeId = await createNode({
      name: `Child of ${node.name}`,
      parentNodeId: node.nodeId,
    });
    logger.info(`Created child node with ID: ${childNodeId}`);
  },
};

export const currentNodeCreateSiblingNodeAction: CurrentNodeAction =
  {
    id: "currentNodeCreateSiblingNode",
    name: "Create Sibling Node",
    type: ActionType.CURRENT_NODE,
    handler: async (node: Node) => {
      const siblingNodeId = await createNode({
        name: `Sibling of ${node.name}`,
        parentNodeId: node.parentNodeId,
      });
      logger.info(`Created sibling node with ID: ${siblingNodeId}`);
    },
  };

export const currentNodeCreateRootNodeAction: CurrentNodeAction = {
  id: "currentNodeCreateRootNode",
  name: "Create Root-level Node",
  type: ActionType.CURRENT_NODE,
  handler: async () => {
    const nodeId = await createNode({
      name: `${nanoid()}`,
      parentNodeId: `zydKL5p5RuJM50pQLHMM7`,
    });
    logger.info(`Created node with ID: ${nodeId}`);
  },
};

export const currentNodeDestroyAction: CurrentNodeAction = {
  id: "currentNodeDestroy",
  name: "Delete Node",
  type: ActionType.CURRENT_NODE,
  handler: async (node: Node) => {
    logger.info(`Deleting node ${node.nodeId}...`);
  },
};

registerAction(currentNodeRenameAction);
registerAction(currentNodeAssignToParentAction);
registerAction(currentNodeCreateChildNodeAction);
registerAction(currentNodeCreateSiblingNodeAction);
registerAction(currentNodeCreateRootNodeAction);
registerAction(currentNodeDestroyAction);
