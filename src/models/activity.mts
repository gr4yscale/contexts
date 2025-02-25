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
      created,
      lastAccessed,
      active,
    } = activity;

    try {
      await connection.run(
        `
              INSERT INTO activities (
                  activityId, orgId, orgText, name, created, lastAccessed,
                  active
              ) VALUES 
              (?, ?, ?, ?, ?, ?, ?);
          `,
        [
          activityId,
          orgId ?? "",
          orgText ?? "",
          name,
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
        created: new Date(row[4]),
        lastAccessed: new Date(row[5]),
        active: row[6],
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
        created: new Date(row[4]),
        lastAccessed: new Date(row[5]),
        active: row[6],
      }));
    } catch (error) {
      console.error("Error getting all activities:", error);
      throw error;
    }
  }

  async function updateActivity(activity: Partial<Activity>): Promise<void> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      const { orgId, orgText, name, lastAccessed, active, activityId } =
        activity;

      const fieldMappings: [string, any][] = [
        ["orgId = ?", orgId],
        ["orgText = ?", orgText],
        ["name = ?", name],
        ["lastAccessed = ?", lastAccessed?.toISOString()],
        ["active = ?", active],
      ];

      fieldMappings.forEach(([field, value]) => {
        if (value !== undefined) {
          fields.push(field);
          values.push(value);
        }
      });

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(activityId);

      const query = `UPDATE activities SET ${fields.join(
        ", ",
      )} WHERE activityId = ?;`;

      await connection.run(query, values);
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
        created: new Date(row[4]),
        lastAccessed: new Date(row[5]),
        active: row[6],
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
      fs.writeFileSync("./data/state-mini.yml", stringified);
    } catch (error) {
      console.error("Error updating activity state:", error);
      throw error;
    }
  }

  async function getCurrentActivity(): Promise<Activity | null> {
    try {
      const file = fs.readFileSync("./data/state-mini.yml", "utf8");
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
      const file = fs.readFileSync("./data/state-mini.yml", "utf8");
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
