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
  formatActivityWithHierarchy,
} from "../models/activity.mts";

import { viewWorkspaceForActivity } from "../workspaces.mts";

import { buildMenu } from "../menus.mts";

// actions that navigate to workspaces (dwm tag) of activities
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

export const activateActivity = async (id: ActivityId) => {
  let activity: Activity | null;
  activity = await getActivityById(id);
  if (!activity) return false;

  const viewed = await viewWorkspaceForActivity(activity);

  if (viewed) {
    await updateActivity({ activityId: id, lastAccessed: new Date() });

    const previousActivity = await getCurrentActivity();
    await updateActivityHistory(
      id,
      previousActivity ? previousActivity.activityId : "",
    );

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
  //TOFIX: hack; selection state needs to be removed from `formatActivitityWithHierarchy`
  const unselected = sorted.map((a) => ({ ...a, selected: false }));

  // Format activities with hierarchy paths (TOFIX: cache)
  const formattedActivities = await Promise.all(
    unselected.map(async (activity) => {
      const hierarchyPath = await formatActivityWithHierarchy(
        activity,
        unselected,
      );
      return { ...activity, name: hierarchyPath };
    }),
  );

  const menuItem = (activity: Activity) => ({
    display: activity.name,
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
    builder: () => formattedActivities.map(menuItem),
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

export const navigateTestbed: NavigationAction = {
  id: "testbed",
  name: "Testbed UI",
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

export const navigateContextActivitySelect: NavigationAction = {
  id: "contextActivitySelect",
  name: "Activity Selection",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await showTUI();
  },
};

export const navigateActionExecute: NavigationAction = {
  id: "actionExecute",
  name: "Action Execute",
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

export const navigateResourceNavigate: NavigationAction = {
  id: "resourceNavigate",
  name: "Resource Navigation",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await showTUI();
  },
};

export const navigateExaSearch: NavigationAction = {
  id: "exaSearchNavigate",
  name: "Exa Search",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await showTUI(); // Ensures TUI is visible for the ExaSearch component
  },
};

registerAction(navigateGlobalLeader);
registerAction(navigateTestbed);
registerAction(navigateActivityNavigate);
registerAction(navigateContextActivitySelect);
registerAction(navigateActionExecute);
registerAction(navigateSwapActivityAction);
registerAction(navigateSendWindowToAnotherActivityAction);
registerAction(navigateActivateActivityAction);
registerAction(navigateResourceNavigate);
registerAction(navigateExaSearch);
