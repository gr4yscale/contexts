import { $ } from "zx";

import {
  getWorkspacesForNode,
  getWorkspaceById,
  createWorkspaceForNode,
  deleteWorkspaceById,
  WorkspaceDTO,
} from "./models/workspace.mts";

import { getCurrentNode } from "./models/node.mts";
import { Node } from "./types.mts";
import * as logger from "./logger.mts";

$.verbose = false; // suppress stdout from zx subprocess calls

let currentWorkspaceId = 0;
let previousWorkspaceId = 0;

export async function viewWorkspace(workspaceId: number) {
  try {
    const workspace = await getWorkspaceById(workspaceId);
    if (workspace) {
      previousWorkspaceId = currentWorkspaceId;
      await $`dwmc viewex ${workspace.id}`;
      currentWorkspaceId = workspace.id;
      $`notify-send "workspace: ${workspace.id}"`;
      return true;
    }
    return false;
  } catch (error) {
    $`notify-send "Error viewing workspace: ${workspaceId}"`;
    return false;
  }
}

export async function viewWorkspaceForNode(node: Node) {
  let workspaces = await getWorkspacesForNode(node.nodeId);
  let workspace: WorkspaceDTO | null;
  if (!workspaces || workspaces.length === 0) {
    try {
      // TOFIX: return a Promise without null here; throw an error if it failed
      workspace = await createWorkspaceForNode(
        node.nodeId,
        node.name,
      );
      
      if (workspace) {
        await $`dwmc viewex ${workspace.id}`;
        return true;
      }
    } catch (error) {
      logger.error(`viewWorkspaceForNode: Error creating workspace:`, error);
      return false;
    }
  } else {
    //TOFIX needs cleanup from multiple workspaces approach
    if (workspaces && workspaces[0]) {
      await $`dwmc viewex ${workspaces[0].id}`;
      return true;
    }
  }

  return false;
}

export async function viewNextWorkspaceForCurrentNode() {
  const currentNode = await getCurrentNode();
  if (!currentNode) {
    console.error(`No current node found`);
    return;
  }

  const workspaces = await getWorkspacesForNode(currentNode.nodeId);
  const currentIndex = workspaces.findIndex((e) => e.id === currentWorkspaceId);
  let nextWorkspace = workspaces[currentIndex + 1];
  if (!nextWorkspace) {
    nextWorkspace = workspaces[0];
  }
  if (nextWorkspace) {
    viewWorkspace(nextWorkspace.id);
  }
}

export async function viewPreviousWorkspaceForCurrentNode() {
  const currentNode = await getCurrentNode();
  if (!currentNode) {
    console.error(`No current node found`);
    return;
  }

  const workspaces = await getWorkspacesForNode(currentNode.nodeId);
  const currentIndex = workspaces.findIndex((e) => e.id === currentWorkspaceId);
  let nextWorkspace = workspaces[currentIndex - 1];
  if (!nextWorkspace) {
    nextWorkspace = workspaces[workspaces.length];
  }
  if (nextWorkspace) {
    viewWorkspace(nextWorkspace.id);
  }
}

export const deleteCurrentWorkspace = async () => {
  const currentWorkspace = await getWorkspaceById(currentWorkspaceId);
  if (currentWorkspace) {
    await deleteWorkspaceById(currentWorkspaceId);
    if (previousWorkspaceId) {
      viewWorkspace(previousWorkspaceId);
    }
  }
};

export const getCurrentWorkspace = async () => {
  return await getWorkspaceById(currentWorkspaceId);
};
