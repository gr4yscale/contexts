import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getConnection } from "../db.mts";
import {
  getAllWorkspaces,
  createWorkspaceForActivity,
  updateWorkspace,
  assignWorkspaceToActivity,
  getWorkspacesForActivity,
  getWorkspaceById,
  deleteWorkspaceById,
} from "./workspace.mts";
import { setupTestDatabase, teardownTestDatabase } from "../testUtils.mts";

const isIntegrationTest = process.env.RUN_INTEGRATION_TESTS === "true";

// Skip tests if not running integration tests
const testSuite = isIntegrationTest ? describe : describe.skip;

testSuite("Workspace Model Integration Tests", () => {
  // Test activity IDs
  const testActivityId1 = "test-activity-1";
  const testActivityId2 = "test-activity-2";

  // Setup database and test tables
  beforeAll(async () => {
    try {
      // Setup shared database
      await setupTestDatabase();
    } catch (error) {
      console.error("Error setting up test database:", error);
      throw error;
    }
  }, 30000); // Increase timeout for container startup

  // Clean up database before each test
  beforeEach(async () => {
    const client = await getConnection();

    // Clear existing data
    await client.query("DELETE FROM workspaces");
    await client.query("DELETE FROM activities");

    // Reset sequences
    await client.query("ALTER SEQUENCE workspace_id_seq RESTART WITH 1");

    // Insert test activities
    await client.query(
      "INSERT INTO activities (activityId, name) VALUES ($1, $2), ($3, $4)",
      [testActivityId1, "Test Activity 1", testActivityId2, "Test Activity 2"],
    );
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      const client = await getConnection();

      // Drop test tables
      await client.query("DROP TABLE IF EXISTS workspaces CASCADE");
      await client.query("DROP TABLE IF EXISTS activities CASCADE");

      // Always teardown after tests
      await teardownTestDatabase();
    } catch (error) {
      console.error("Error cleaning up test database:", error);
    }
  });

  it("should create a workspace for an activity", async () => {
    // Create a workspace
    const workspace = await createWorkspaceForActivity(
      testActivityId1,
      "Test Workspace",
    );

    // Verify the workspace was created
    expect(workspace).toBeDefined();
    expect(workspace.id).toBe(1);
    expect(workspace.activityId).toBe(testActivityId1);
    expect(workspace.name).toBe("Test Workspace");
  });

  it("should get all workspaces", async () => {
    // Create test workspaces
    await createWorkspaceForActivity(testActivityId1, "Workspace 1");
    await createWorkspaceForActivity(testActivityId2, "Workspace 2");

    // Get all workspaces
    const workspaces = await getAllWorkspaces();

    // Verify workspaces were retrieved
    expect(workspaces).toHaveLength(2);
    expect(workspaces[0].name).toBe("Workspace 1");
    expect(workspaces[0].activityId).toBe(testActivityId1);
    expect(workspaces[0].activityName).toBe("Test Activity 1");
    expect(workspaces[1].name).toBe("Workspace 2");
    expect(workspaces[1].activityId).toBe(testActivityId2);
    expect(workspaces[1].activityName).toBe("Test Activity 2");
  });

  it("should update a workspace", async () => {
    // Create a workspace
    const workspace = await createWorkspaceForActivity(
      testActivityId1,
      "Original Name",
    );

    // Update the workspace
    await updateWorkspace({
      id: workspace.id,
      name: "Updated Name",
    });

    // Get the updated workspace
    const updatedWorkspace = await getWorkspaceById(workspace.id);

    // Verify the workspace was updated
    expect(updatedWorkspace.name).toBe("Updated Name");
    expect(updatedWorkspace.activityId).toBe(testActivityId1);
  });

  it("should assign a workspace to a different activity", async () => {
    // Create a workspace
    const workspace = await createWorkspaceForActivity(
      testActivityId1,
      "Test Workspace",
    );

    // Assign the workspace to a different activity
    await assignWorkspaceToActivity(workspace.id, testActivityId2);

    // Get the updated workspace
    const updatedWorkspace = await getWorkspaceById(workspace.id);

    // Verify the workspace was assigned to the new activity
    expect(updatedWorkspace.activityId).toBe(testActivityId2);
    expect(updatedWorkspace.activityName).toBe("Test Activity 2");
  });

  it("should get workspaces for a specific activity", async () => {
    // Create test workspaces
    await createWorkspaceForActivity(testActivityId1, "Activity 1 Workspace 1");
    await createWorkspaceForActivity(testActivityId1, "Activity 1 Workspace 2");
    await createWorkspaceForActivity(testActivityId2, "Activity 2 Workspace");

    // Get workspaces for activity 1
    const workspaces = await getWorkspacesForActivity(testActivityId1);

    // Verify only workspaces for activity 1 were retrieved
    expect(workspaces).toHaveLength(2);
    expect(workspaces[0].name).toBe("Activity 1 Workspace 1");
    expect(workspaces[1].name).toBe("Activity 1 Workspace 2");
    expect(workspaces[0].activityId).toBe(testActivityId1);
    expect(workspaces[1].activityId).toBe(testActivityId1);
  });

  it("should get a workspace by ID", async () => {
    // Create a workspace
    const workspace = await createWorkspaceForActivity(
      testActivityId1,
      "Test Workspace",
    );

    // Get the workspace by ID
    const retrievedWorkspace = await getWorkspaceById(workspace.id);

    // Verify the workspace was retrieved
    expect(retrievedWorkspace).toBeDefined();
    expect(retrievedWorkspace.id).toBe(workspace.id);
    expect(retrievedWorkspace.name).toBe("Test Workspace");
    expect(retrievedWorkspace.activityId).toBe(testActivityId1);
    expect(retrievedWorkspace.activityName).toBe("Test Activity 1");
  });

  it("should delete a workspace by ID", async () => {
    // Create a workspace
    const workspace = await createWorkspaceForActivity(
      testActivityId1,
      "Test Workspace",
    );

    // Delete the workspace
    await deleteWorkspaceById(workspace.id);

    // Try to get the deleted workspace
    const workspaces = await getAllWorkspaces();

    // Verify the workspace was deleted
    expect(workspaces).toHaveLength(0);

    // Verify getWorkspaceById throws an error
    await expect(getWorkspaceById(workspace.id)).rejects.toThrow(
      `Workspace with id ${workspace.id} not found`,
    );
  });

  it("should handle creating multiple workspaces with unique IDs", async () => {
    // Create multiple workspaces
    const workspace1 = await createWorkspaceForActivity(
      testActivityId1,
      "Workspace 1",
    );
    const workspace2 = await createWorkspaceForActivity(
      testActivityId1,
      "Workspace 2",
    );
    const workspace3 = await createWorkspaceForActivity(
      testActivityId2,
      "Workspace 3",
    );

    // Verify each workspace has a unique ID
    expect(workspace1.id).not.toBe(workspace2.id);
    expect(workspace1.id).not.toBe(workspace3.id);
    expect(workspace2.id).not.toBe(workspace3.id);

    // Get all workspaces
    const workspaces = await getAllWorkspaces();

    // Verify all workspaces were created
    expect(workspaces).toHaveLength(3);
  });
});
