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
} from "./activity.mts";
import { Node } from "../types.mts";

import { filteredNodeTree, NodeTreeFilter } from "./activity.mts";
import { createContext, updateContext } from "./context.mts";

const isIntegrationTest = process.env.RUN_INTEGRATION_TESTS === "true";

// Skip tests if not running integration tests
const testSuite = isIntegrationTest ? describe : describe.skip;

testSuite("Node Model Integration Tests", () => {
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
    await client.query("DELETE FROM activities");
    await client.query("DELETE FROM activity_history");
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

  it("should create an activity", async () => {
    // Create an activity
    const activityId = await createNode(testNode1);

    // Verify the activity was created
    const activity = await getNodeById(activityId);
    expect(activity).toBeDefined();
    expect(activity?.activityId).toBe(activityId);
    expect(activity?.name).toBe(testNode1.name);
    expect(activity?.orgId).toBe(testNode1.orgId);
    expect(activity?.orgText).toBe(testNode1.orgText);
    expect(activity?.active).toBe(testNode1.active);
  });

  it("should get an activity by ID", async () => {
    // Create an activity
    const activityId = await createNode(testNode1);

    // Get the activity by ID
    const activity = await getNodeById(activityId);

    // Verify the activity was retrieved
    expect(activity).toBeDefined();
    expect(activity?.activityId).toBe(activityId);
    expect(activity?.name).toBe(testNode1.name);
    expect(activity?.orgId).toBe(testNode1.orgId);
    expect(activity?.orgText).toBe(testNode1.orgText);
    expect(activity?.active).toBe(testNode1.active);
  });

  it("should return null when getting a non-existent activity", async () => {
    // Get a non-existent activity
    const activity = await getNodeById("non-existent-id");

    // Verify null was returned
    expect(activity).toBeNull();
  });

  it("should get all activities", async () => {
    // Create test activities
    const activityId1 = await createNode(testNode1);
    const activityId2 = await createNode(testNode2);

    // Get all activities
    const activities = await getAllNodes();

    // Verify activities were retrieved
    expect(activities).toHaveLength(2);

    // Find activities by ID
    const activity1 = activities.find((a) => a.activityId === activityId1);
    const activity2 = activities.find((a) => a.activityId === activityId2);

    expect(activity1).toBeDefined();
    expect(activity1?.name).toBe(testNode1.name);
    expect(activity1?.active).toBe(testNode1.active);

    expect(activity2).toBeDefined();
    expect(activity2?.name).toBe(testNode2.name);
    expect(activity2?.active).toBe(testNode2.active);
  });

  it("should update an activity", async () => {
    // Create an activity
    await createNode(testNode1);

    // Update the activity
    const updatedName = "Updated Node Name";
    const updatedOrgText = "* Updated Org Text";
    await updateNode({
      activityId: testNode1.activityId,
      name: updatedName,
      orgText: updatedOrgText,
      active: false,
    });

    // Get the updated activity
    const activity = await getNodeById(testNode1.activityId);

    // Verify the activity was updated
    expect(activity).toBeDefined();
    expect(activity?.name).toBe(updatedName);
    expect(activity?.orgText).toBe(updatedOrgText);
    expect(activity?.active).toBe(false);
    // Verify other fields weren't changed
    expect(activity?.orgId).toBe(testNode1.orgId);
  });

  it("should delete an activity", async () => {
    // Create an activity
    await createNode(testNode1);

    // Delete the activity
    await deleteNode(testNode1.activityId);

    // Try to get the deleted activity
    const activity = await getNodeById(testNode1.activityId);

    // Verify the activity was deleted
    expect(activity).toBeNull();
  });

  it("should get active activities", async () => {
    // Create test activities (one active, one inactive)
    await createNode(testNode1); // active: true
    await createNode(testNode2); // active: false

    // Get active activities
    const activities = await getActiveNodes();

    // Verify only active activities were retrieved
    expect(activities).toHaveLength(1);
    expect(activities[0].activityId).toBe(testNode1.activityId);
    expect(activities[0].active).toBe(true);
  });

  it("should handle empty results", async () => {
    // Get all activities from empty table
    const activities = await getAllNodes();

    // Verify empty array was returned
    expect(activities).toHaveLength(0);
  });

  it("should create an activity with a parent-child relationship", async () => {
    // Create parent activity
    const parentId = await createNode(testNode1);

    // Create child activity with parent reference
    const childNode: NodeCreate = {
      activityId: "child-activity-1",
      name: "Child Node 1",
      active: true,
      parentNodeId: parentId,
    };

    const childId = await createNode(childNode);

    // Verify the child activity was created with correct parent reference
    const retrievedChild = await getNodeById(childId);
    expect(retrievedChild).toBeDefined();
    expect(retrievedChild?.parentNodeId).toBe(parentId);
  });

  it("should get child activities of a parent", async () => {
    // Create parent activity
    const parentId = await createNode(testNode1);

    // Create multiple child activities
    const childNode1: NodeCreate = {
      activityId: "child-activity-1",
      name: "Child Node 1",
      active: true,
      parentNodeId: parentId,
    };

    const childNode2: NodeCreate = {
      activityId: "child-activity-2",
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
    expect(children.map((c) => c.activityId).sort()).toEqual(
      [childId1, childId2].sort(),
    );

    // All children should have the correct parent ID
    children.forEach((child) => {
      expect(child.parentNodeId).toBe(parentId);
    });
  });

  it("should fail deleting a parent activity which has children", async () => {
    // Create parent activity
    const parentId = await createNode(testNode1);

    // Create child activity
    const childNode: NodeCreate = {
      activityId: "child-activity-1",
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
    // Create parent activity
    const parentId = await createNode(testNode1);

    // Create child activity
    const childNode: NodeCreate = {
      activityId: "child-activity-1",
      name: "Child Node 1",
      active: true,
      parentNodeId: parentId,
    };

    const childId = await createNode(childNode);

    // Create grandchild activity
    const grandchildNode: NodeCreate = {
      activityId: "grandchild-activity-1",
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

  it("should retrieve activity tree with correct hierarchy and depth", async () => {
    // Create a three-level hierarchy:
    // Root
    // ├── Child 1
    // │   └── Grandchild 1
    // └── Child 2

    // Create root activity
    const rootId = await createNode({
      activityId: "root-activity",
      name: "Root Node",
      active: true,
    });

    // Create first child activity
    const child1Id = await createNode({
      activityId: "child-activity-1",
      name: "Child Node 1",
      active: true,
      parentNodeId: rootId,
    });

    // Create second child activity
    const child2Id = await createNode({
      activityId: "child-activity-2",
      name: "Child Node 2",
      active: true,
      parentNodeId: rootId,
    });

    // Create grandchild activity
    const grandchildId = await createNode({
      activityId: "grandchild-activity",
      name: "Grandchild Node",
      active: true,
      parentNodeId: child1Id,
    });

    // Get the activity tree
    const tree = await activityTree();

    // Verify tree structure
    expect(tree).toHaveLength(4); // Root + 2 children + 1 grandchild

    // Find each activity in the tree
    const rootInTree = tree.find((a) => a.activityId === rootId);
    const child1InTree = tree.find((a) => a.activityId === child1Id);
    const child2InTree = tree.find((a) => a.activityId === child2Id);
    const grandchildInTree = tree.find((a) => a.activityId === grandchildId);

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
    const rootIndex = tree.findIndex((a) => a.activityId === rootId);
    const child1Index = tree.findIndex((a) => a.activityId === child1Id);
    const child2Index = tree.findIndex((a) => a.activityId === child2Id);
    const grandchildIndex = tree.findIndex(
      (a) => a.activityId === grandchildId,
    );

    expect(rootIndex).toBeLessThan(child1Index);
    expect(rootIndex).toBeLessThan(child2Index);
    expect(child1Index).toBeLessThan(grandchildIndex);
  });

  it("should update activity history and retrieve current activity", async () => {
    // Create two test activities
    const activityId1 = await createNode(testNode1);
    const activityId2 = await createNode(testNode2);

    // Update activity history (simulate switching from activity2 to activity1)
    await updateNodeHistory(activityId1, activityId2);

    // Get current activity
    const currentNode = await getCurrentNode();

    // Verify current activity is testNode1
    expect(currentNode).not.toBeNull();
    expect(currentNode?.activityId).toBe(activityId1);

    // Get previous activity
    const previousNode = await getPreviousNode();

    // Verify previous activity is testNode2
    expect(previousNode).not.toBeNull();
    expect(previousNode?.activityId).toBe(activityId2);
  });

  it("should update lastAccessed timestamp when activity becomes current", async () => {
    // Create test activity
    const activityId = await createNode(testNode1);

    // Get the initial lastAccessed timestamp
    const initialNode = await getNodeById(activityId);
    const initialTimestamp = initialNode?.lastAccessed;

    // Wait a small amount of time to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update activity history to make it the current activity
    // Use empty string as previous ID to avoid foreign key constraint
    await updateNodeHistory(activityId, "");

    // Get the updated activity
    const updatedNode = await getNodeById(activityId);
    const updatedTimestamp = updatedNode?.lastAccessed;

    // Verify lastAccessed timestamp was updated
    expect(updatedTimestamp).not.toEqual(initialTimestamp);
    expect(updatedTimestamp?.getTime()).toBeGreaterThan(
      initialTimestamp?.getTime() || 0,
    );
  });

  it("should maintain history of activity transitions", async () => {
    // Create three test activities
    const activityId1 = await createNode(testNode1);
    const activityId2 = await createNode(testNode2);

    const testNode3: NodeCreate = {
      activityId: "test-activity-3",
      name: "Test Node 3",
      active: true,
      orgId: "org-id-3",
      orgText: "* Test Org Text 3",
    };
    const activityId3 = await createNode(testNode3);

    // Simulate a sequence of activity transitions
    // First transition: null -> activity1
    await updateNodeHistory(activityId1, "");

    // Second transition: activity1 -> activity2
    await updateNodeHistory(activityId2, activityId1);

    // Third transition: activity2 -> activity3
    await updateNodeHistory(activityId3, activityId2);

    // Verify current activity is activity3
    const currentNode = await getCurrentNode();
    expect(currentNode?.activityId).toBe(activityId3);

    // Verify previous activity is activity2
    const previousNode = await getPreviousNode();
    expect(previousNode?.activityId).toBe(activityId2);

    // Verify history records in database
    const client = await getConnection();
    const result = await client.query(
      `SELECT current_activity_id, previous_activity_id 
       FROM activity_history 
       ORDER BY timestamp ASC`,
    );

    // Should have 3 history records
    expect(result.rows.length).toBeGreaterThanOrEqual(3);

    // Check the sequence of transitions
    const transitions = result.rows.slice(-3); // Get the last 3 transitions

    expect(transitions[0].current_activity_id).toBe(activityId1);
    expect(transitions[0].previous_activity_id).toBe(null);

    expect(transitions[1].current_activity_id).toBe(activityId2);
    expect(transitions[1].previous_activity_id).toBe(activityId1);

    expect(transitions[2].current_activity_id).toBe(activityId3);
    expect(transitions[2].previous_activity_id).toBe(activityId2);
  });

  it("should handle null previous activity in history", async () => {
    // Create test activity
    const activityId = await createNode(testNode1);

    // Update activity history with null previous activity
    await updateNodeHistory(activityId, "");

    // Get current and previous activities
    const currentNode = await getCurrentNode();
    const previousNode = await getPreviousNode();

    // Verify current activity is set
    expect(currentNode?.activityId).toBe(activityId);

    // Verify previous activity is null
    expect(previousNode).toBeNull();
  });

  it("should limit activity tree depth to 3 levels", async () => {
    // Create a four-level hierarchy to test depth limitation:
    // Root
    // └── Level 1
    //     └── Level 2
    //         └── Level 3 (should be included)
    //             └── Level 4 (should NOT be included)

    // Create root activity (level 0)
    const rootId = await createNode({
      activityId: "depth-root",
      name: "Depth Root",
      active: true,
    });

    // Create child activities for levels 1-4
    let parentId = rootId;
    const levelIds = [rootId];

    for (let i = 1; i <= 4; i++) {
      const activityId = await createNode({
        activityId: `depth-level-${i}`,
        name: `Depth Level ${i}`,
        active: true,
        parentNodeId: parentId,
      });
      levelIds.push(activityId);
      parentId = activityId;
    }

    // Get the activity tree
    const tree = await activityTree();

    // Find our test activities in the tree
    const treeNodeIds = tree.map((a) => a.activityId);

    // Verify levels 0-3 are included
    expect(treeNodeIds).toContain("depth-root");
    expect(treeNodeIds).toContain("depth-level-1");
    expect(treeNodeIds).toContain("depth-level-2");
    expect(treeNodeIds).toContain("depth-level-3");

    // Verify level 4 is NOT included (due to depth limit of 3)
    expect(treeNodeIds).not.toContain("depth-level-4");

    // Verify correct depth values for included activities
    const level0 = tree.find((a) => a.activityId === "depth-root");
    const level1 = tree.find((a) => a.activityId === "depth-level-1");
    const level2 = tree.find((a) => a.activityId === "depth-level-2");
    const level3 = tree.find((a) => a.activityId === "depth-level-3");

    expect(level0?.depth).toBe(0);
    expect(level1?.depth).toBe(1);
    expect(level2?.depth).toBe(2);
    expect(level3?.depth).toBe(3);
  });

  describe("filteredNodeTree", () => {
    it("should return all activities with ALL filter", async () => {
      // Create several activities
      const activity1 = await createNode({
        name: "Regular Node 1",
        active: true,
      });

      const activity2 = await createNode({
        name: "Regular Node 2",
        active: true,
      });

      const activity3 = await createNode({
        name: "Temp Node",
        active: true,
        temp: true,
      });

      // Get filtered activities with ALL filter
      const allNodes = await filteredNodeTree(NodeTreeFilter.ALL);

      // Should include all activities
      const activityIds = allNodes.map((a) => a.activityId);
      expect(activityIds).toContain(activity1);
      expect(activityIds).toContain(activity2);
      expect(activityIds).toContain(activity3);

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
      const activityIds = tempNodes.map((a) => a.activityId);
      expect(activityIds).not.toContain(regularNode);
      expect(activityIds).toContain(tempNode1);
      expect(activityIds).toContain(tempNode2);

      // All should have selected = false
      expect(tempNodes.every((a) => a.selected === false)).toBe(true);
    });

    it("should return recent activities with RECENT filter", async () => {
      // Create an activity and update its lastAccessed to be older
      const oldNode = await createNode({
        name: "Old Node",
        active: true,
      });

      // Manually update the lastAccessed date to be older than 7 days
      const client = await getConnection();
      await client.query(
        "UPDATE activities SET lastAccessed = CURRENT_TIMESTAMP - INTERVAL '8 days' WHERE activityId = $1",
        [oldNode],
      );

      // Create a new activity (which will have current timestamp)
      const recentNode = await createNode({
        name: "Recent Node",
        active: true,
      });

      // Get filtered activities with RECENT filter
      const recentNodes = await filteredNodeTree(
        NodeTreeFilter.RECENT,
      );

      // Should only include recent activities
      const activityIds = recentNodes.map((a) => a.activityId);
      expect(activityIds).not.toContain(oldNode);
      expect(activityIds).toContain(recentNode);
    });

    it("should mark activities in context as selected with CONTEXT filter", async () => {
      // Create activities
      const activity1 = await createNode({
        name: "Node 1",
        active: true,
      });

      const activity2 = await createNode({
        name: "Node 2",
        active: true,
      });

      const activity3 = await createNode({
        name: "Node 3",
        active: true,
      });

      // Create a context with activity1 and activity3
      const contextId = await createContext({
        name: "Test Context",
        activityIds: [activity1, activity3],
      });

      // Get filtered activities with CONTEXT filter
      const contextNodes = await filteredNodeTree(
        NodeTreeFilter.CONTEXT,
      );

      // All activities should be included
      const activityIds = contextNodes.map((a) => a.activityId);
      expect(activityIds).toContain(activity1);
      expect(activityIds).toContain(activity2);
      expect(activityIds).toContain(activity3);

      // Check selected state
      const activity1InResult = contextNodes.find(
        (a) => a.activityId === activity1,
      );
      const activity2InResult = contextNodes.find(
        (a) => a.activityId === activity2,
      );
      const activity3InResult = contextNodes.find(
        (a) => a.activityId === activity3,
      );

      expect(activity1InResult?.selected).toBe(true);
      expect(activity2InResult?.selected).toBe(false);
      expect(activity3InResult?.selected).toBe(true);
    });

    it("should handle empty context with CONTEXT filter", async () => {
      // Create activities
      const activity1 = await createNode({
        name: "Node 1",
        active: true,
      });

      const activity2 = await createNode({
        name: "Node 2",
        active: true,
      });

      // Create a context with no activities
      const contextId = await createContext({
        name: "Empty Context",
        activityIds: [],
      });

      // Get filtered activities with CONTEXT filter
      const contextNodes = await filteredNodeTree(
        NodeTreeFilter.CONTEXT,
      );

      // All activities should be included but none selected
      const activityIds = contextNodes.map((a) => a.activityId);
      expect(activityIds).toContain(activity1);
      expect(activityIds).toContain(activity2);

      // All should have selected = false
      expect(contextNodes.every((a) => a.selected === false)).toBe(true);
    });
  });
});
