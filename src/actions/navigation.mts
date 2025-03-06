import { $ } from "zx";

import { ActionType, Action, registerAction } from "../actions.mts";
import { Activity, ActivityId } from "../types.mts";

import { getWorkspacesForActivity } from "../models/workspace.mts";

import {
  getActivityById,
  getAllActivities,
  getCurrentActivity,
  getPreviousActivity,
  updateActivityHistory,
  updateActivity,
} from "../models/activity.mts";

import { viewWorkspaceForActivity } from "../workspaces.mts";

import {
  buildActivityList,
  formatActivitiesListExtended,
  enabledActivityListTypes,
} from "../activityList.mts";

import { buildMenu } from "../menus.mts";

// actions that navigate betwen activities
interface NavigationAction extends Action {
  type: ActionType.NAVIGATION;
  handler: (activityId?: string) => Promise<void> | void;
}

/** views the dwm tag which is reserved for the TUI
 */
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

export const swapActivity = async () => {
  const previousActivity = await getPreviousActivity();
  if (previousActivity) {
    await activateActivity(previousActivity.activityId);
  }
};

// we need the client/window that we want to send to be focused,
// so this commmand needs to be handled via socket, not TUI

export const sendWindowToAnotherActivity = async () => {
  const activities = await getAllActivities();
  const sorted = activities.sort(
    (l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime(),
  );

  const menuItem = (activity: Activity) => ({
    display: `${activity.name}`,
    handler: async (selectedIndex?: number) => {
      if (selectedIndex !== undefined) {
        const workspaces = await getWorkspacesForActivity(activity.activityId);
        if (workspaces && workspaces[0]) {
          await $`dwmc tagex ${workspaces[0].id.toString()}`;
        } else {
          $`notify-send "No workspace found for activity: ${activity.name}"`;
        }
      }
    },
  });

  await buildMenu({
    display: `Send window to activity:`,
    builder: () => sorted.map(menuItem),
  });
};

export const navigateGlobalLeader: NavigationAction = {
  id: "globalLeader",
  name: "Global Leader Key",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await showTUI();
  },
};

export const navigateActivityNavigate: NavigationAction = {
  id: "activityNavigate",
  name: "Activity Navigation",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await showTUI();
  },
};

export const navigateActivitySelect: NavigationAction = {
  id: "activitySelect",
  name: "Activity Selection",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await showTUI();
  },
};

export const navigateSwapActivityAction: NavigationAction = {
  id: "activitySwap",
  name: "Activity Swap",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await swapActivity();
  },
};

export const navigateSendWindowToAnotherActivityAction: NavigationAction = {
  id: "sendWindowToAnotherActivity",
  name: "Send Window To Another Activity",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await sendWindowToAnotherActivity();
  },
};

export const navigateActivitySwitchOldAction: NavigationAction = {
  id: "switchActivity",
  name: "Switch Activity",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await switchActivity();
  },
};

export const navigateActivateActivityAction: NavigationAction = {
  id: "activateActivity",
  name: "Activate Activity",
  type: ActionType.NAVIGATION,
  handler: async (activityId?: string) => {
    if (activityId) {
      await activateActivity(activityId);
    }
  },
};

registerAction(navigateGlobalLeader);
registerAction(navigateActivityNavigate);
registerAction(navigateActivitySelect);
registerAction(navigateSwapActivityAction);
registerAction(navigateSendWindowToAnotherActivityAction);
registerAction(navigateActivitySwitchOldAction);
registerAction(navigateActivateActivityAction);
