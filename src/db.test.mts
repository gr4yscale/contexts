import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { initializeDB, getConnection, closeDB } from "./db.mts";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const isIntegrationTest = process.env.RUN_INTEGRATION_TESTS === "true";

// Skip tests if not running integration tests
const testSuite = isIntegrationTest ? describe : describe.skip;

testSuite("Database Integration Tests", () => {
  // Start the test database container before all tests
  beforeAll(async () => {
    try {
      // Start the database container using docker-compose
      await execAsync("sudo docker-compose -f docker-compose.test.yml up -d");

      // Wait for the database to be ready
      console.log("Waiting for database to be ready...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Initialize the database connection
      await initializeDB();
    } catch (error) {
      console.error("Error setting up test database:", error);
      throw error;
    }
  }, 30000); // Increase timeout for container startup

  // Clean up after all tests
  afterAll(async () => {
    try {
      // Close the database connection
      await closeDB();

      // Stop and remove the database container
      await execAsync("docker-compose -f docker-compose.test.yml down");
    } catch (error) {
      console.error("Error cleaning up test database:", error);
    }
  });

  it("should connect to the database", async () => {
    const client = await getConnection();
    expect(client).toBeDefined();

    // Test a simple query
    const result = await client.query("SELECT 1 as number");
    expect(result.rows[0].number).toBe(1);
  });

  it("should have created the migrations table", async () => {
    const client = await getConnection();

    // Check if migrations table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);

    expect(result.rows[0].exists).toBe(true);
  });

  it("should maintain a persistent connection", async () => {
    // Get connection twice, should be the same client
    const client1 = await getConnection();
    const client2 = await getConnection();

    // Test that we're getting the same client instance
    expect(client1).toBe(client2);

    // Test that the connection works
    const result = await client1.query("SELECT 1 as number");
    expect(result.rows[0].number).toBe(1);
  });
});
