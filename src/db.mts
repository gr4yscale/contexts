import { DuckDBInstance } from "@duckdb/node-api";

// Types

export type ActivityDTO = {
  activityId: string;
  orgId?: string;
  orgText?: string;
  name: string;
  dwmTag?: number;
  created: Date;
  lastAccessed: Date;
  active: boolean;
};

// Database initialization
let instance: DuckDBInstance;
let connection: any;

export async function initializeDB() {
  try {
    instance = await DuckDBInstance.create("database.db");
    connection = await instance.connect();

    // Create Activity table
    await connection.run(`
            CREATE TABLE IF NOT EXISTS activities (
                activityId VARCHAR PRIMARY KEY,
                orgId VARCHAR NULL,
                orgText VARCHAR NULL,
                name VARCHAR,
                dwmTag INTEGER NULL,
                created TIMESTAMP,
                lastAccessed TIMESTAMP,
                active BOOLEAN,
            );
        `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Activity DTO methods
export async function createActivity(activity: ActivityDTO): Promise<void> {
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
    //console.error("Error creating activity:", error);

    console.log(activity);
    throw error;
  }
}

export async function getActivityById(
  activityId: string,
): Promise<ActivityDTO | null> {
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

export async function getAllActivities(): Promise<ActivityDTO[]> {
  try {
    const result = await connection.run("SELECT * FROM activities;");
    const rows = await result.fetchAllChunks();

    if (rows.length === 0) {
      return [];
    }

    return rows[0].getRows().map((row) => ({
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

export async function updateActivity(activity: ActivityDTO): Promise<void> {
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

export async function deleteActivity(activityId: string): Promise<void> {
  try {
    await connection.run("DELETE FROM activities WHERE activityId = ?;", [
      activityId,
    ]);
  } catch (error) {
    console.error("Error deleting activity:", error);
    throw error;
  }
}

export async function getActiveActivities(): Promise<ActivityDTO[]> {
  try {
    const result = await connection.run(
      "SELECT * FROM activities WHERE active = true;",
    );
    const rows = await result.fetchAllChunks();

    if (rows.length === 0) {
      return [];
    }

    return rows[0].getRows().map((row) => ({
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

// Close database connection
export async function closeDB(): Promise<void> {
  try {
    if (connection) {
      await connection.close();
    }
  } catch (error) {
    console.error("Error closing database connection:", error);
    throw error;
  }
}
