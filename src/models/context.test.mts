import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getConnection } from "../db.mts";
import {
  createContext,
  getContextById,
  getAllContexts,
  updateContext,
  deleteContext,
  addNodeToLatestContext,
  removeNodeFromLatestContext,
  getContextNodes,
  getCurrentContext,
  getCurrentContextNodes,
} from "./context.mts";
import { createNode } from "./activity.mts";
import { Node, Context } from "../types.mts";
import { setupTestDatabase, teardownTestDatabase } from "../testUtils.mts";

const isIntegrationTest = process.env.RUN_INTEGRATION_TESTS === "true";

// Skip tests if not running integration tests
const testSuite = isIntegrationTest ? describe : describe.skip;

testSuite("Context Model Integration Tests", () => {
  // Test context data
  const testContext1: Omit<Context, "contextId" | "created"> = {
    name: "Test Context 1",
    activityIds: [],
  };

  const testContext2: Omit<Context, "contextId" | "created"> = {
    name: "Test Context 2",
    activityIds: [],
  };

  // Test activity data
  const testNode1: Node = {
    activityId: "test-activity-1",
    name: "Test Node 1",
    created: new Date(),
    lastAccessed: new Date(),
    active: true,
    orgId: "org-id-1",
    orgText: "* Test Org Text 1",
  };

  const testNode2: Node = {
    activityId: "test-activity-2",
    name: "Test Node 2",
    created: new Date(),
    lastAccessed: new Date(),
    active: false,
    orgId: "org-id-2",
    orgText: "* Test Org Text 2",
  };

  // Setup database and test environment
  beforeAll(async () => {
    try {
      // Setup shared database
      await setupTestDatabase();
    } catch (error) {
      console.error("Error setting up test environment:", error);
      throw error;
    }
  }, 30000); // Increase timeout for container startup

  // Clean up database before each test
  beforeEach(async () => {
    const client = await getConnection();

    // Clear existing data
    await client.query("DELETE FROM context_activities");
    await client.query("DELETE FROM contexts");
    await client.query("DELETE FROM activities");
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      await teardownTestDatabase();
    } catch (error) {
      console.error("Error cleaning up test environment:", error);
    }
  });

  it("should create a context", async () => {
    // Create a context
    const context = await createContext(testContext1);

    // Verify the context was created
    expect(context).toBeDefined();
    expect(context.contextId).toBeDefined();
    expect(context.name).toBe(testContext1.name);
    expect(context.created).toBeInstanceOf(Date);
    expect(context.activityIds).toEqual([]);
  });

  it("should create a context with activities", async () => {
    // Create test activities
    await createNode(testNode1);
    await createNode(testNode2);

    // Create context with activities
    const contextWithNodes = await createContext({
      name: "Context with Nodes",
      activityIds: [testNode1.activityId, testNode2.activityId],
    });

    // Verify the context was created with activities
    expect(contextWithNodes).toBeDefined();
    expect(contextWithNodes.activityIds).toHaveLength(2);
    expect(contextWithNodes.activityIds).toContain(
      testNode1.activityId,
    );
    expect(contextWithNodes.activityIds).toContain(
      testNode2.activityId,
    );
  });

  it("should get a context by ID", async () => {
    // Create a context
    const createdContext = await createContext(testContext1);

    // Get the context by ID
    const context = await getContextById(createdContext.contextId);

    // Verify the context was retrieved
    expect(context).toBeDefined();
    expect(context?.contextId).toBe(createdContext.contextId);
    expect(context?.name).toBe(testContext1.name);
    expect(context?.created).toBeInstanceOf(Date);
    expect(context?.activityIds).toEqual([]);
  });

  it("should return null when getting a non-existent context", async () => {
    // Get a non-existent context
    const context = await getContextById("non-existent-id");

    // Verify null was returned
    expect(context).toBeNull();
  });

  it("should get all contexts", async () => {
    // Create test contexts
    const context1 = await createContext(testContext1);
    const context2 = await createContext(testContext2);

    // Get all contexts
    const contexts = await getAllContexts();

    // Verify contexts were retrieved
    expect(contexts).toHaveLength(2);

    // Find contexts by ID
    const retrievedContext1 = contexts.find(
      (c) => c.contextId === context1.contextId,
    );
    const retrievedContext2 = contexts.find(
      (c) => c.contextId === context2.contextId,
    );

    expect(retrievedContext1).toBeDefined();
    expect(retrievedContext1?.name).toBe(testContext1.name);

    expect(retrievedContext2).toBeDefined();
    expect(retrievedContext2?.name).toBe(testContext2.name);
  });

  it("should update a context name", async () => {
    // Create a context
    const createdContext = await createContext(testContext1);

    // Update the context name
    const updatedName = "Updated Context Name";
    await updateContext({
      contextId: createdContext.contextId,
      name: updatedName,
    });

    // Get the updated context
    const context = await getContextById(createdContext.contextId);

    // Verify the context was updated
    expect(context).toBeDefined();
    expect(context?.name).toBe(updatedName);
    // Verify other fields weren't changed
    expect(context?.contextId).toBe(createdContext.contextId);
    expect(context?.activityIds).toEqual([]);
  });

  it("should update context activities", async () => {
    // Create test activities
    await createNode(testNode1);
    await createNode(testNode2);

    // Create a context without activities
    const createdContext = await createContext(testContext1);

    // Update the context to add activities
    await updateContext({
      contextId: createdContext.contextId,
      activityIds: [testNode1.activityId, testNode2.activityId],
    });

    // Get the updated context
    const context = await getContextById(createdContext.contextId);

    // Verify the context activities were updated
    expect(context).toBeDefined();
    expect(context?.activityIds).toHaveLength(2);
    expect(context?.activityIds).toContain(testNode1.activityId);
    expect(context?.activityIds).toContain(testNode2.activityId);
    // Verify name wasn't changed
    expect(context?.name).toBe(testContext1.name);
  });

  it("should delete a context", async () => {
    // Create a context
    const createdContext = await createContext(testContext1);

    // Delete the context
    await deleteContext(createdContext.contextId);

    // Try to get the deleted context
    const context = await getContextById(createdContext.contextId);

    // Verify the context was deleted
    expect(context).toBeNull();
  });

  it("should add an activity to the latest context", async () => {
    // Create a test activity
    await createNode(testNode1);

    // Create a context without activities
    const createdContext = await createContext(testContext1);

    // Add the activity to the latest context
    await addNodeToLatestContext(testNode1.activityId);

    // Get the updated context
    const context = await getContextById(createdContext.contextId);

    // Verify the activity was added to the context
    expect(context).toBeDefined();
    expect(context?.activityIds).toHaveLength(1);
    expect(context?.activityIds[0]).toBe(testNode1.activityId);
  });

  it("should remove an activity from the latest context", async () => {
    // Create a test activity
    await createNode(testNode1);

    // Create a context with the activity
    const createdContext = await createContext({
      name: testContext1.name,
      activityIds: [testNode1.activityId],
    });

    // Verify the activity is in the context
    const contextBefore = await getContextById(createdContext.contextId);
    expect(contextBefore?.activityIds).toContain(testNode1.activityId);

    // Remove the activity from the latest context
    await removeNodeFromLatestContext(testNode1.activityId);

    // Get the updated context
    const contextAfter = await getContextById(createdContext.contextId);

    // Verify the activity was removed from the context
    expect(contextAfter).toBeDefined();
    expect(contextAfter?.activityIds).toHaveLength(0);
  });

  it("should throw an error when adding activity to latest context if no contexts exist", async () => {
    // Create a test activity
    await createNode(testNode1);

    // Try to add the activity to the latest context when no contexts exist
    await expect(
      addNodeToLatestContext(testNode1.activityId),
    ).rejects.toThrow("No contexts found");
  });

  it("should throw an error when removing activity from latest context if no contexts exist", async () => {
    // Create a test activity
    await createNode(testNode1);

    // Try to remove the activity from the latest context when no contexts exist
    await expect(
      removeNodeFromLatestContext(testNode1.activityId),
    ).rejects.toThrow("No contexts found");
  });

  it("should get activities for a context", async () => {
    // Create test activities
    await createNode(testNode1);
    await createNode(testNode2);

    // Create a context with activities
    const createdContext = await createContext({
      name: "Context with Nodes",
      activityIds: [testNode1.activityId, testNode2.activityId],
    });

    // Get activities for the context
    const activities = await getContextNodes(createdContext.contextId);

    // Verify activities were retrieved
    expect(activities).toBeDefined();
    expect(activities).toHaveLength(2);

    // Find activities by ID
    const activity1 = activities?.find(
      (a) => a.activityId === testNode1.activityId,
    );
    const activity2 = activities?.find(
      (a) => a.activityId === testNode2.activityId,
    );

    expect(activity1).toBeDefined();
    expect(activity1?.name).toBe(testNode1.name);
    expect(activity1?.active).toBe(testNode1.active);

    expect(activity2).toBeDefined();
    expect(activity2?.name).toBe(testNode2.name);
    expect(activity2?.active).toBe(testNode2.active);
  });

  it("should handle empty results when getting context activities", async () => {
    // Create a context without activities
    const createdContext = await createContext(testContext1);

    // Get activities for the context
    const activities = await getContextNodes(createdContext.contextId);

    // Verify empty array was returned
    expect(activities).toHaveLength(0);
  });

  it("should handle deleting a context with activities", async () => {
    // Create test activities
    await createNode(testNode1);
    await createNode(testNode2);

    // Create a context with activities
    const createdContext = await createContext({
      name: "Context with Nodes",
      activityIds: [testNode1.activityId, testNode2.activityId],
    });

    // Delete the context
    await deleteContext(createdContext.contextId);

    // Verify the context was deleted
    const context = await getContextById(createdContext.contextId);
    expect(context).toBeNull();

    // Verify the activities still exist
    const client = await getConnection();
    const result = await client.query(
      "SELECT COUNT(*) FROM activities WHERE activityid IN ($1, $2)",
      [testNode1.activityId, testNode2.activityId],
    );

    expect(parseInt(result.rows[0].count)).toBe(2);
  });

  it("should get the current (most recently created) context", async () => {
    // Create multiple contexts in sequence
    const context1 = await createContext(testContext1);

    // Wait a small amount to ensure different creation timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));

    const context2 = await createContext(testContext2);

    // Get the current context
    const currentContext = await getCurrentContext();

    // Verify the most recently created context was returned
    expect(currentContext).toBeDefined();
    expect(currentContext?.contextId).toBe(context2.contextId);
    expect(currentContext?.name).toBe(testContext2.name);
  });

  it("should return null from getCurrentContext when no contexts exist", async () => {
    // Ensure no contexts exist
    const client = await getConnection();
    await client.query("DELETE FROM contexts");

    // Get the current context
    const currentContext = await getCurrentContext();

    // Verify null was returned
    expect(currentContext).toBeNull();
  });

  it("should get activities for the current context", async () => {
    // Create test activities
    await createNode(testNode1);
    await createNode(testNode2);

    // Create a context with activities
    await createContext({
      name: "Context with Nodes",
      activityIds: [testNode1.activityId, testNode2.activityId],
    });

    // Get activities for the current context
    const activities = await getCurrentContextNodes();

    // Verify activities were retrieved
    expect(activities).toBeDefined();
    expect(activities).toHaveLength(2);

    // Find activities by ID
    const activity1 = activities.find(
      (a) => a.activityId === testNode1.activityId,
    );
    const activity2 = activities.find(
      (a) => a.activityId === testNode2.activityId,
    );

    expect(activity1).toBeDefined();
    expect(activity1?.name).toBe(testNode1.name);

    expect(activity2).toBeDefined();
    expect(activity2?.name).toBe(testNode2.name);
  });

  it("should return empty array from getCurrentContextNodes when no contexts exist", async () => {
    // Ensure no contexts exist
    const client = await getConnection();
    await client.query("DELETE FROM contexts");

    // Get activities for the current context
    const activities = await getCurrentContextNodes();

    // Verify empty array was returned
    expect(activities).toHaveLength(0);
  });
});
