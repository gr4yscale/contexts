import { $ } from "zx";

import {
  getState,
  createActivity,
  updateCurrentActivity,
  updatePreviousActivity,
  activityById,
  buildActivityList,
  Activity,
  ActivityId,
} from "../state.mts";

import { buildMenu } from "../menus.mts";

import { allocateWorkspace } from "../workspaces.mts";

import { rofiListSelectRecentActivities , formatActivitiesListExtended} from "../selection.mts";


/** build lists of activities for each of the ListTypes
 *  append them to a combined list, sort by recent access
 *  format lists of activities to include tags, for matching in rofi
 *  build menu with handler for item selection
 */
export const switchActivity = async () => {

  const { activities, enabledActivityListTypes } = getState();
  const lists = buildActivityList(enabledActivityListTypes, activities);
  const sorted = lists.sort((l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime());
  const formatted = await formatActivitiesListExtended(sorted);
  const prompt = `${Object.values(enabledActivityListTypes).join(', ')}`
  await buildMenu({
    display: prompt,
    builder: () => formatted.map((line: string) => {
      return {
	display: line,
	handler: async (selectionIndex?: number) => {
	  if (!selectionIndex) {
	    // TOFIX notify error
	    return;
	  }
	  const activity = sorted[selectionIndex];
	  await activateActivity(activity.activityId);
	  return;
	}
      }
    })
  })
}

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
    $`notify-send -a activity -t 500 "${activity.dwmTag}: ${activity.name}"`;
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
