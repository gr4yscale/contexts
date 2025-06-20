import { $ } from "zx";
import * as logger from "../logger.mts";
import { registerAction, ActionType } from "../actions.mts";
import { Node, NodeDTO } from "../types.mts";
import {
  getWorkspacesForNode,
  updateWorkspace,
  WorkspaceDTO,
  getAllWorkspaces,
  deleteWorkspaceById,
} from "../models/workspace.mts";

interface NodeBulkAction extends Action {
  type: ActionType.NODE_BULK;
  handler: () => Promise<void> | void;
}

/**
 * Bulk delete nodes
 */
export const nodesPrune: NodeBulkAction = {
  id: "nodesPrune",
  name: "Prune Nodes",
  type: ActionType.NODE_BULK,
  handler: async () => {
    await $`dwmc viewex 0`; // TOFIX: shared showTUI func
    // The actual pruning will be handled by callbacks in the UI
    // This action just triggers the UI to show
  },
};

/**
 * Execute the pruning of selected nodes
 */
export async function pruneNodes(nodes: NodeDTO[]): Promise<void> {
  for (const node of nodes) {
    try {
      // Get all workspaces for this node
      const workspaces = await getWorkspacesForNode(node.nodeId);

      // Delete each workspace
      for (const workspace of workspaces) {
        await deleteWorkspaceById(workspace.id);
        logger.info(
          `Deleted workspace ${workspace.id} from node ${node.nodeId}`,
        );
      }
    } catch (error) {
      logger.error(`Error pruning node ${node.nodeId}:`, error);
    }
  }
}

/**
 * Get nodes with their X11 client counts
 */
export async function getNodesWithX11Counts(nodes: Node[]): Promise<Node[]> {
  // First get all workspace IDs and their window counts
  const workspaceCountsMap = new Map<number, number>();

  try {
    // Get all workspaces and their window counts
    const wmctrlOutput = await $`wmctrl -l`;
    const lines = wmctrlOutput.stdout.trim().split("\n");

    // Process each line to count windows per workspace
    for (const line of lines) {
      if (!line.trim()) continue;

      // Extract the workspace ID from the fixed position (index 10-13)
      if (line.length >= 13) {
        const workspaceIdStr = line.substring(10, 14).trim();
        const workspaceId = parseInt(workspaceIdStr, 10);

        if (!isNaN(workspaceId)) {
          // Increment the count for this workspace
          const currentCount = workspaceCountsMap.get(workspaceId) || 0;
          workspaceCountsMap.set(workspaceId, currentCount + 1);

          logger.info(
            `workspaceId: ${workspaceId}   count: ${currentCount + 1}`,
          );
        }
      }
    }
  } catch (error) {
    console.error("Error getting workspace window counts:", error);
  }

  // Get all workspaces from the database
  const allWorkspaces = await getAllWorkspaces();

  // Create a map of nodeId to workspaces
  const nodeWorkspacesMap = new Map<string, WorkspaceDTO[]>();

  // Group workspaces by nodeId
  for (const workspace of allWorkspaces) {
    if (workspace.nodeId) {
      const workspaces = nodeWorkspacesMap.get(workspace.nodeId) || [];
      workspaces.push(workspace);
      nodeWorkspacesMap.set(workspace.nodeId, workspaces);
    }
  }

  // Now map nodes to their workspaces and assign counts
  const nodesWithCounts = await Promise.all(
    nodes.map(async (node) => {
      let totalCount = 0;

      // Get workspaces for this node
      const workspaces = nodeWorkspacesMap.get(node.nodeId) || [];

      // Sum up the window counts for all workspaces associated with this node
      for (const workspace of workspaces) {
        const count = workspaceCountsMap.get(workspace.id) || 0;
        totalCount += count;
      }

      return {
        ...node,
        x11ClientCount: totalCount,
      };
    }),
  );

  // Sort by X11 client count (descending)
  return nodesWithCounts.sort(
    (a, b) => (b.x11ClientCount || 0) - (a.x11ClientCount || 0),
  );
}

registerAction(nodesPrune);
