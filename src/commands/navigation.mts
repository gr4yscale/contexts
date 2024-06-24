import { $ } from "zx";

import {
  getState,
  createActivity,
  updateCurrentActivity,
  updatePreviousActivity,
  activityById,
  Activity,
  ActivityId,
} from "../state.mts";

import { allocateWorkspace } from "../workspaces.mts";

import { rofiListSelectRecentActivities } from "../selection.mts";

// activity switching
export const switchActivity = async (prompt: string, prefilter?: string) => {
  const selectedActivityId = await selectRecentActivityId(prompt, prefilter);
  if (selectedActivityId) {
    await activateActivity(selectedActivityId);
  }
};

// todo: overload this with activityId or Activity
export const activateActivity = async (id: ActivityId) => {
  const previousActivity = getState().currentActivity;

  let activity: Activity | undefined;
  activity = activityById(id);
  if (!activity) {
    console.log(`activity not found, creating for id: ${id}`);
    activity = createActivity(id);
    $`notify-send "Created new activity: ${id}"`;
  }

  if(await allocateWorkspace(activity)) {
    // todo: indempotency
    updateCurrentActivity(activity);
    updatePreviousActivity(previousActivity);
    activity.lastAccessed = new Date();
    console.log('activated ' + activity.name)
    $`notify-send -a activity -t 500 "Activated activity: ${activity.name}; ws: ${activity.dwmTag}"`;
  }
};

export const swapActivity = async () => {
  const { previousActivity } = getState();
  await activateActivity(previousActivity.activityId);
};

// windows
export const sendWindowToAnotherActivity = async () => {
  const activity = await selectRecentActivity("send to activity:");
  if (activity) {
    console.log(`sending window to ${activity.dwmTag}: ${activity.activityId}`);
    await $`dwmc tagex ${activity.dwmTag}`;
    activity.lastAccessed = new Date();
  }
};

// monitor selection

// util
const selectRecentActivityId = async (prompt: string, prefilter?: string) => {
  const { activities } = getState();
  return await rofiListSelectRecentActivities(
    activities,
    prompt ?? "recent activity: ",
    prefilter
  );
};

const selectRecentActivity = async (prompt: string) => {
  const activityId = await selectRecentActivityId(prompt);
  if (activityId) {
    return activityById(activityId);
  }
};
