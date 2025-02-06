import { $ } from "zx";
import { nanoid } from "nanoid";

import {
  getState,
  createActivity,
  createActivityForOrgId,
  updateCurrentActivity,
  updatePreviousActivity,
  activityById,
  activityByOrgId,
  Activity,
  ActivityId,
} from "../state.mts";

import {
  buildActivityList,
  formatActivitiesListExtended,
} from "../activityList.mts";
import { rofiListSelectRecentActivities } from "../selection.mts";

import { buildMenu } from "../menus.mts";

import { allocateWorkspace } from "../workspaces.mts";

/** build lists of activities for each of the ListTypes
 *  append them to a combined list, sort by recent access
 *  format lists of activities to include tags, for matching in rofi
 *  build menu with handler for item selection
 */
export const switchActivity = async () => {
  const { activities, enabledActivityListTypes } = getState();
  const lists = buildActivityList(enabledActivityListTypes, activities);
  const sorted = lists.sort(
    (l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime(),
  );
  const formatted = await formatActivitiesListExtended(sorted);
  const prompt = `${Object.values(enabledActivityListTypes).join(", ")}`;
  await buildMenu({
    display: prompt,
    builder: () =>
      formatted.map((line: string) => {
        return {
          display: line,
          handler: async (selectionIndex?: number) => {
            if (selectionIndex === undefined) {
              console.log(`no selectionIndex for ${line}`);
              return;
            }
            const activity = sorted[selectionIndex];
            // TOFIX run actions here

            // for activity.actions ... run

            await activateActivity(activity.activityId);
            return;
          },
        };
      }),
  });
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

  if (await allocateWorkspace(activity)) {
    // todo: indempotency
    updateCurrentActivity(activity);
    updatePreviousActivity(previousActivity);
    activity.lastAccessed = new Date();
    console.log("activated " + activity.name);
    $`notify-send -a activity -t 500 "${activity.dwmTag}: ${activity.name}"`;
  }
};

export const toggleActivity = async (id: ActivityId) => {
  if (id !== getState().currentActivity.activityId) {
    await activateActivity(id);
  }
};

const slugify = (str: string) => {
  str = str.replace(/^\s+|\s+$/g, ""); // trim leading/trailing white space
  str = str.toLowerCase(); // convert string to lowercase
  str = str
    .replace(/[^a-z0-9 -]/g, "") // remove any non-alphanumeric characters
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // remove consecutive hyphens
  return str;
};

//export const createActivityForOrgItem = async (args: string) => {

export const activateActivityForOrgId = async (args: string) => {
  const { orgId, orgText } = JSON.parse(args);

  // new way

  // create an org id if it doesn't exist
  // pass orgId and orgtText in to command to createActivity
  // create an activity with orgId set; sluggify activity text, include orgId at the end, add orgItem tag
  // get the activityID back from contextc
  // set activityID property on org element

  // old way

  // prompt the user for final title / confirm (get from org element text)
  // create an activityID based on slugified title
  // get the activityID back from contextc
  // set activityID property on org element

  const previousActivity = getState().currentActivity;
  const display = slugify(orgText as string);

  let activity: Activity | undefined;
  activity = activityByOrgId(orgId);

  if (!activity) {
    console.log(`activity not found, creating for id: ${orgId}`);
    // try-catch? storeState?
    activity = createActivityForOrgId(nanoid(), orgId, display);
    // SET ORGTASK TAG HERE
    $`notify-send "Created new activity for orgId: ${orgId}"`;
  }

  // get the response by a client that closes the connection after a response, or
  // shelling to emacs from contexts, to find an org element and update activityId property

  // return the activityId to emacs somehow - check how we get the response from handleCommand

  if (await allocateWorkspace(activity)) {
    // todo: indempotency
    updateCurrentActivity(activity);
    updatePreviousActivity(previousActivity);
    activity.lastAccessed = new Date();
    console.log("activated " + activity.name);
    $`notify-send -a activity -t 500 "${activity.dwmTag}: ${activity.name}"`;
  }

  return `activityId:  ${activity.activityId}  orgId: ${activity.orgId}`;
};

export const swapActivity = async () => {
  const { previousActivity } = getState();
  await activateActivity(previousActivity.activityId);
};

// windows

// tofix: refactor activity list / menu builder; it's cloned from switchActivity

export const sendWindowToAnotherActivity = async () => {
  const { activities, enabledActivityListTypes } = getState();
  const lists = buildActivityList(enabledActivityListTypes, activities);
  const sorted = lists.sort(
    (l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime(),
  );
  const formatted = await formatActivitiesListExtended(sorted);
  const prompt = `${Object.values(enabledActivityListTypes).join(", ")}`;
  await buildMenu({
    display: prompt,
    builder: () =>
      formatted.map((line: string) => {
        return {
          display: line,
          handler: async (selectionIndex?: number) => {
            if (selectionIndex === undefined) {
              console.log(`no selectionIndex for ${line}`);
              return;
            }
            const activity = sorted[selectionIndex];

            console.log(
              `sending window to ${activity.dwmTag}: ${activity.activityId}`,
            );
            await $`dwmc tagex ${activity.dwmTag}`;
            activity.lastAccessed = new Date();

            return;
          },
        };
      }),
  });
};

// tofix: update this to use newer menu builder functions
// export const sendWindowToAnotherActivity = async () => {
//   const activity = await selectRecentActivity("send to activity:");
//   if (activity) {
//     console.log(`sending window to ${activity.dwmTag}: ${activity.activityId}`);
//     await $`dwmc tagex ${activity.dwmTag}`;
//     activity.lastAccessed = new Date();
//   }
// };

// monitor selection

// util
const selectRecentActivityId = async (prompt: string, prefilter?: string) => {
  const { activities } = getState();
  return await rofiListSelectRecentActivities(
    activities,
    prompt ?? "recent activity: ",
    prefilter,
  );
};

const selectRecentActivity = async (prompt: string) => {
  const activityId = await selectRecentActivityId(prompt);
  if (activityId) {
    return activityById(activityId);
  }
};

// export const activateActivityForOrg = async (id: ActivityId, orgId: string) => {
//   const previousActivity = getState().currentActivity;

//   let activity: Activity | undefined;
//   activity = activityByOrgId(orgId);
//   if (!activity) {
//     console.log(`activity not found, creating for id: ${id} orgId: ${orgId}`);
//     activity = createActivityForOrgId(orgId);
//     $`notify-send "Created new activity: ${id}"`;
//   }

//   if(await allocateWorkspace(activity)) {
//     // todo: indempotency
//     updateCurrentActivity(activity);
//     updatePreviousActivity(previousActivity);
//     activity.lastAccessed = new Date();
//     console.log('activated ' + activity.name)
//     $`notify-send -a activity -t 500 "${activity.dwmTag}: ${activity.name}"`;
//   }
// };
