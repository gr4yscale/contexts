import { $ } from "zx";

import {
  getWorkspacesForActivity,
  getWorkspaceById,
  createWorkspaceForActivity,
  deleteWorkspaceById,
} from "./models/workspace.mts";

import activityDTO from "./models/activity.mts";

const { getCurrentActivity } = await activityDTO();

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
    console.error("Error viewing workspace:", error);
    throw error;
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

export const createWorkspaceForCurrentActivity = async () => {
  const currentActivity = await getCurrentActivity();
  if (currentActivity) {
    // TOFIX try/catch this
    if (await createWorkspaceForActivity(currentActivity.activityId)) {
      $`notify-send "Created workspace for ${currentActivity.activityId}"`;
    }
  }
};

export const allocateWorkspace = async (activity: Activity) => {
  //TOFIX: handle case of not finding an available dwm tag
  if (activity.dwmTag === undefined || activity.dwmTag === 0) {
    //console.log(`Activity needs a workspace allocated: ${activity.name}`);
    if (availableWorkspacesCount() > 1) {
      await assignEmptyWorkspace(activity);
    } else {
      $`notify-send "Available workspaces = 0; cancelling"`;
    }
  }

  if (await viewWorkspace(activity)) {
    activity.active = true; // TOFIX: make this a computed value
    return true;
  }
  return false;
};

