import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getConnection } from "../db.mts";
import {
  createActivity,
  getActivityById,
  getAllActivities,
  updateActivity,
  deleteActivity,
  getActiveActivities,
  activityTree,
} from "./activity.mts";
import { Activity } from "../types.mts";
import * as fs from "fs";
import * as path from "path";
import { setupTestDatabase, teardownTestDatabase } from "../testUtils.mts";

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

  it("should create an activity with a parent-child relationship", async () => {
    // Create parent activity
    await createActivity(testActivity1);

    // Create child activity with parent reference
    const childActivity: Activity = {
      activityId: "child-activity-1",
      name: "Child Activity 1",
      created: new Date(),
      lastAccessed: new Date(),
      active: true,
      parentActivityId: testActivity1.activityId,
    };

    await createActivity(childActivity);

    // Verify the child activity was created with correct parent reference
    const retrievedChild = await getActivityById(childActivity.activityId);
    expect(retrievedChild).toBeDefined();
    expect(retrievedChild?.parentActivityId).toBe(testActivity1.activityId);
  });

  it("should get child activities of a parent", async () => {
    // First create a test function to get children
    const getChildActivities = async (
      parentId: string,
    ): Promise<Activity[]> => {
      const client = await getConnection();
      const result = await client.query(
        "SELECT * FROM activities WHERE parent_id = $1;",
        [parentId],
      );

      if (result.rows.length === 0) {
        return [];
      }

      return result.rows.map((row: any) => ({
        activityId: row.activityid,
        orgId: row.orgid,
        orgText: row.orgtext,
        name: row.name,
        created: new Date(row.created),
        lastAccessed: new Date(row.lastaccessed),
        active: row.active,
        parentActivityId: row.parent_id,
      }));
    };

    // Create parent activity
    await createActivity(testActivity1);

    // Create multiple child activities
    const childActivity1: Activity = {
      activityId: "child-activity-1",
      name: "Child Activity 1",
      created: new Date(),
      lastAccessed: new Date(),
      active: true,
      parentActivityId: testActivity1.activityId,
    };

    const childActivity2: Activity = {
      activityId: "child-activity-2",
      name: "Child Activity 2",
      created: new Date(),
      lastAccessed: new Date(),
      active: false,
      parentActivityId: testActivity1.activityId,
    };

    await createActivity(childActivity1);
    await createActivity(childActivity2);

    // Get children of parent
    const children = await getChildActivities(testActivity1.activityId);

    // Verify children were retrieved correctly
    expect(children).toHaveLength(2);
    expect(children.map((c) => c.activityId).sort()).toEqual(
      [childActivity1.activityId, childActivity2.activityId].sort(),
    );

    // All children should have the correct parent ID
    children.forEach((child) => {
      expect(child.parentActivityId).toBe(testActivity1.activityId);
    });
  });

  it("should fail deleting a parent activity which has children", async () => {
    // Create parent activity
    await createActivity(testActivity1);

    // Create child activity
    const childActivity: Activity = {
      activityId: "child-activity-1",
      name: "Child Activity 1",
      created: new Date(),
      lastAccessed: new Date(),
      active: true,
      parentActivityId: testActivity1.activityId,
    };

    await createActivity(childActivity);

    // Verify both activities exist
    const parentBefore = await getActivityById(testActivity1.activityId);
    const childBefore = await getActivityById(childActivity.activityId);
    expect(parentBefore).not.toBeNull();
    expect(childBefore).not.toBeNull();

    // Try to delete the parent (should fail due to foreign key constraint)
    let error: any;
    try {
      await deleteActivity(testActivity1.activityId);
      // If we get here, the test should fail
      expect(true).toBe(false); // This should not be reached
    } catch (e) {
      error = e;
    }

    // Verify the error occurred due to foreign key constraint
    expect(error).toBeDefined();
    expect(error.message).toContain("foreign key constraint");

    // Verify both activities still exist
    const parentAfter = await getActivityById(testActivity1.activityId);
    const childAfter = await getActivityById(childActivity.activityId);
    expect(parentAfter).not.toBeNull();
    expect(childAfter).not.toBeNull();
  });

  it("should delete parent and children when cascade parameter is true", async () => {
    // Create parent activity
    await createActivity(testActivity1);

    // Create child activity
    const childActivity: Activity = {
      activityId: "child-activity-1",
      name: "Child Activity 1",
      created: new Date(),
      lastAccessed: new Date(),
      active: true,
      parentActivityId: testActivity1.activityId,
    };

    await createActivity(childActivity);

    // Create grandchild activity
    const grandchildActivity: Activity = {
      activityId: "grandchild-activity-1",
      name: "Grandchild Activity 1",
      created: new Date(),
      lastAccessed: new Date(),
      active: true,
      parentActivityId: childActivity.activityId,
    };

    await createActivity(grandchildActivity);

    // Verify all activities exist
    expect(await getActivityById(testActivity1.activityId)).not.toBeNull();
    expect(await getActivityById(childActivity.activityId)).not.toBeNull();
    expect(await getActivityById(grandchildActivity.activityId)).not.toBeNull();

    // Delete the parent with cascade=true
    await deleteActivity(testActivity1.activityId, true);

    // Verify all activities are deleted
    expect(await getActivityById(testActivity1.activityId)).toBeNull();
    expect(await getActivityById(childActivity.activityId)).toBeNull();
    expect(await getActivityById(grandchildActivity.activityId)).toBeNull();
  });

  it("should retrieve activity tree with correct hierarchy and depth", async () => {
    // Create a three-level hierarchy:
    // Root
    // ├── Child 1
    // │   └── Grandchild 1
    // └── Child 2
    
    // Create root activity
    const rootActivity: Activity = {
      activityId: "root-activity",
      name: "Root Activity",
      created: new Date(),
      lastAccessed: new Date(),
      active: true,
    };
    await createActivity(rootActivity);

    // Create first child activity
    const child1Activity: Activity = {
      activityId: "child-activity-1",
      name: "Child Activity 1",
      created: new Date(),
      lastAccessed: new Date(),
      active: true,
      parentActivityId: rootActivity.activityId,
    };
    await createActivity(child1Activity);

    // Create second child activity
    const child2Activity: Activity = {
      activityId: "child-activity-2",
      name: "Child Activity 2",
      created: new Date(),
      lastAccessed: new Date(),
      active: true,
      parentActivityId: rootActivity.activityId,
    };
    await createActivity(child2Activity);

    // Create grandchild activity
    const grandchildActivity: Activity = {
      activityId: "grandchild-activity",
      name: "Grandchild Activity",
      created: new Date(),
      lastAccessed: new Date(),
      active: true,
      parentActivityId: child1Activity.activityId,
    };
    await createActivity(grandchildActivity);

    // Get the activity tree
    const tree = await activityTree();

    // Verify tree structure
    expect(tree).toHaveLength(4); // Root + 2 children + 1 grandchild

    // Find each activity in the tree
    const rootInTree = tree.find(a => a.activityId === rootActivity.activityId);
    const child1InTree = tree.find(a => a.activityId === child1Activity.activityId);
    const child2InTree = tree.find(a => a.activityId === child2Activity.activityId);
    const grandchildInTree = tree.find(a => a.activityId === grandchildActivity.activityId);

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
    expect(rootInTree?.parentActivityId).toBeNull();
    expect(child1InTree?.parentActivityId).toBe(rootActivity.activityId);
    expect(child2InTree?.parentActivityId).toBe(rootActivity.activityId);
    expect(grandchildInTree?.parentActivityId).toBe(child1Activity.activityId);

    // Verify ordering (parents should come before their children)
    const rootIndex = tree.findIndex(a => a.activityId === rootActivity.activityId);
    const child1Index = tree.findIndex(a => a.activityId === child1Activity.activityId);
    const child2Index = tree.findIndex(a => a.activityId === child2Activity.activityId);
    const grandchildIndex = tree.findIndex(a => a.activityId === grandchildActivity.activityId);

    expect(rootIndex).toBeLessThan(child1Index);
    expect(rootIndex).toBeLessThan(child2Index);
    expect(child1Index).toBeLessThan(grandchildIndex);
  });

  it("should limit activity tree depth to 3 levels", async () => {
    // Create a four-level hierarchy to test depth limitation:
    // Root
    // └── Level 1
    //     └── Level 2
    //         └── Level 3 (should be included)
    //             └── Level 4 (should NOT be included)
    
    // Create activities for each level
    const activities: Activity[] = [];
    
    // Create root activity (level 0)
    const rootActivity: Activity = {
      activityId: "depth-root",
      name: "Depth Root",
      created: new Date(),
      lastAccessed: new Date(),
      active: true,
    };
    await createActivity(rootActivity);
    activities.push(rootActivity);
    
    // Create child activities for levels 1-4
    let parentId = rootActivity.activityId;
    for (let i = 1; i <= 4; i++) {
      const activity: Activity = {
        activityId: `depth-level-${i}`,
        name: `Depth Level ${i}`,
        created: new Date(),
        lastAccessed: new Date(),
        active: true,
        parentActivityId: parentId,
      };
      await createActivity(activity);
      activities.push(activity);
      parentId = activity.activityId;
    }
    
    // Get the activity tree
    const tree = await activityTree();
    
    // Find our test activities in the tree
    const treeActivityIds = tree.map(a => a.activityId);
    
    // Verify levels 0-3 are included
    expect(treeActivityIds).toContain("depth-root");
    expect(treeActivityIds).toContain("depth-level-1");
    expect(treeActivityIds).toContain("depth-level-2");
    expect(treeActivityIds).toContain("depth-level-3");
    
    // Verify level 4 is NOT included (due to depth limit of 3)
    expect(treeActivityIds).not.toContain("depth-level-4");
    
    // Verify correct depth values for included activities
    const level0 = tree.find(a => a.activityId === "depth-root");
    const level1 = tree.find(a => a.activityId === "depth-level-1");
    const level2 = tree.find(a => a.activityId === "depth-level-2");
    const level3 = tree.find(a => a.activityId === "depth-level-3");
    
    expect(level0?.depth).toBe(0);
    expect(level1?.depth).toBe(1);
    expect(level2?.depth).toBe(2);
    expect(level3?.depth).toBe(3);
  });
});
