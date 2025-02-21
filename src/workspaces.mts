import { $ } from "zx";

import { Activity } from "./types.mts";
import {
  getWorkspacesForActivity,
  getWorkspaceById,
  createWorkspaceForActivity,
} from "./models/workspace.mts";

import activityDTO from "./models/activity.mts";

const { getActivityById, getCurrentActivity } = await activityDTO();

$.verbose = false; // suppress stdout from zx subprocess calls

let currentWorkspaceId = 0;

export async function viewWorkspace(workspaceId: number) {
  const workspace = await getWorkspaceById(workspaceId);
  if (workspace) {
    await $`dwmc viewex ${workspace.id}`;
    return true;
  }
  return false;
}

export async function viewFirstWorkspaceForActivity(activityId: string) {
  const workspaces = await getWorkspacesForActivity(activityId);
  if (workspaces && workspaces[0]) {
    await $`dwmc viewex ${workspaces[0].id}`;
    return true;
  }
  return false;
}

export async function viewNextWorkspaceForActivity(activityId: string) {
  const activity = await getActivityById(activityId);
  if (!activity) {
    console.error(`No activity found for ID: ${activityId}`);
    return;
  }

  const workspaces = await getWorkspacesForActivity(activityId);
  const currentIndex = workspaces.findIndex((e) => e.id === currentWorkspaceId);
  let nextWorkspace = workspaces[currentIndex + 1];
  if (!nextWorkspace) {
    nextWorkspace = workspaces[0];
  }
  if (nextWorkspace) {
    await $`dwmc viewex ${nextWorkspace.id}`;
    currentWorkspaceId = nextWorkspace.id;
    console.log(`switched to workspace ID: ${nextWorkspace.id}`);
    $`notify-send "workspace: ${nextWorkspace.id}"`;
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

