import { $ } from "zx";
import { nanoid } from "nanoid";

import { Activity, ActivityId } from "../types.mts";

import {
  buildActivityList,
  formatActivitiesListExtended,
  enabledActivityListTypes,
} from "../activityList.mts";

import { buildMenu } from "../menus.mts";

import { getAllWorkspaces, WorkspaceDTO } from "../models/workspace.mts";

import { viewWorkspaceForActivity } from "../workspaces.mts";

import {
  getActivityById,
  getAllActivities,
  getCurrentActivity,
  getPreviousActivity,
  updateActivityHistory,
  updateActivity,
} from "../models/activity.mts";

export const showTUI = async () => {
  // dwm tag 1 is reserved for the TUI
  // a dedicated kitty terminal emulator resides there
  await $`dwmc viewex 0`;
};

/** build lists of activities for each of the ListTypes
 *  append them to a combined list, sort by recent access
 *  format lists of activities to include tags, for matching in rofi
 *  build menu with handler for item selection
 */
export const switchActivity = async () => {
  //TOFIX
  const activities = await getAllActivities();
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
              //console.log(`no selectionIndex for ${line}`);
              return;
            }
            const activity = sorted[selectionIndex];
            if (activity) {
              await activateActivity(activity.activityId);
            }
            // run activity init actions here?
          },
        };
      }),
  });
};

export const activateActivity = async (id: ActivityId) => {
  let activity: Activity | null;
  activity = await getActivityById(id);
  if (!activity) return false;

  const viewed = await viewWorkspaceForActivity(activity);

  if (viewed) {
    const lastAccessed = new Date();
    await updateActivity({ activityId: id, lastAccessed });

    const previousActivity = await getCurrentActivity();
    if (previousActivity && activity) {
      await updateActivityHistory(id, previousActivity.activityId);
    }

    $`notify-send -a activity -t 500 "${activity.name}"`;
  } else {
    $`notify-send "No workspace for activity: ${id}"`;
  }

  return viewed;
};

export const toggleActivity = async (id: ActivityId) => {
  console.log("not implemented");
  // const currentActivity = await getCurrentActivity();
  // if (!currentActivity || id !== currentActivity.activityId) {
  //   await activateActivity(id);
  // }
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

// export const activateActivityForOrgId = async (args: string) => {
//   const { orgId, orgText } = JSON.parse(args);

//   // TOFIX neuter for activity activation by orgId for now
//   return;

//   // new way

//   // create an org id if it doesn't exist
//   // pass orgId and orgtText in to command to createActivity
//   // create an activity with orgId set; sluggify activity text, include orgId at the end, add orgItem tag
//   // get the activityID back from contextc
//   // set activityID property on org element

//   // old way

//   // prompt the user for final title / confirm (get from org element text)
//   // create an activityID based on slugified title
//   // get the activityID back from contextc
//   // set activityID property on org element

//   const display = slugify(orgText as string);

//   let activity: Activity | undefined;

//   // TOFIX
//   //activity = activityByOrgId(orgId);

//   if (!activity) {
//     //console.log(`activity not found, creating for id: ${orgId}`);
//     // try-catch? storeState?
//     activity = createActivityForOrgId(nanoid(), orgId, display);
//     // SET ORGTASK TAG HERE
//     $`notify-send "Created new activity for orgId: ${orgId}"`;
//   }

//   // get the response by a client that closes the connection after a response, or
//   // shelling to emacs from contexts, to find an org element and update activityId property

//   // return the activityId to emacs somehow - check how we get the response from handleCommand

//   //TODO was allocateWorkspcae
//   if (await viewWorkspace(activity)) {
//     const previousActivity = await getPreviousActivity();
//     if (previousActivity) {
//       updateActivityHistory(activity.activityId, previousActivity.activityId);
//     }

//     //TOFIX
//     const lastAccessed = new Date();
//     await updateActivity({ lastAccessed });

//     $`notify-send -a activity -t 500 "${activity.dwmTag}: ${activity.name}"`;
//   }

//   return `activityId:  ${activity.activityId}  orgId: ${activity.orgId}`;
// };

export const swapActivity = async () => {
  const previousActivity = await getPreviousActivity();
  if (previousActivity) {
    await activateActivity(previousActivity.activityId);
  }
};

// we need the client/window that we want to send to be focused,
// so this commmand needs to be handled via socket, not TUI

export const sendWindowToAnotherWorkspace = async () => {
  const workspaces = await getAllWorkspaces();

  const menuItem = (w: WorkspaceDTO) => ({
    display: `${w.name} - ${w.activityName || "No activity associated"}`,
    handler: async (selectedIndex?: number) => {
      if (selectedIndex !== undefined) {
        await $`dwmc tagex ${w.id.toString()}`;
      }
    },
  });

  await buildMenu({
    display: `Workspace:`,
    builder: () => workspaces.map(menuItem),
  });
};
