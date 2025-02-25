import { DuckDBInstance } from "@duckdb/node-api";

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
