import { DuckDBInstance } from "@duckdb/node-api";

// Types
export type Link = {
  id: string;
  url: string;
  title: string;
  description?: string;
  created: Date;
  accessed: Date;
  sticky: boolean;
};

export type ActivityDTO = {
  activityId: string;
  orgId: string;
  orgText: string;
  name: string;
  dwmTag?: number;
  created: Date;
  lastAccessed: Date;
  active: boolean;
  scripts: string[];
  tags: string[];
  links: Link[];
  actions: string[];
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
                orgId VARCHAR,
                orgText TEXT,
                name VARCHAR,
                dwmTag INTEGER,
                created TIMESTAMP,
                lastAccessed TIMESTAMP,
                active BOOLEAN,
                scripts JSON,
                tags JSON,
                links JSON,
                actions JSON
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
    scripts,
    tags,
    links,
    actions,
  } = activity;

  try {
    await connection.run(
      `
            INSERT INTO activities (
                activityId, orgId, orgText, name, dwmTag, created, lastAccessed,
                active, scripts, tags, links, actions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
      [
        activityId,
        orgId,
        orgText,
        name,
        dwmTag,
        created,
        lastAccessed,
        active,
        JSON.stringify(scripts),
        JSON.stringify(tags),
        JSON.stringify(links),
        JSON.stringify(actions),
      ],
    );
  } catch (error) {
    console.error("Error creating activity:", error);
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
      scripts: JSON.parse(row[8]),
      tags: JSON.parse(row[9]),
      links: JSON.parse(row[10]),
      actions: JSON.parse(row[11]),
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
      scripts: JSON.parse(row[8]),
      tags: JSON.parse(row[9]),
      links: JSON.parse(row[10]),
      actions: JSON.parse(row[11]),
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
                active = ?,
                scripts = ?,
                tags = ?,
                links = ?,
                actions = ?
            WHERE activityId = ?;
        `,
      [
        activity.orgId,
        activity.orgText,
        activity.name,
        activity.dwmTag,
        activity.lastAccessed,
        activity.active,
        JSON.stringify(activity.scripts),
        JSON.stringify(activity.tags),
        JSON.stringify(activity.links),
        JSON.stringify(activity.actions),
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
    const result = await connection.run("SELECT * FROM activities WHERE active = true;");
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
      scripts: JSON.parse(row[8]),
      tags: JSON.parse(row[9]),
      links: JSON.parse(row[10]),
      actions: JSON.parse(row[11]),
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
