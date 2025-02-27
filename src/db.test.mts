import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getConnection } from "./db.mts";
import { setupTestDatabase, teardownTestDatabase } from "./testUtils.mts";

const isIntegrationTest = process.env.RUN_INTEGRATION_TESTS === "true";

// Skip tests if not running integration tests
const testSuite = isIntegrationTest ? describe : describe.skip;

testSuite("Database Integration Tests", () => {
  // Setup database once before all tests
  beforeAll(async () => {
    await setupTestDatabase();
  }, 30000); // Increase timeout for container startup

  // Always teardown after tests
  afterAll(async () => {
    await teardownTestDatabase();
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
