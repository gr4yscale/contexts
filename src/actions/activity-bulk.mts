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
  type: ActionType.ACTIVITY_BULK;
  handler: () => Promise<void> | void;
}

/**
 * Bulk delete activities
 */
export const activitiesPrune: NodeBulkAction = {
  id: "activitiesPrune",
  name: "Prune Nodes",
  type: ActionType.ACTIVITY_BULK,
  handler: async () => {
    await $`dwmc viewex 0`; // TOFIX: shared showTUI func
    // The actual pruning will be handled by callbacks in the UI
    // This action just triggers the UI to show
  },
};

/**
 * Execute the pruning of selected activities
 */
export async function pruneNodes(
  activities: NodeDTO[],
): Promise<void> {
  for (const activity of activities) {
    try {
      // Get all workspaces for this activity
      const workspaces = await getWorkspacesForNode(activity.activityId);

      // Delete each workspace
      for (const workspace of workspaces) {
        await deleteWorkspaceById(workspace.id);
        logger.info(
          `Deleted workspace ${workspace.id} from activity ${activity.activityId}`,
        );
      }
    } catch (error) {
      logger.error(`Error pruning activity ${activity.activityId}:`, error);
    }
  }
}

/**
 * Get activities with their X11 client counts
 */
export async function getNodesWithX11Counts(
  activities: Node[],
): Promise<Node[]> {
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

  // Create a map of activityId to workspaces
  const activityWorkspacesMap = new Map<string, WorkspaceDTO[]>();

  // Group workspaces by activityId
  for (const workspace of allWorkspaces) {
    if (workspace.activityId) {
      const workspaces = activityWorkspacesMap.get(workspace.activityId) || [];
      workspaces.push(workspace);
      activityWorkspacesMap.set(workspace.activityId, workspaces);
    }
  }

  // Now map activities to their workspaces and assign counts
  const activitiesWithCounts = await Promise.all(
    activities.map(async (activity) => {
      let totalCount = 0;

      // Get workspaces for this activity
      const workspaces = activityWorkspacesMap.get(activity.activityId) || [];

      // Sum up the window counts for all workspaces associated with this activity
      for (const workspace of workspaces) {
        const count = workspaceCountsMap.get(workspace.id) || 0;
        totalCount += count;
      }

      return {
        ...activity,
        x11ClientCount: totalCount,
      };
    }),
  );

  // Sort by X11 client count (descending)
  return activitiesWithCounts.sort(
    (a, b) => (b.x11ClientCount || 0) - (a.x11ClientCount || 0),
  );
}

registerAction(activitiesPrune);
