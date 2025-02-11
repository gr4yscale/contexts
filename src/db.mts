import { DuckDBInstance } from "@duckdb/node-api";

let instance: DuckDBInstance;
let connection: any;

export async function initializeDB() {
  if (!connection) {
    try {
      instance = await DuckDBInstance.create("database.db");
      connection = await instance.connect();

      // Create sequence for workspace IDs
      await connection.run(`
            CREATE SEQUENCE IF NOT EXISTS workspace_id_seq
            START 1
            INCREMENT 1
            MAXVALUE 32
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
