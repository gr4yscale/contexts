import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getConnection } from "../db.mts";
import { setupTestDatabase, teardownTestDatabase } from "../testUtils.mts";
import {
  createNode,
  getNodeById,
  getAllNodes,
  updateNode,
  deleteNode,
  getActiveNodes,
  activityTree,
  updateNodeHistory,
  getCurrentNode,
  getPreviousNode,
  getChildNodes,
  NodeCreate,
  filteredNodeTree,
  NodeTreeFilter,
} from "./node.mts";
import { Node } from "../types.mts";

import { filteredNodeTree, NodeTreeFilter } from "./node.mts";
import { createContext, updateContext } from "./context.mts";

const isIntegrationTest = process.env.RUN_INTEGRATION_TESTS === "true";

// Skip tests if not running integration tests
const testSuite = isIntegrationTest ? describe : describe.skip;

testSuite("Node Model Integration Tests", () => {
  // Test node data
  const testNode1: Node = {
    nodeId: "test-node-1",
    name: "Test Node 1",
    created: new Date(),
    lastAccessed: new Date(),
    active: true,
    orgId: "org-id-1",
    orgText: "* Test Org Text 1",
  };

  const testNode2: Node = {
    nodeId: "test-node-2",
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
    await client.query("DELETE FROM activities");
    await client.query("DELETE FROM node_history");
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      const client = await getConnection();

      // Drop test tables
      await client.query("DROP TABLE IF EXISTS activities CASCADE");

      // teardown test db container after tests
      await teardownTestDatabase();
    } catch (error) {
      console.error("Error cleaning up test environment:", error);
    }
  });

  it("should create an node", async () => {
    // Create an node
    const nodeId = await createNode(testNode1);

    // Verify the node was created
    const node = await getNodeById(nodeId);
    expect(node).toBeDefined();
    expect(node?.nodeId).toBe(nodeId);
    expect(node?.name).toBe(testNode1.name);
    expect(node?.orgId).toBe(testNode1.orgId);
    expect(node?.orgText).toBe(testNode1.orgText);
    expect(node?.active).toBe(testNode1.active);
  });

  it("should get an node by ID", async () => {
    // Create an node
    const nodeId = await createNode(testNode1);

    // Get the node by ID
    const node = await getNodeById(nodeId);

    // Verify the node was retrieved
    expect(node).toBeDefined();
    expect(node?.nodeId).toBe(nodeId);
    expect(node?.name).toBe(testNode1.name);
    expect(node?.orgId).toBe(testNode1.orgId);
    expect(node?.orgText).toBe(testNode1.orgText);
    expect(node?.active).toBe(testNode1.active);
  });

  it("should return null when getting a non-existent node", async () => {
    // Get a non-existent node
    const node = await getNodeById("non-existent-id");

    // Verify null was returned
    expect(node).toBeNull();
  });

  it("should get all activities", async () => {
    // Create test activities
    const nodeId1 = await createNode(testNode1);
    const nodeId2 = await createNode(testNode2);

    // Get all activities
    const activities = await getAllNodes();

    // Verify activities were retrieved
    expect(activities).toHaveLength(2);

    // Find activities by ID
    const node1 = activities.find((a) => a.nodeId === nodeId1);
    const node2 = activities.find((a) => a.nodeId === nodeId2);

    expect(node1).toBeDefined();
    expect(node1?.name).toBe(testNode1.name);
    expect(node1?.active).toBe(testNode1.active);

    expect(node2).toBeDefined();
    expect(node2?.name).toBe(testNode2.name);
    expect(node2?.active).toBe(testNode2.active);
  });

  it("should update an node", async () => {
    // Create an node
    await createNode(testNode1);

    // Update the node
    const updatedName = "Updated Node Name";
    const updatedOrgText = "* Updated Org Text";
    await updateNode({
      nodeId: testNode1.nodeId,
      name: updatedName,
      orgText: updatedOrgText,
      active: false,
    });

    // Get the updated node
    const node = await getNodeById(testNode1.nodeId);

    // Verify the node was updated
    expect(node).toBeDefined();
    expect(node?.name).toBe(updatedName);
    expect(node?.orgText).toBe(updatedOrgText);
    expect(node?.active).toBe(false);
    // Verify other fields weren't changed
    expect(node?.orgId).toBe(testNode1.orgId);
  });

  it("should delete an node", async () => {
    // Create an node
    await createNode(testNode1);

    // Delete the node
    await deleteNode(testNode1.nodeId);

    // Try to get the deleted node
    const node = await getNodeById(testNode1.nodeId);

    // Verify the node was deleted
    expect(node).toBeNull();
  });

  it("should get active activities", async () => {
    // Create test activities (one active, one inactive)
    await createNode(testNode1); // active: true
    await createNode(testNode2); // active: false

    // Get active activities
    const activities = await getActiveNodes();

    // Verify only active activities were retrieved
    expect(activities).toHaveLength(1);
    expect(activities[0].nodeId).toBe(testNode1.nodeId);
    expect(activities[0].active).toBe(true);
  });

  it("should handle empty results", async () => {
    // Get all activities from empty table
    const activities = await getAllNodes();

    // Verify empty array was returned
    expect(activities).toHaveLength(0);
  });

  it("should create an node with a parent-child relationship", async () => {
    // Create parent node
    const parentId = await createNode(testNode1);

    // Create child node with parent reference
    const childNode: NodeCreate = {
      nodeId: "child-node-1",
      name: "Child Node 1",
      active: true,
      parentNodeId: parentId,
    };

    const childId = await createNode(childNode);

    // Verify the child node was created with correct parent reference
    const retrievedChild = await getNodeById(childId);
    expect(retrievedChild).toBeDefined();
    expect(retrievedChild?.parentNodeId).toBe(parentId);
  });

  it("should get child activities of a parent", async () => {
    // Create parent node
    const parentId = await createNode(testNode1);

    // Create multiple child activities
    const childNode1: NodeCreate = {
      nodeId: "child-node-1",
      name: "Child Node 1",
      active: true,
      parentNodeId: parentId,
    };

    const childNode2: NodeCreate = {
      nodeId: "child-node-2",
      name: "Child Node 2",
      active: false,
      parentNodeId: parentId,
    };

    const childId1 = await createNode(childNode1);
    const childId2 = await createNode(childNode2);

    // Get children of parent
    const children = await getChildNodes(parentId);

    // Verify children were retrieved correctly
    expect(children).toHaveLength(2);
    expect(children.map((c) => c.nodeId).sort()).toEqual(
      [childId1, childId2].sort(),
    );

    // All children should have the correct parent ID
    children.forEach((child) => {
      expect(child.parentNodeId).toBe(parentId);
    });
  });

  it("should fail deleting a parent node which has children", async () => {
    // Create parent node
    const parentId = await createNode(testNode1);

    // Create child node
    const childNode: NodeCreate = {
      nodeId: "child-node-1",
      name: "Child Node 1",
      active: true,
      parentNodeId: parentId,
    };

    const childId = await createNode(childNode);

    // Verify both activities exist
    const parentBefore = await getNodeById(parentId);
    const childBefore = await getNodeById(childId);
    expect(parentBefore).not.toBeNull();
    expect(childBefore).not.toBeNull();

    // Try to delete the parent (should fail due to foreign key constraint)
    let error: any;
    try {
      await deleteNode(parentId);
      // If we get here, the test should fail
      expect(true).toBe(false); // This should not be reached
    } catch (e) {
      error = e;
    }

    // Verify the error occurred due to foreign key constraint
    expect(error).toBeDefined();
    expect(error.message).toContain("foreign key constraint");

    // Verify both activities still exist
    const parentAfter = await getNodeById(parentId);
    const childAfter = await getNodeById(childId);
    expect(parentAfter).not.toBeNull();
    expect(childAfter).not.toBeNull();
  });

  it("should delete parent and children when cascade parameter is true", async () => {
    // Create parent node
    const parentId = await createNode(testNode1);

    // Create child node
    const childNode: NodeCreate = {
      nodeId: "child-node-1",
      name: "Child Node 1",
      active: true,
      parentNodeId: parentId,
    };

    const childId = await createNode(childNode);

    // Create grandchild node
    const grandchildNode: NodeCreate = {
      nodeId: "grandchild-node-1",
      name: "Grandchild Node 1",
      active: true,
      parentNodeId: childId,
    };

    const grandchildId = await createNode(grandchildNode);

    // Verify all activities exist
    expect(await getNodeById(parentId)).not.toBeNull();
    expect(await getNodeById(childId)).not.toBeNull();
    expect(await getNodeById(grandchildId)).not.toBeNull();

    // Delete the parent with cascade=true
    await deleteNode(parentId, true);

    // Verify all activities are deleted
    expect(await getNodeById(parentId)).toBeNull();
    expect(await getNodeById(childId)).toBeNull();
    expect(await getNodeById(grandchildId)).toBeNull();
  });

  it("should retrieve node tree with correct hierarchy and depth", async () => {
    // Create a three-level hierarchy:
    // Root
    // ├── Child 1
    // │   └── Grandchild 1
    // └── Child 2

    // Create root node
    const rootId = await createNode({
      nodeId: "root-node",
      name: "Root Node",
      active: true,
    });

    // Create first child node
    const child1Id = await createNode({
      nodeId: "child-node-1",
      name: "Child Node 1",
      active: true,
      parentNodeId: rootId,
    });

    // Create second child node
    const child2Id = await createNode({
      nodeId: "child-node-2",
      name: "Child Node 2",
      active: true,
      parentNodeId: rootId,
    });

    // Create grandchild node
    const grandchildId = await createNode({
      nodeId: "grandchild-node",
      name: "Grandchild Node",
      active: true,
      parentNodeId: child1Id,
    });

    // Get the node tree
    const tree = await nodeTree();

    // Verify tree structure
    expect(tree).toHaveLength(4); // Root + 2 children + 1 grandchild

    // Find each node in the tree
    const rootInTree = tree.find((a) => a.nodeId === rootId);
    const child1InTree = tree.find((a) => a.nodeId === child1Id);
    const child2InTree = tree.find((a) => a.nodeId === child2Id);
    const grandchildInTree = tree.find((a) => a.nodeId === grandchildId);

    // Verify all activities are in the tree
    expect(rootInTree).toBeDefined();
    expect(child1InTree).toBeDefined();
    expect(child2InTree).toBeDefined();
    expect(grandchildInTree).toBeDefined();

    // Verify correct depth values
    expect(rootInTree?.depth).toBe(0);
    expect(child1InTree?.depth).toBe(1);
    expect(child2InTree?.depth).toBe(1);
    expect(grandchildInTree?.depth).toBe(2);

    // Verify parent-child relationships
    expect(rootInTree?.parentNodeId).toBeNull();
    expect(child1InTree?.parentNodeId).toBe(rootId);
    expect(child2InTree?.parentNodeId).toBe(rootId);
    expect(grandchildInTree?.parentNodeId).toBe(child1Id);

    // Verify ordering (parents should come before their children)
    const rootIndex = tree.findIndex((a) => a.nodeId === rootId);
    const child1Index = tree.findIndex((a) => a.nodeId === child1Id);
    const child2Index = tree.findIndex((a) => a.nodeId === child2Id);
    const grandchildIndex = tree.findIndex(
      (a) => a.nodeId === grandchildId,
    );

    expect(rootIndex).toBeLessThan(child1Index);
    expect(rootIndex).toBeLessThan(child2Index);
    expect(child1Index).toBeLessThan(grandchildIndex);
  });

  it("should update node history and retrieve current node", async () => {
    // Create two test activities
    const nodeId1 = await createNode(testNode1);
    const nodeId2 = await createNode(testNode2);

    // Update node history (simulate switching from node2 to node1)
    await updateNodeHistory(nodeId1, nodeId2);

    // Get current node
    const currentNode = await getCurrentNode();

    // Verify current node is testNode1
    expect(currentNode).not.toBeNull();
    expect(currentNode?.nodeId).toBe(nodeId1);

    // Get previous node
    const previousNode = await getPreviousNode();

    // Verify previous node is testNode2
    expect(previousNode).not.toBeNull();
    expect(previousNode?.nodeId).toBe(nodeId2);
  });

  it("should update lastAccessed timestamp when node becomes current", async () => {
    // Create test node
    const nodeId = await createNode(testNode1);

    // Get the initial lastAccessed timestamp
    const initialNode = await getNodeById(nodeId);
    const initialTimestamp = initialNode?.lastAccessed;

    // Wait a small amount of time to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update node history to make it the current node
    // Use empty string as previous ID to avoid foreign key constraint
    await updateNodeHistory(nodeId, "");

    // Get the updated node
    const updatedNode = await getNodeById(nodeId);
    const updatedTimestamp = updatedNode?.lastAccessed;

    // Verify lastAccessed timestamp was updated
    expect(updatedTimestamp).not.toEqual(initialTimestamp);
    expect(updatedTimestamp?.getTime()).toBeGreaterThan(
      initialTimestamp?.getTime() || 0,
    );
  });

  it("should maintain history of node transitions", async () => {
    // Create three test activities
    const nodeId1 = await createNode(testNode1);
    const nodeId2 = await createNode(testNode2);

    const testNode3: NodeCreate = {
      nodeId: "test-node-3",
      name: "Test Node 3",
      active: true,
      orgId: "org-id-3",
      orgText: "* Test Org Text 3",
    };
    const nodeId3 = await createNode(testNode3);

    // Simulate a sequence of node transitions
    // First transition: null -> node1
    await updateNodeHistory(nodeId1, "");

    // Second transition: node1 -> node2
    await updateNodeHistory(nodeId2, nodeId1);

    // Third transition: node2 -> node3
    await updateNodeHistory(nodeId3, nodeId2);

    // Verify current node is node3
    const currentNode = await getCurrentNode();
    expect(currentNode?.nodeId).toBe(nodeId3);

    // Verify previous node is node2
    const previousNode = await getPreviousNode();
    expect(previousNode?.nodeId).toBe(nodeId2);

    // Verify history records in database
    const client = await getConnection();
    const result = await client.query(
      `SELECT current_node_id, previous_node_id 
       FROM node_history 
       ORDER BY timestamp ASC`,
    );

    // Should have 3 history records
    expect(result.rows.length).toBeGreaterThanOrEqual(3);

    // Check the sequence of transitions
    const transitions = result.rows.slice(-3); // Get the last 3 transitions

    expect(transitions[0].current_node_id).toBe(nodeId1);
    expect(transitions[0].previous_node_id).toBe(null);

    expect(transitions[1].current_node_id).toBe(nodeId2);
    expect(transitions[1].previous_node_id).toBe(nodeId1);

    expect(transitions[2].current_node_id).toBe(nodeId3);
    expect(transitions[2].previous_node_id).toBe(nodeId2);
  });

  it("should handle null previous node in history", async () => {
    // Create test node
    const nodeId = await createNode(testNode1);

    // Update node history with null previous node
    await updateNodeHistory(nodeId, "");

    // Get current and previous activities
    const currentNode = await getCurrentNode();
    const previousNode = await getPreviousNode();

    // Verify current node is set
    expect(currentNode?.nodeId).toBe(nodeId);

    // Verify previous node is null
    expect(previousNode).toBeNull();
  });

  it("should limit node tree depth to 3 levels", async () => {
    // Create a four-level hierarchy to test depth limitation:
    // Root
    // └── Level 1
    //     └── Level 2
    //         └── Level 3 (should be included)
    //             └── Level 4 (should NOT be included)

    // Create root node (level 0)
    const rootId = await createNode({
      nodeId: "depth-root",
      name: "Depth Root",
      active: true,
    });

    // Create child activities for levels 1-4
    let parentId = rootId;
    const levelIds = [rootId];

    for (let i = 1; i <= 4; i++) {
      const nodeId = await createNode({
        nodeId: `depth-level-${i}`,
        name: `Depth Level ${i}`,
        active: true,
        parentNodeId: parentId,
      });
      levelIds.push(nodeId);
      parentId = nodeId;
    }

    // Get the node tree
    const tree = await nodeTree();

    // Find our test activities in the tree
    const treeNodeIds = tree.map((a) => a.nodeId);

    // Verify levels 0-3 are included
    expect(treeNodeIds).toContain("depth-root");
    expect(treeNodeIds).toContain("depth-level-1");
    expect(treeNodeIds).toContain("depth-level-2");
    expect(treeNodeIds).toContain("depth-level-3");

    // Verify level 4 is NOT included (due to depth limit of 3)
    expect(treeNodeIds).not.toContain("depth-level-4");

    // Verify correct depth values for included activities
    const level0 = tree.find((a) => a.nodeId === "depth-root");
    const level1 = tree.find((a) => a.nodeId === "depth-level-1");
    const level2 = tree.find((a) => a.nodeId === "depth-level-2");
    const level3 = tree.find((a) => a.nodeId === "depth-level-3");

    expect(level0?.depth).toBe(0);
    expect(level1?.depth).toBe(1);
    expect(level2?.depth).toBe(2);
    expect(level3?.depth).toBe(3);
  });

  describe("filteredNodeTree", () => {
    it("should return all activities with ALL filter", async () => {
      // Create several activities
      const node1 = await createNode({
        name: "Regular Node 1",
        active: true,
      });

      const node2 = await createNode({
        name: "Regular Node 2",
        active: true,
      });

      const node3 = await createNode({
        name: "Temp Node",
        active: true,
        temp: true,
      });

      // Get filtered activities with ALL filter
      const allNodes = await filteredNodeTree(NodeTreeFilter.ALL);

      // Should include all activities
      const nodeIds = allNodes.map((a) => a.nodeId);
      expect(nodeIds).toContain(node1);
      expect(nodeIds).toContain(node2);
      expect(nodeIds).toContain(node3);

      // All should have selected = false
      expect(allNodes.every((a) => a.selected === false)).toBe(true);
    });

    it("should return only temp activities with TEMP filter", async () => {
      // Create regular and temp activities
      const regularNode = await createNode({
        name: "Regular Node",
        active: true,
        temp: false,
      });

      const tempNode1 = await createNode({
        name: "Temp Node 1",
        active: true,
        temp: true,
      });

      const tempNode2 = await createNode({
        name: "Temp Node 2",
        active: true,
        temp: true,
      });

      // Get filtered activities with TEMP filter
      const tempNodes = await filteredNodeTree(
        NodeTreeFilter.TEMP,
      );

      // Should only include temp activities
      const nodeIds = tempNodes.map((a) => a.nodeId);
      expect(nodeIds).not.toContain(regularNode);
      expect(nodeIds).toContain(tempNode1);
      expect(nodeIds).toContain(tempNode2);

      // All should have selected = false
      expect(tempNodes.every((a) => a.selected === false)).toBe(true);
    });

    it("should return recent activities with RECENT filter", async () => {
      // Create an node and update its lastAccessed to be older
      const oldNode = await createNode({
        name: "Old Node",
        active: true,
      });

      // Manually update the lastAccessed date to be older than 7 days
      const client = await getConnection();
      await client.query(
        "UPDATE activities SET lastAccessed = CURRENT_TIMESTAMP - INTERVAL '8 days' WHERE nodeId = $1",
        [oldNode],
      );

      // Create a new node (which will have current timestamp)
      const recentNode = await createNode({
        name: "Recent Node",
        active: true,
      });

      // Get filtered activities with RECENT filter
      const recentNodes = await filteredNodeTree(
        NodeTreeFilter.RECENT,
      );

      // Should only include recent activities
      const nodeIds = recentNodes.map((a) => a.nodeId);
      expect(nodeIds).not.toContain(oldNode);
      expect(nodeIds).toContain(recentNode);
    });

    it("should mark activities in context as selected with CONTEXT filter", async () => {
      // Create activities
      const node1 = await createNode({
        name: "Node 1",
        active: true,
      });

      const node2 = await createNode({
        name: "Node 2",
        active: true,
      });

      const node3 = await createNode({
        name: "Node 3",
        active: true,
      });

      // Create a context with node1 and node3
      const contextId = await createContext({
        name: "Test Context",
        nodeIds: [node1, node3],
      });

      // Get filtered activities with CONTEXT filter
      const contextNodes = await filteredNodeTree(
        NodeTreeFilter.CONTEXT,
      );

      // All activities should be included
      const nodeIds = contextNodes.map((a) => a.nodeId);
      expect(nodeIds).toContain(node1);
      expect(nodeIds).toContain(node2);
      expect(nodeIds).toContain(node3);

      // Check selected state
      const node1InResult = contextNodes.find(
        (a) => a.nodeId === node1,
      );
      const node2InResult = contextNodes.find(
        (a) => a.nodeId === node2,
      );
      const node3InResult = contextNodes.find(
        (a) => a.nodeId === node3,
      );

      expect(node1InResult?.selected).toBe(true);
      expect(node2InResult?.selected).toBe(false);
      expect(node3InResult?.selected).toBe(true);
    });

    it("should handle empty context with CONTEXT filter", async () => {
      // Create activities
      const node1 = await createNode({
        name: "Node 1",
        active: true,
      });

      const node2 = await createNode({
        name: "Node 2",
        active: true,
      });

      // Create a context with no activities
      const contextId = await createContext({
        name: "Empty Context",
        nodeIds: [],
      });

      // Get filtered activities with CONTEXT filter
      const contextNodes = await filteredNodeTree(
        NodeTreeFilter.CONTEXT,
      );

      // All activities should be included but none selected
      const nodeIds = contextNodes.map((a) => a.nodeId);
      expect(nodeIds).toContain(node1);
      expect(nodeIds).toContain(node2);

      // All should have selected = false
      expect(contextNodes.every((a) => a.selected === false)).toBe(true);
    });
  });
});
