import { $ } from "zx";

import { ActionType, Action, registerAction } from "../actions.mts";
import { Node, NodeId } from "../types.mts";

import { getWorkspacesForNode } from "../models/workspace.mts";

import {
  getNodeById,
  getAllActivities,
  getCurrentNode,
  getPreviousNode,
  updateNodeHistory,
  updateNode,
  formatNodeWithHierarchy,
} from "../models/activity.mts";

import { viewWorkspaceForNode } from "../workspaces.mts";

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

export const activateNode = async (id: NodeId) => {
  let activity: Node | null;
  activity = await getNodeById(id);
  if (!activity) return false;

  const viewed = await viewWorkspaceForNode(activity);

  if (viewed) {
    await updateNode({ activityId: id, lastAccessed: new Date() });

    const previousNode = await getCurrentNode();
    await updateNodeHistory(
      id,
      previousNode ? previousNode.activityId : "",
    );

    $`notify-send -a activity -t 500 "${activity.name}"`;
  } else {
    $`notify-send "No workspace for activity: ${id}"`;
  }

  return viewed;
};

export const swapNode = async () => {
  const previousNode = await getPreviousNode();
  if (previousNode) {
    await activateNode(previousNode.activityId);
  }
};

// we need the client/window that we want to send to be focused,
// so this commmand needs to be handled via socket, not TUI

export const sendWindowToAnotherNode = async () => {
  const activities = await getAllActivities();
  const sorted = activities.sort(
    (l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime(),
  );
  //TOFIX: hack; selection state needs to be removed from `formatActivitityWithHierarchy`
  const unselected = sorted.map((a) => ({ ...a, selected: false }));

  // Format activities with hierarchy paths (TOFIX: cache)
  const formattedActivities = await Promise.all(
    unselected.map(async (activity) => {
      const hierarchyPath = await formatNodeWithHierarchy(
        activity,
        unselected,
      );
      return { ...activity, name: hierarchyPath };
    }),
  );

  const menuItem = (activity: Node) => ({
    display: activity.name,
    handler: async (selectedIndex?: number) => {
      if (selectedIndex !== undefined) {
        const workspaces = await getWorkspacesForNode(activity.activityId);
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

export const navigateNodeNavigate: NavigationAction = {
  id: "activityNavigate",
  name: "Node Navigation",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await showTUI();
  },
};

export const navigateContextNodeSelect: NavigationAction = {
  id: "contextNodeSelect",
  name: "Node Selection",
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

export const navigateSwapNodeAction: NavigationAction = {
  id: "activitySwap",
  name: "Node Swap",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await swapNode();
  },
};

export const navigateSendWindowToAnotherNodeAction: NavigationAction = {
  id: "sendWindowToAnotherNode",
  name: "Send Window To Another Node",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await sendWindowToAnotherNode();
  },
};

export const navigateActivateNodeAction: NavigationAction = {
  id: "activateNode",
  name: "Activate Node",
  type: ActionType.NAVIGATION,
  handler: async (activityId?: string) => {
    if (activityId) {
      await activateNode(activityId);
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
registerAction(navigateNodeNavigate);
registerAction(navigateContextNodeSelect);
registerAction(navigateActionExecute);
registerAction(navigateSwapNodeAction);
registerAction(navigateSendWindowToAnotherNodeAction);
registerAction(navigateActivateNodeAction);
registerAction(navigateResourceNavigate);
registerAction(navigateExaSearch);
