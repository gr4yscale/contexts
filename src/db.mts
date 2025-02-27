import { Pool, PoolClient } from 'pg';

// Create a connection pool
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'contexts',
});

let client: PoolClient | null = null;

export async function initializeDB() {
  if (!client) {
    try {
      // Get a client from the pool
      client = await pool.connect();

      // Create migrations table first
      await client.query(`
          CREATE TABLE IF NOT EXISTS migrations (
              id SERIAL PRIMARY KEY,
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

export async function getConnection(): Promise<PoolClient> {
  await initializeDB();
  if (!client) {
    throw new Error("Database connection not initialized");
  }
  return client;
}

export async function closeDB(): Promise<void> {
  try {
    if (client) {
      await client.release();
      client = null;
    }
    await pool.end();
  } catch (error) {
    console.error("Error closing database connection:", error);
    throw error;
  }
}
