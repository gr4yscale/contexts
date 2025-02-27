import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { initializeDB, getConnection, closeDB } from "../db.mts";
import {
  createActivity,
  getActivityById,
  getAllActivities,
  updateActivity,
  deleteActivity,
  getActiveActivities,
} from "./activity.mts";
import { Activity } from "../types.mts";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);
const isIntegrationTest = process.env.RUN_INTEGRATION_TESTS === "true";

// Skip tests if not running integration tests
const testSuite = isIntegrationTest ? describe : describe.skip;

testSuite("Activity Model Integration Tests", () => {
  // Test activity data
  const testActivity1: Activity = {
    activityId: "test-activity-1",
    name: "Test Activity 1",
    created: new Date(),
    lastAccessed: new Date(),
    active: true,
    orgId: "org-id-1",
    orgText: "* Test Org Text 1",
  };

  const testActivity2: Activity = {
    activityId: "test-activity-2",
    name: "Test Activity 2",
    created: new Date(),
    lastAccessed: new Date(),
    active: false,
    orgId: "org-id-2",
    orgText: "* Test Org Text 2",
  };

  // Create a temporary directory for state files
  const tempDir = path.join(process.cwd(), "temp-test-data");

  // Start the test database container before all tests
  beforeAll(async () => {
    try {
      // Create temp directory for state files
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Create a symbolic link to redirect data directory
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Start the database container using docker-compose
      await execAsync("docker-compose -f docker-compose.test.yml up -d");

      // Wait for the database to be ready
      console.log("Waiting for database to be ready...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Initialize the database connection
      await initializeDB();

      // Create test tables
      const client = await getConnection();

      // Create activities table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS activities (
          activityId VARCHAR PRIMARY KEY,
          orgId VARCHAR,
          orgText TEXT,
          name VARCHAR NOT NULL,
          created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          lastAccessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          active BOOLEAN DEFAULT FALSE
        );
      `);

      // Create state-mini.yml file
      fs.writeFileSync(
        path.join(dataDir, "state-mini.yml"),
        `currentActivityId: ${testActivity1.activityId}\npreviousActivityId: ${testActivity2.activityId}`,
      );
    } catch (error) {
      console.error("Error setting up test database:", error);
      throw error;
    }
  }, 30000); // Increase timeout for container startup

  // Clean up database before each test
  beforeEach(async () => {
    const client = await getConnection();

    // Clear existing data
    await client.query("DELETE FROM activities");
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      const client = await getConnection();

      // Drop test tables
      await client.query("DROP TABLE IF EXISTS activities");

      // Close the database connection
      await closeDB();

      // Stop and remove the database container
      await execAsync("docker-compose -f docker-compose.test.yml down");

      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error("Error cleaning up test database:", error);
    }
  });

  it("should create an activity", async () => {
    // Create an activity
    await createActivity(testActivity1);

    // Verify the activity was created
    const activity = await getActivityById(testActivity1.activityId);
    expect(activity).toBeDefined();
    expect(activity?.activityId).toBe(testActivity1.activityId);
    expect(activity?.name).toBe(testActivity1.name);
    expect(activity?.orgId).toBe(testActivity1.orgId);
    expect(activity?.orgText).toBe(testActivity1.orgText);
    expect(activity?.active).toBe(testActivity1.active);
  });

  it("should get an activity by ID", async () => {
    // Create an activity
    await createActivity(testActivity1);

    // Get the activity by ID
    const activity = await getActivityById(testActivity1.activityId);

    // Verify the activity was retrieved
    expect(activity).toBeDefined();
    expect(activity?.activityId).toBe(testActivity1.activityId);
    expect(activity?.name).toBe(testActivity1.name);
    expect(activity?.orgId).toBe(testActivity1.orgId);
    expect(activity?.orgText).toBe(testActivity1.orgText);
    expect(activity?.active).toBe(testActivity1.active);
  });

  it("should return null when getting a non-existent activity", async () => {
    // Get a non-existent activity
    const activity = await getActivityById("non-existent-id");

    // Verify null was returned
    expect(activity).toBeNull();
  });

  it("should get all activities", async () => {
    // Create test activities
    await createActivity(testActivity1);
    await createActivity(testActivity2);

    // Get all activities
    const activities = await getAllActivities();

    // Verify activities were retrieved
    expect(activities).toHaveLength(2);

    // Find activities by ID
    const activity1 = activities.find(
      (a) => a.activityId === testActivity1.activityId,
    );
    const activity2 = activities.find(
      (a) => a.activityId === testActivity2.activityId,
    );

    expect(activity1).toBeDefined();
    expect(activity1?.name).toBe(testActivity1.name);
    expect(activity1?.active).toBe(testActivity1.active);

    expect(activity2).toBeDefined();
    expect(activity2?.name).toBe(testActivity2.name);
    expect(activity2?.active).toBe(testActivity2.active);
  });

  it("should update an activity", async () => {
    // Create an activity
    await createActivity(testActivity1);

    // Update the activity
    const updatedName = "Updated Activity Name";
    const updatedOrgText = "* Updated Org Text";
    await updateActivity({
      activityId: testActivity1.activityId,
      name: updatedName,
      orgText: updatedOrgText,
      active: false,
    });

    // Get the updated activity
    const activity = await getActivityById(testActivity1.activityId);

    // Verify the activity was updated
    expect(activity).toBeDefined();
    expect(activity?.name).toBe(updatedName);
    expect(activity?.orgText).toBe(updatedOrgText);
    expect(activity?.active).toBe(false);
    // Verify other fields weren't changed
    expect(activity?.orgId).toBe(testActivity1.orgId);
  });

  it("should delete an activity", async () => {
    // Create an activity
    await createActivity(testActivity1);

    // Delete the activity
    await deleteActivity(testActivity1.activityId);

    // Try to get the deleted activity
    const activity = await getActivityById(testActivity1.activityId);

    // Verify the activity was deleted
    expect(activity).toBeNull();
  });

  it("should get active activities", async () => {
    // Create test activities (one active, one inactive)
    await createActivity(testActivity1); // active: true
    await createActivity(testActivity2); // active: false

    // Get active activities
    const activities = await getActiveActivities();

    // Verify only active activities were retrieved
    expect(activities).toHaveLength(1);
    expect(activities[0].activityId).toBe(testActivity1.activityId);
    expect(activities[0].active).toBe(true);
  });

  it("should handle empty results", async () => {
    // Get all activities from empty table
    const activities = await getAllActivities();

    // Verify empty array was returned
    expect(activities).toHaveLength(0);
  });
});
