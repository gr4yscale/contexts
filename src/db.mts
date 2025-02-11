import { DuckDBInstance } from "@duckdb/node-api";

let instance: DuckDBInstance;
let connection: any;

export async function initializeDB() {
  if (!connection) {
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
