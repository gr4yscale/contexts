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
    nodeIds: [],
  };

  const testContext2: Omit<Context, "contextId" | "created"> = {
    name: "Test Context 2",
    nodeIds: [],
  };

  // Test node data
  const testNode1: Node = {
    nodeId: "test-node-1",
    name: "Test Node 1",
    created: new Date(),
    lastAccessed: new Date(),
  };

  const testNode2: Node = {
    nodeId: "test-node-2",
    name: "Test Node 2",
    created: new Date(),
    lastAccessed: new Date(),
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
    await client.query("DELETE FROM context_nodes");
    await client.query("DELETE FROM contexts");
    await client.query("DELETE FROM nodes");
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
    expect(context.nodeIds).toEqual([]);
  });

  it("should create a context with nodes", async () => {
    // Create test nodes
    await createNode(testNode1);
    await createNode(testNode2);

    // Create context with nodes
    const contextWithNodes = await createContext({
      name: "Context with Nodes",
      nodeIds: [testNode1.nodeId, testNode2.nodeId],
    });

    // Verify the context was created with nodes
    expect(contextWithNodes).toBeDefined();
    expect(contextWithNodes.nodeIds).toHaveLength(2);
    expect(contextWithNodes.nodeIds).toContain(testNode1.nodeId);
    expect(contextWithNodes.nodeIds).toContain(testNode2.nodeId);
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
    expect(context?.nodeIds).toEqual([]);
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
    expect(context?.nodeIds).toEqual([]);
  });

  it("should update context nodes", async () => {
    // Create test nodes
    await createNode(testNode1);
    await createNode(testNode2);

    // Create a context without nodes
    const createdContext = await createContext(testContext1);

    // Update the context to add nodes
    await updateContext({
      contextId: createdContext.contextId,
      nodeIds: [testNode1.nodeId, testNode2.nodeId],
    });

    // Get the updated context
    const context = await getContextById(createdContext.contextId);

    // Verify the context nodes were updated
    expect(context).toBeDefined();
    expect(context?.nodeIds).toHaveLength(2);
    expect(context?.nodeIds).toContain(testNode1.nodeId);
    expect(context?.nodeIds).toContain(testNode2.nodeId);
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

  it("should add an node to the latest context", async () => {
    // Create a test node
    await createNode(testNode1);

    // Create a context without nodes
    const createdContext = await createContext(testContext1);

    // Add the node to the latest context
    await addNodeToLatestContext(testNode1.nodeId);

    // Get the updated context
    const context = await getContextById(createdContext.contextId);

    // Verify the node was added to the context
    expect(context).toBeDefined();
    expect(context?.nodeIds).toHaveLength(1);
    expect(context?.nodeIds[0]).toBe(testNode1.nodeId);
  });

  it("should remove an node from the latest context", async () => {
    // Create a test node
    await createNode(testNode1);

    // Create a context with the node
    const createdContext = await createContext({
      name: testContext1.name,
      nodeIds: [testNode1.nodeId],
    });

    // Verify the node is in the context
    const contextBefore = await getContextById(createdContext.contextId);
    expect(contextBefore?.nodeIds).toContain(testNode1.nodeId);

    // Remove the node from the latest context
    await removeNodeFromLatestContext(testNode1.nodeId);

    // Get the updated context
    const contextAfter = await getContextById(createdContext.contextId);

    // Verify the node was removed from the context
    expect(contextAfter).toBeDefined();
    expect(contextAfter?.nodeIds).toHaveLength(0);
  });

  it("should throw an error when adding node to latest context if no contexts exist", async () => {
    // Create a test node
    await createNode(testNode1);

    // Try to add the node to the latest context when no contexts exist
    await expect(addNodeToLatestContext(testNode1.nodeId)).rejects.toThrow(
      "No contexts found",
    );
  });

  it("should throw an error when removing node from latest context if no contexts exist", async () => {
    // Create a test node
    await createNode(testNode1);

    // Try to remove the node from the latest context when no contexts exist
    await expect(removeNodeFromLatestContext(testNode1.nodeId)).rejects.toThrow(
      "No contexts found",
    );
  });

  it("should get nodes for a context", async () => {
    // Create test nodes
    await createNode(testNode1);
    await createNode(testNode2);

    // Create a context with nodes
    const createdContext = await createContext({
      name: "Context with Nodes",
      nodeIds: [testNode1.nodeId, testNode2.nodeId],
    });

    // Get nodes for the context
    const nodes = await getContextNodes(createdContext.contextId);

    // Verify nodes were retrieved
    expect(nodes).toBeDefined();
    expect(nodes).toHaveLength(2);

    // Find nodes by ID
    const node1 = nodes?.find((a) => a.nodeId === testNode1.nodeId);
    const node2 = nodes?.find((a) => a.nodeId === testNode2.nodeId);

    expect(node1).toBeDefined();
    expect(node1?.name).toBe(testNode1.name);

    expect(node2).toBeDefined();
    expect(node2?.name).toBe(testNode2.name);
  });

  it("should handle empty results when getting context nodes", async () => {
    // Create a context without nodes
    const createdContext = await createContext(testContext1);

    // Get nodes for the context
    const nodes = await getContextNodes(createdContext.contextId);

    // Verify empty array was returned
    expect(nodes).toHaveLength(0);
  });

  it("should handle deleting a context with nodes", async () => {
    // Create test nodes
    await createNode(testNode1);
    await createNode(testNode2);

    // Create a context with nodes
    const createdContext = await createContext({
      name: "Context with Nodes",
      nodeIds: [testNode1.nodeId, testNode2.nodeId],
    });

    // Delete the context
    await deleteContext(createdContext.contextId);

    // Verify the context was deleted
    const context = await getContextById(createdContext.contextId);
    expect(context).toBeNull();

    // Verify the nodes still exist
    const client = await getConnection();
    const result = await client.query(
      "SELECT COUNT(*) FROM nodes WHERE nodeid IN ($1, $2)",
      [testNode1.nodeId, testNode2.nodeId],
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

  it("should get nodes for the current context", async () => {
    // Create test nodes
    await createNode(testNode1);
    await createNode(testNode2);

    // Create a context with nodes
    await createContext({
      name: "Context with Nodes",
      nodeIds: [testNode1.nodeId, testNode2.nodeId],
    });

    // Get nodes for the current context
    const nodes = await getCurrentContextNodes();

    // Verify nodes were retrieved
    expect(nodes).toBeDefined();
    expect(nodes).toHaveLength(2);

    // Find nodes by ID
    const node1 = nodes.find((a) => a.nodeId === testNode1.nodeId);
    const node2 = nodes.find((a) => a.nodeId === testNode2.nodeId);

    expect(node1).toBeDefined();
    expect(node1?.name).toBe(testNode1.name);

    expect(node2).toBeDefined();
    expect(node2?.name).toBe(testNode2.name);
  });

  it("should return empty array from getCurrentContextNodes when no contexts exist", async () => {
    // Ensure no contexts exist
    const client = await getConnection();
    await client.query("DELETE FROM contexts");

    // Get nodes for the current context
    const nodes = await getCurrentContextNodes();

    // Verify empty array was returned
    expect(nodes).toHaveLength(0);
  });
});
