import pg from "pg";
import * as logger from "./logger.mts";

const { Pool } = pg;
type PoolClient = pg.PoolClient;

const isIntegrationTest = process.env.RUN_INTEGRATION_TESTS === "true";

// TODO: fix hackiness

// Create a connection pool
const pool = isIntegrationTest
  ? new Pool({
      host: "localhost",
      port: 1337,
      user: "postgres",
      password: "postgres",
      database: "contexts-test",
    })
  : new Pool({
      host: "localhost",
      port: 1336,
      user: "postgres",
      password: "postgres",
      database: "contexts",
    });

let client: PoolClient | null = null;

export async function initializeDB() {
  if (!client) {
    try {
      logger.info("Initializing database connection");
      // Get a client from the pool
      client = await pool.connect();
      logger.info("Database connection established");

      // Create migrations table first
      await client.query(`
          CREATE TABLE IF NOT EXISTS migrations (
              id SERIAL PRIMARY KEY,
              name VARCHAR NOT NULL,
              applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
      `);
      logger.info("Migrations table verified");
    } catch (error) {
      logger.error("Error initializing database:", error);
      throw error;
    }
  }
}

export async function getConnection(): Promise<PoolClient> {
  await initializeDB();
  if (!client) {
    throw new Error("Database connection not initialized");
  }
  return client;
}

export async function closeDB(): Promise<void> {
  try {
    logger.info("Closing database connections");
    if (client) {
      await client.release();
      client = null;
    }
    await pool.end();
    logger.info("Database connections closed");
  } catch (error) {
    logger.error("Error closing database connection:", error);
    throw error;
  }
}
