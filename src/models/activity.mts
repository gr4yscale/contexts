import { Activity } from "../types.mts";
import { getConnection } from "../db.mts";
// Hack
import { fs } from "zx";
import { parse, stringify } from "yaml";

type ActivityHistoryDoc = {
  currentActivityId: string;
  previousActivityId: string;
};

export default async function activityDTO() {
  const connection = await getConnection();

  async function createActivity(activity: Activity): Promise<void> {
    const {
      activityId,
      orgId,
      orgText,
      name,
      dwmTag,
      created,
      lastAccessed,
      active,
    } = activity;

    try {
      await connection.run(
        `
              INSERT INTO activities (
                  activityId, orgId, orgText, name, dwmTag, created, lastAccessed,
                  active
              ) VALUES 
              (?, ?, ?, ?, ?, ?, ?, ?);
          `,
        [
          activityId,
          orgId ?? "",
          orgText ?? "",
          name,
          dwmTag ?? 100,
          created.toISOString(),
          lastAccessed.toISOString(),
          active,
        ],
      );
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  }

  async function getActivityById(activityId: string): Promise<Activity | null> {
    try {
      const result = await connection.run(
        "SELECT * FROM activities WHERE activityId = ?;",
        [activityId],
      );

      const rows = await result.fetchAllChunks();
      if (rows.length === 0 || rows[0].rowCount === 0) {
        return null;
      }

      const row = rows[0].getRows()[0];
      return {
        activityId: row[0],
        orgId: row[1],
        orgText: row[2],
        name: row[3],
        dwmTag: row[4],
        created: new Date(row[5]),
        lastAccessed: new Date(row[6]),
        active: row[7],
      };
    } catch (error) {
      console.error("Error getting activity:", error);
      throw error;
    }
  }

  async function getAllActivities(): Promise<Activity[]> {
    try {
      const result = await connection.run("SELECT * FROM activities;");
      const rows = await result.fetchAllChunks();

      if (rows.length === 0) {
        return [];
      }

      return rows[0].getRows().map((row: any) => ({
        activityId: row[0],
        orgId: row[1],
        orgText: row[2],
        name: row[3],
        dwmTag: row[4],
        created: new Date(row[5]),
        lastAccessed: new Date(row[6]),
        active: row[7],
      }));
    } catch (error) {
      console.error("Error getting all activities:", error);
      throw error;
    }
  }

  async function updateActivity(activity: Activity): Promise<void> {
    try {
      await connection.run(
        `
              UPDATE activities SET
                  orgId = ?,
                  orgText = ?,
                  name = ?,
                  dwmTag = ?,
                  lastAccessed = ?,
                  active = ?
              WHERE activityId = ?;
          `,
        [
          activity.orgId,
          activity.orgText,
          activity.name,
          activity.dwmTag,
          activity.lastAccessed,
          activity.active,
          activity.activityId,
        ],
      );
    } catch (error) {
      console.error("Error updating activity:", error);
      throw error;
    }
  }

  async function deleteActivity(activityId: string): Promise<void> {
    try {
      await connection.run("DELETE FROM activities WHERE activityId = ?;", [
        activityId,
      ]);
    } catch (error) {
      console.error("Error deleting activity:", error);
      throw error;
    }
  }

  async function getActiveActivities(): Promise<Activity[]> {
    try {
      const result = await connection.run(
        "SELECT * FROM activities WHERE active = true;",
      );
      const rows = await result.fetchAllChunks();

      if (rows.length === 0) {
        return [];
      }

      return rows[0].getRows().map((row: any) => ({
        activityId: row[0],
        orgId: row[1],
        orgText: row[2],
        name: row[3],
        dwmTag: row[4],
        created: new Date(row[5]),
        lastAccessed: new Date(row[6]),
        active: row[7],
      }));
    } catch (error) {
      console.error("Error getting active activities:", error);
      throw error;
    }
  }

  // TOFIX hack
  async function updateActivityHistory(
    currentActivityId: string,
    previousActivityId: string,
  ): Promise<void> {
    try {
      const state: ActivityHistoryDoc = {
        currentActivityId,
        previousActivityId,
      };
      const stringified = stringify(state);
      fs.writeFileSync("./state-mini.yml", stringified);
    } catch (error) {
      console.error("Error updating activity state:", error);
      throw error;
    }
  }

  async function getCurrentActivity(): Promise<Activity | null> {
    try {
      const file = fs.readFileSync("./state-mini.yml", "utf8");
      const parsed = parse(file) as ActivityHistoryDoc;
      const currentActivityId = parsed["currentActivityId"] as string;
      return getActivityById(currentActivityId);
    } catch (error) {
      console.error("Error retrieving current activity:", error);
      throw error;
    }
  }

  async function getPreviousActivity(): Promise<Activity | null> {
    try {
      const file = fs.readFileSync("./state-mini.yml", "utf8");
      const parsed = parse(file) as ActivityHistoryDoc;
      const previousActivityId = parsed["previousActivityId"] as string;
      return getActivityById(previousActivityId);
    } catch (error) {
      console.error("Error retrieving previous activity:", error);
      throw error;
    }
  }

  return {
    createActivity,
    getActivityById,
    getAllActivities,
    updateActivity,
    deleteActivity,
    getActiveActivities,
    updateActivityHistory,
    getCurrentActivity,
    getPreviousActivity,
  };
}
