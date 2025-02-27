import { exec } from "child_process";
import { promisify } from "util";
import { initializeDB, closeDB } from "./db.mts";
import { runMigrations } from "./migrations.mts";

export const execAsync = promisify(exec);

// Helper function to start the test database
export async function startTestDatabase() {
  try {
    // Start the database container using docker-compose
    await execAsync("docker-compose -f docker-compose.test.yml up -d");

    // Wait for the database to be ready
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Initialize the database connection
    await initializeDB();

    // Run migrations to set up the database schema
    await runMigrations();
  } catch (error) {
    console.error("Error setting up test database:", error);
    throw error;
  }
}

// Helper function to stop the test database
export async function stopTestDatabase() {
  try {
    // Close the database connection
    await closeDB();

    // Stop and remove the database container
    await execAsync("docker-compose -f docker-compose.test.yml down");
  } catch (error) {
    console.error("Error cleaning up test database:", error);
    throw error;
  }
}

// Global setup and teardown for all test suites
let databaseStarted = false;

export async function setupTestDatabase() {
  if (!databaseStarted) {
    await startTestDatabase();
    databaseStarted = true;
  }
}

export async function teardownTestDatabase() {
  if (databaseStarted) {
    await stopTestDatabase();
    databaseStarted = false;
  }
}
