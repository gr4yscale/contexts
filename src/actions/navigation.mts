import { $ } from "zx";

import { ActionType, Action, registerAction } from "../actions.mts";
import { Node, NodeId } from "../types.mts";

import { getWorkspacesForNode } from "../models/workspace.mts";

import {
  getNodeById,
  getAllNodes,
  getCurrentNode,
  getPreviousNode,
  updateNodeHistory,
  updateNode,
  formatNodeWithHierarchy,
} from "../models/node.mts";

import { viewWorkspaceForNode } from "../workspaces.mts";

import { buildMenu } from "../menus.mts";

// actions that navigate to workspaces (dwm tag) of nodes
interface NavigationAction extends Action {
  type: ActionType.NAVIGATION;
  handler: (nodeId?: string) => Promise<void> | void;
}

/** views the dwm tag which is reserved for the TUI
 */
export const showTUI = async () => {
  // dwm tag 1 is reserved for the TUI
  // a dedicated kitty terminal emulator resides there
  await $`dwmc viewex 0`;
};

export const activateNode = async (id: NodeId) => {
  let node: Node | null;
  node = await getNodeById(id);
  if (!node) return false;

  const viewed = await viewWorkspaceForNode(node);

  if (viewed) {
    await updateNode({ nodeId: id, lastAccessed: new Date() });

    const previousNode = await getCurrentNode();
    await updateNodeHistory(
      id,
      previousNode ? previousNode.nodeId : "",
    );

    $`notify-send -a node -t 500 "${node.name}"`;
  } else {
    $`notify-send "No workspace for node: ${id}"`;
  }

  return viewed;
};

export const swapNode = async () => {
  const previousNode = await getPreviousNode();
  if (previousNode) {
    await activateNode(previousNode.nodeId);
  }
};

// we need the client/window that we want to send to be focused,
// so this commmand needs to be handled via socket, not TUI

export const sendWindowToAnotherNode = async () => {
  const nodes = await getAllNodes();
  const sorted = nodes.sort(
    (l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime(),
  );
  //TOFIX: hack; selection state needs to be removed from `formatActivitityWithHierarchy`
  const unselected = sorted.map((a) => ({ ...a, selected: false }));

  // Format nodes with hierarchy paths (TOFIX: cache)
  const formattedNodes = await Promise.all(
    unselected.map(async (node) => {
      const hierarchyPath = await formatNodeWithHierarchy(
        node,
        unselected,
      );
      return { ...node, name: hierarchyPath };
    }),
  );

  const menuItem = (node: Node) => ({
    display: node.name,
    handler: async (selectedIndex?: number) => {
      if (selectedIndex !== undefined) {
        const workspaces = await getWorkspacesForNode(node.nodeId);
        if (workspaces && workspaces[0]) {
          await $`dwmc tagex ${workspaces[0].id.toString()}`;
        } else {
          $`notify-send "No workspace found for node: ${node.name}"`;
        }
      }
    },
  });

  await buildMenu({
    display: `Send window to node:`,
    builder: () => formattedNodes.map(menuItem),
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
  id: "nodeNavigate",
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
  id: "nodeSwap",
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
  handler: async (nodeId?: string) => {
    if (nodeId) {
      await activateNode(nodeId);
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

export const navigateCurrentNodeBrowserState: NavigationAction = {
  id: "currentNodeBrowserState",
  name: "Current Node Browser State",
  type: ActionType.NAVIGATION,
  handler: async () => {
    await showTUI();
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
registerAction(navigateCurrentNodeBrowserState);
