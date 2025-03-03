import { $ } from "zx";

import {
  getWorkspacesForActivity,
  getWorkspaceById,
  createWorkspaceForActivity,
  deleteWorkspaceById,
  WorkspaceDTO,
} from "./models/workspace.mts";

import { getCurrentActivity } from "./models/activity.mts";
import { Activity } from "./types.mts";

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

export async function viewWorkspaceForActivity(activity: Activity) {
  let workspaces = await getWorkspacesForActivity(activity.activityId);
  let workspace: WorkspaceDTO | null;
  if (!workspaces || workspaces.length === 0) {
    // TOFIX: return a Promise without null here; throw an error if it failed
    workspace = await createWorkspaceForActivity(
      activity.activityId,
      activity.name,
    );
    if (workspace) {
      await $`dwmc viewex ${workspace.id}`;
      return true;
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
