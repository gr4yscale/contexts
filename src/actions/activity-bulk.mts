import { $ } from "zx";
import { registerAction, ActionType } from "../actions.mts";
import { Activity, ActivityDTO } from "../types.mts";
import { deleteActivity } from "../models/activity.mts";

// Cache for X11 client counts per workspace
interface X11ClientCount {
  count: number;
  lastUpdated: Date;
}

const x11ClientCountCache = new Map<string, X11ClientCount>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Bulk delete activities
 */
registerAction({
  id: "activitiesPrune",
  name: "Prune Activities",
  type: ActionType.BASE,
  handler: async () => {
    // The actual deletion will be handled by the UI component
    // This action just triggers the UI to show
  },
});

/**
 * Execute the pruning of selected activities
 */
export async function pruneActivities(
  activities: ActivityDTO[],
): Promise<void> {
  for (const activity of activities) {
    await deleteActivity(activity.activityId);
  }
}

/**
 * Get activities with their X11 client counts
 */
export async function getActivitiesWithX11Counts(
  activities: Activity[],
): Promise<Activity[]> {
  const activitiesWithCounts = await Promise.all(
    activities.map(async (activity) => {
      const count = await getX11ClientCount(activity.name);
      return {
        ...activity,
        x11ClientCount: count,
      };
    }),
  );

  // Sort by X11 client count (descending)
  return activitiesWithCounts.sort(
    (a, b) => (b.x11ClientCount || 0) - (a.x11ClientCount || 0),
  );
}
