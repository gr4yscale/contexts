import { $ } from "zx";

import { getState, Activity } from "./state.mts";

const { dwmTags } = getState() 

export const findEmptyWorkspace = () => {
  for (let i = 1; i < dwmTags.length; i++) {
    if (!dwmTags[i] || dwmTags[i] === 'available') {
      console.log(`found ${i}`)
      return i;
    }
  }
  return 0;
};

const availableWorkspacesCount = () => {
  const a = 29 - (dwmTags.filter(ws => ws === ws).length)
  return a
}

export const assignEmptyWorkspace = async (activity: Activity) => {
  const ws = findEmptyWorkspace();

  if (ws > 0) {
    activity.dwmTag = ws;
    dwmTags[ws] = activity.activityId;
    $`notify-send "activity ${activity.name} allocated workspace\navailable: ${availableWorkspacesCount()}"`;
    return true
  } else {
    activity.dwmTag = undefined;
    $`notify-send "Was unable to find an available workspace; cancelled"`;
    return false
  }
};

export const syncWorkspaces = (activities: Activity[]) => {
  // TOFIX: iterate over ws indexes (dwmTags) , and search for activities by dwmTag
  for (const c of activities) {
    if (!c.dwmTag) { return }
    if (c.dwmTag > dwmTags.length) { return }
    if (c.dwmTag === undefined || c.dwmTag === 0) { // every restart of activities frees dwm tag for activities which got assigned to 0 
      dwmTags[c.dwmTag] = 'available'
      c.dwmTag = undefined
    } else {
      dwmTags[c.dwmTag] = c.activityId;
    }
  }
};

export const viewWorkspace = async (activity: Activity) => {
  if (activity.dwmTag === undefined || activity.dwmTag === 0) { return false; }
  await $`dwmc viewex ${activity.dwmTag}`;
  return true
};

export const allocateWorkspace = async (activity: Activity) => {
  //TOFIX: handle case of not finding an available dwm tag
  if (activity.dwmTag === undefined || activity.dwmTag === 0) {
    console.log(`Activity needs a workspace allocated: ${activity.name}`);
    if (availableWorkspacesCount() > 1) {
      await assignEmptyWorkspace(activity)
    } else {
      $`notify-send "Available workspaces = 0; cancelling"`;
    }
  }

  if (await viewWorkspace(activity)) {
    activity.active = true; // TOFIX: make this a computed value
    return true
  }
  return false
};

export const deallocateWorkspace = async (activity: Activity) => {
  // rename dwm tag to "unused" or empty
  if (activity.dwmTag) {
    // confirm ui?
    dwmTags[activity.dwmTag] = 'available'
    activity.dwmTag = undefined
  }
  activity.active = false;
  // last accessed?
  // close clients?
  // rename dwm tag with dwmc
  $`notify-send "Activity ${activity.name} freed workspace\navailable: ${availableWorkspacesCount()}"`;
};
