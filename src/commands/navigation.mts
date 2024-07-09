import { $ } from "zx";

import {
  getState,
  createActivity,
  updateCurrentActivity,
  updatePreviousActivity,
  activityById,
  Activity,
  ActivityId,
  ActivityListType
} from "../state.mts";

import { buildMenu } from "../menus.mts";

import { allocateWorkspace } from "../workspaces.mts";

import { rofiListSelectRecentActivities , formatActivitiesListExtended} from "../selection.mts";

type ActivityListBuilder = (activities: Activity[]) => Activity[]

const activitiesAll = (activities: Activity[]) => activities

const activityListBuilders: Record<ActivityListType, ActivityListBuilder> = {
  [ActivityListType.all]: activitiesAll,
};

const buildActivityList = (listTypes: ActivityListType[], activities: Activity[]) => {
  let combined : Array<Activity> = []
  for (const listType of listTypes) {
    const build = activityListBuilders[listType];
    const list = build(activities)
    combined = [...list, ...combined]
  }
  return combined
}

// activity switching
export const switchActivity = async (prompt: string, prefilter?: string) => {

  // build lists of activities for each of the ListTypes
  // append them to a combined list, sort by recent access
  // format lists of activities to include tags, for matching in rofi
  // build menu with handler for item selection

  const { activities, enabledActivityListTypes: listTypes } = getState();
  const lists = buildActivityList(listTypes, activities);
  const sorted = lists.sort((l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime());
  const formatted = await formatActivitiesListExtended(sorted);

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
	    },
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
    $`notify-send -a activity -t 500 "Activated activity: ${activity.name}; ws: ${activity.dwmTag}"`;
  }
};

export const swapActivity = async () => {
  const { previousActivity } = getState();
  await activateActivity(previousActivity.activityId);
};



export const selectActivityByEnabledTags = async (prefilter?: string) => {
  const { activities, enabledTags } = getState();
  const filtered = new Set<Activity>()
  enabledTags.forEach((t) => {
    const matches = activities.filter((a) => a.tags.includes(t))
    matches.forEach((m) => filtered.add(m))
  })
  const selectedActivityId = await rofiListSelectRecentActivities(
    Array.from(filtered),
    "recent activity by enabled tags: ",
    prefilter
  );
  if (selectedActivityId) {
    await activateActivity(selectedActivityId);
  }
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
