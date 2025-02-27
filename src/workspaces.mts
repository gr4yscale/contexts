import { $ } from "zx";

import {
  getWorkspacesForActivity,
  getWorkspaceById,
  createWorkspaceForActivity,
  deleteWorkspaceById,
} from "./models/workspace.mts";

import { getCurrentActivity } from "./models/activity.mts";

$.verbose = false; // suppress stdout from zx subprocess calls

let currentWorkspaceId = 0;

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

export async function viewFirstWorkspaceForActivity(activityId: string) {
  const workspaces = await getWorkspacesForActivity(activityId);
  if (workspaces && workspaces[0]) {
    await $`dwmc viewex ${workspaces[0].id}`;
    return true;
  }
  return false;
}

export async function viewNextWorkspaceForCurrentActivity() {
  const currentActivity = await getCurrentActivity();
  if (!currentActivity) {
    console.error(`No current activity found`);
    return;
  }

  const workspaces = await getWorkspacesForActivity(currentActivity.activityId);
  const currentIndex = workspaces.findIndex((e) => e.id === currentWorkspaceId);
  let nextWorkspace = workspaces[currentIndex + 1];
  if (!nextWorkspace) {
    nextWorkspace = workspaces[0];
  }
  if (nextWorkspace) {
    viewWorkspace(nextWorkspace.id);
  }
}

export async function viewPreviousWorkspaceForCurrentActivity() {
  const currentActivity = await getCurrentActivity();
  if (!currentActivity) {
    console.error(`No current activity found`);
    return;
  }

  const workspaces = await getWorkspacesForActivity(currentActivity.activityId);
  const currentIndex = workspaces.findIndex((e) => e.id === currentWorkspaceId);
  let nextWorkspace = workspaces[currentIndex - 1];
  if (!nextWorkspace) {
    nextWorkspace = workspaces[workspaces.length];
  }
  if (nextWorkspace) {
    viewWorkspace(nextWorkspace.id);
  }
}

// TOFIX better error handling
export const createWorkspaceForCurrentActivity = async (name: string) => {
  const currentActivity = await getCurrentActivity();
  if (currentActivity) {
    const workspace = await createWorkspaceForActivity(
      currentActivity.activityId,
      name,
    );
    if (workspace) {
      $`notify-send "Created workspace for activity ${currentActivity.activityId}"`;
      viewWorkspace(workspace.id);
    }
  }
};

export const deleteCurrentWorkspace = async () => {
  const currentWorkspace = await getWorkspaceById(currentWorkspaceId);
  if (currentWorkspace) {
    await deleteWorkspaceById(currentWorkspaceId);
    viewWorkspace(previousWorkspaceId);
  }
};

export const getCurrentWorkspace = async () => {
  return await getWorkspaceById(currentWorkspaceId);
};
