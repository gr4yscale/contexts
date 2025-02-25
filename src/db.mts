import { DuckDBInstance } from "@duckdb/node-api";
import { runMigrations } from "./migrations.mts";

let instance: DuckDBInstance;
let connection: any;

export async function initializeDB() {
  if (!connection) {
    try {
      instance = await DuckDBInstance.create("data/database.db");
      connection = await instance.connect();

      // Create migrations table first
      await connection.run(`
          CREATE TABLE IF NOT EXISTS migrations (
              id INTEGER PRIMARY KEY,
              name VARCHAR NOT NULL,
              applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
      `);

      // Create sequence for workspace IDs
      // 1-29 is the index range of tags in my dwm setup which
      // are available to allocate dynamically.
      // 0 is reserved for the TUI of this program
      // trying to view indexes above 29 using my dwm build's IPC interface fails
      // this seems arbitrary but is likely due to how I've patched dwm; will investigate
      await connection.run(`
            CREATE SEQUENCE IF NOT EXISTS workspace_id_seq
            START 1
            INCREMENT 1
            MAXVALUE 29
            CYCLE;
        `);

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
                active BOOLEAN
            );
        `);

      // Create Workspace table
      await connection.run(`
            CREATE TABLE IF NOT EXISTS workspaces (
                id INTEGER PRIMARY KEY DEFAULT nextval('workspace_id_seq'),
                activityId VARCHAR NULL,
                name VARCHAR NULL,
                FOREIGN KEY (activityId) REFERENCES activities(activityId)
            );
        `);

      // Run migrations after basic tables are created
      await runMigrations();
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }
}

export async function getConnection(): Promise<any> {
  await initializeDB();
  return connection;
}

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
