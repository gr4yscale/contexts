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
  nodeTree,
  updateNodeHistory,
  getCurrentNode,
  getPreviousNode,
  getChildNodes,
  getParentNodes,
  addNodeRelationship,
  removeNodeRelationship,
  NodeCreate,
  filteredNodeTree,
  NodeTreeFilter,
} from "./node.mts";
import { Node } from "../types.mts";

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

    // Clear existing data - only if tables exist
    try {
      await client.query("DELETE FROM node_relationships");
    } catch (error) {
      // Table might not exist yet, ignore the error
    }

    try {
      await client.query("DELETE FROM nodes");
    } catch (error) {
      // Table might not exist yet, ignore the error
    }

    try {
      await client.query("DELETE FROM node_history");
    } catch (error) {
      // Table might not exist yet, ignore the error
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      const client = await getConnection();

      // Drop test tables
      await client.query("DROP TABLE IF EXISTS nodes CASCADE");

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
  });

  it("should return null when getting a non-existent node", async () => {
    // Get a non-existent node
    const node = await getNodeById("non-existent-id");

    // Verify null was returned
    expect(node).toBeNull();
  });

  it("should get all nodes", async () => {
    // Create test nodes
    const nodeId1 = await createNode(testNode1);
    const nodeId2 = await createNode(testNode2);

    // Get all nodes
    const nodes = await getAllNodes();

    // Verify nodes were retrieved
    expect(nodes).toHaveLength(2);

    // Find nodes by ID
    const node1 = nodes.find((a) => a.nodeId === nodeId1);
    const node2 = nodes.find((a) => a.nodeId === nodeId2);

    expect(node1).toBeDefined();
    expect(node1?.name).toBe(testNode1.name);
    expect(node2).toBeDefined();
    expect(node2?.name).toBe(testNode2.name);
  });

  it("should update an node", async () => {
    // Create an node
    const nodeId = await createNode(testNode1);

    // Update the node
    const updatedName = "Updated Node Name";
    const updatedOrgText = "* Updated Org Text";
    await updateNode({
      nodeId: nodeId,
      name: updatedName,
    });

    // Get the updated node
    const node = await getNodeById(nodeId);

    // Verify the node was updated
    expect(node).toBeDefined();
    expect(node?.name).toBe(updatedName);
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

  it("should handle empty results", async () => {
    // Get all nodes from empty table
    const nodes = await getAllNodes();

    // Verify empty array was returned
    expect(nodes).toHaveLength(0);
  });

  it("should create an node with a parent-child relationship", async () => {
    // Create parent node
    const parentId = await createNode(testNode1);

    // Create child node with parent reference
    const childNode: NodeCreate = {
      name: "Child Node 1",
      parentNodeIds: [parentId],
    };

    const childId = await createNode(childNode);

    // Verify the child node was created with correct parent reference
    const retrievedChild = await getNodeById(childId);
    expect(retrievedChild).toBeDefined();

    // Verify the relationship exists in the database
    const client = await getConnection();
    const relationshipResult = await client.query(
      "SELECT * FROM node_relationships WHERE parent_node_id = $1 AND child_node_id = $2",
      [parentId, childId],
    );
    expect(relationshipResult.rows.length).toBe(1);
  });

  it("should get child nodes of a parent", async () => {
    // Create parent node
    const parentId = await createNode(testNode1);

    // Create multiple child nodes
    const childNode1: NodeCreate = {
      name: "Child Node 1",
      active: true,
      parentNodeIds: [parentId],
    };

    const childNode2: NodeCreate = {
      name: "Child Node 2",
      active: false,
      parentNodeIds: [parentId],
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
  });

  it("should fail deleting a parent node which has children", async () => {
    // Create parent node
    const parentId = await createNode(testNode1);

    // Create child node
    const childNode: NodeCreate = {
      name: "Child Node 1",
      active: true,
      parentNodeIds: [parentId],
    };

    const childId = await createNode(childNode);

    // Verify both nodes exist
    const parentBefore = await getNodeById(parentId);
    const childBefore = await getNodeById(childId);
    expect(parentBefore).not.toBeNull();
    expect(childBefore).not.toBeNull();

    // Verify the relationship exists
    const client = await getConnection();
    const relationshipsBefore = await client.query(
      "SELECT * FROM node_relationships WHERE parent_node_id = $1",
      [parentId],
    );
    expect(relationshipsBefore.rows.length).toBe(1);

    // Try to delete the parent (should fail due to foreign key constraint on node_relationships)
    let error: any;
    try {
      await deleteNode(parentId);
      // If we get here, the test should fail
      expect(true).toBe(false); // This should not be reached
    } catch (e) {
      error = e;
    }

    // Verify the error occurred due to having children
    expect(error).toBeDefined();
    expect(error.message).toContain("Cannot delete node");
    expect(error.message).toContain("child node(s)");

    // Verify both nodes still exist
    const parentAfter = await getNodeById(parentId);
    const childAfter = await getNodeById(childId);
    expect(parentAfter).not.toBeNull();
    expect(childAfter).not.toBeNull();

    // Verify relationship still exists
    const relationshipsAfter = await client.query(
      "SELECT * FROM node_relationships WHERE parent_node_id = $1",
      [parentId],
    );
    expect(relationshipsAfter.rows.length).toBe(1);
  });

  it("should delete parent and children when cascade parameter is true", async () => {
    // Create parent node
    const parentId = await createNode(testNode1);

    // Create child node
    const childNode: NodeCreate = {
      name: "Child Node 1",
      active: true,
      parentNodeIds: [parentId],
    };

    const childId = await createNode(childNode);

    // Create grandchild node
    const grandchildNode: NodeCreate = {
      name: "Grandchild Node 1",
      parentNodeIds: [childId],
    };

    const grandchildId = await createNode(grandchildNode);

    // Verify all nodes exist
    expect(await getNodeById(parentId)).not.toBeNull();
    expect(await getNodeById(childId)).not.toBeNull();
    expect(await getNodeById(grandchildId)).not.toBeNull();

    // Delete the parent with cascade=true
    await deleteNode(parentId, true);

    // Verify all nodes are deleted
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
      name: "Root Node",
    });

    // Create first child node
    const child1Id = await createNode({
      name: "Child Node 1",
      parentNodeIds: [rootId],
    });

    // Create second child node
    const child2Id = await createNode({
      name: "Child Node 2",
      parentNodeIds: [rootId],
    });

    // Create grandchild node
    const grandchildId = await createNode({
      name: "Grandchild Node",
      parentNodeIds: [child1Id],
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

    // Verify all nodes are in the tree
    expect(rootInTree).toBeDefined();
    expect(child1InTree).toBeDefined();
    expect(child2InTree).toBeDefined();
    expect(grandchildInTree).toBeDefined();

    // Verify correct depth values
    expect(rootInTree?.depth).toBe(0);
    expect(child1InTree?.depth).toBe(1);
    expect(child2InTree?.depth).toBe(1);
    expect(grandchildInTree?.depth).toBe(2);

    // Verify parent-child relationships exist in database
    const client = await getConnection();

    // Root should have no parents
    const rootParents = await client.query(
      "SELECT * FROM node_relationships WHERE child_node_id = $1",
      [rootId],
    );
    expect(rootParents.rows.length).toBe(0);

    // Child1 should have root as parent
    const child1Parents = await client.query(
      "SELECT * FROM node_relationships WHERE child_node_id = $1",
      [child1Id],
    );
    expect(child1Parents.rows.length).toBe(1);
    expect(child1Parents.rows[0].parent_node_id).toBe(rootId);

    // Child2 should have root as parent
    const child2Parents = await client.query(
      "SELECT * FROM node_relationships WHERE child_node_id = $1",
      [child2Id],
    );
    expect(child2Parents.rows.length).toBe(1);
    expect(child2Parents.rows[0].parent_node_id).toBe(rootId);

    // Grandchild should have child1 as parent
    const grandchildParents = await client.query(
      "SELECT * FROM node_relationships WHERE child_node_id = $1",
      [grandchildId],
    );
    expect(grandchildParents.rows.length).toBe(1);
    expect(grandchildParents.rows[0].parent_node_id).toBe(child1Id);

    // Verify ordering (parents should come before their children)
    const rootIndex = tree.findIndex((a) => a.nodeId === rootId);
    const child1Index = tree.findIndex((a) => a.nodeId === child1Id);
    const child2Index = tree.findIndex((a) => a.nodeId === child2Id);
    const grandchildIndex = tree.findIndex((a) => a.nodeId === grandchildId);

    expect(rootIndex).toBeLessThan(child1Index);
    expect(rootIndex).toBeLessThan(child2Index);
    expect(child1Index).toBeLessThan(grandchildIndex);
  });

  it("should update node history and retrieve current node", async () => {
    // Create two test nodes
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
    // Create three test nodes
    const nodeId1 = await createNode(testNode1);
    const nodeId2 = await createNode(testNode2);

    const testNode3: NodeCreate = {
      nodeId: "test-node-3",
      name: "Test Node 3",
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

    // Get current and previous nodes
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
      name: "Depth Root",
    });

    // Create child nodes for levels 1-4
    let parentId = rootId;
    const levelIds = [rootId];

    for (let i = 1; i <= 4; i++) {
      const nodeId = await createNode({
        name: `Depth Level ${i}`,
        parentNodeIds: [parentId],
      });
      levelIds.push(nodeId);
      parentId = nodeId;
    }

    // Get the node tree
    const tree = await nodeTree();

    // Find our test nodes in the tree
    const treeNodeIds = tree.map((a) => a.nodeId);

    // Verify levels 0-3 are included
    expect(treeNodeIds).toContain(rootId);
    expect(treeNodeIds).toContain(levelIds[1]);
    expect(treeNodeIds).toContain(levelIds[2]);
    expect(treeNodeIds).toContain(levelIds[3]);

    // Verify level 4 is NOT included (due to depth limit of 3)
    expect(treeNodeIds).not.toContain(levelIds[4]);

    // Verify correct depth values for included nodes
    const level0 = tree.find((a) => a.nodeId === rootId);
    const level1 = tree.find((a) => a.nodeId === levelIds[1]);
    const level2 = tree.find((a) => a.nodeId === levelIds[2]);
    const level3 = tree.find((a) => a.nodeId === levelIds[3]);

    expect(level0?.depth).toBe(0);
    expect(level1?.depth).toBe(1);
    expect(level2?.depth).toBe(2);
    expect(level3?.depth).toBe(3);
  });

  describe("filteredNodeTree", () => {
    it("should return all nodes with ALL filter", async () => {
      // Create several nodes
      const node1 = await createNode({
        name: "Regular Node 1",
      });

      const node2 = await createNode({
        name: "Regular Node 2",
      });

      const node3 = await createNode({
        name: "Temp Node",
        temp: true,
      });

      // Get filtered nodes with ALL filter
      const allNodes = await filteredNodeTree(NodeTreeFilter.ALL);

      // Should include all nodes
      const nodeIds = allNodes.map((a) => a.nodeId);
      expect(nodeIds).toContain(node1);
      expect(nodeIds).toContain(node2);
      expect(nodeIds).toContain(node3);

      // All should have selected = false
      expect(allNodes.every((a) => a.selected === false)).toBe(true);
    });

    it("should return only temp nodes with TEMP filter", async () => {
      // Create regular and temp nodes
      const regularNode = await createNode({
        name: "Regular Node",
        temp: false,
      });

      const tempNode1 = await createNode({
        name: "Temp Node 1",
        temp: true,
      });

      const tempNode2 = await createNode({
        name: "Temp Node 2",
        temp: true,
      });

      // Get filtered nodes with TEMP filter
      const tempNodes = await filteredNodeTree(NodeTreeFilter.TEMP);

      // Should only include temp nodes
      const nodeIds = tempNodes.map((a) => a.nodeId);
      expect(nodeIds).not.toContain(regularNode);
      expect(nodeIds).toContain(tempNode1);
      expect(nodeIds).toContain(tempNode2);

      // All should have selected = false
      expect(tempNodes.every((a) => a.selected === false)).toBe(true);
    });

    it("should return recent nodes with RECENT filter", async () => {
      // Create an node and update its lastAccessed to be older
      const oldNode = await createNode({
        name: "Old Node",
      });

      // Manually update the lastAccessed date to be older than 7 days
      const client = await getConnection();
      await client.query(
        "UPDATE nodes SET lastAccessed = CURRENT_TIMESTAMP - INTERVAL '8 days' WHERE nodeId = $1",
        [oldNode],
      );

      // Create a new node (which will have current timestamp)
      const recentNode = await createNode({
        name: "Recent Node",
      });

      // Get filtered nodes with RECENT filter
      const recentNodes = await filteredNodeTree(NodeTreeFilter.RECENT);

      // Should only include recent nodes
      const nodeIds = recentNodes.map((a) => a.nodeId);
      expect(nodeIds).not.toContain(oldNode);
      expect(nodeIds).toContain(recentNode);
    });

    it("should mark nodes in context as selected with CONTEXT filter", async () => {
      // Create nodes
      const node1 = await createNode({
        name: "Node 1",
      });

      const node2 = await createNode({
        name: "Node 2",
      });

      const node3 = await createNode({
        name: "Node 3",
      });

      // Create a context with node1 and node3
      const contextId = await createContext({
        name: "Test Context",
        nodeIds: [node1, node3],
      });

      // Get filtered nodes with CONTEXT filter
      const contextNodes = await filteredNodeTree(NodeTreeFilter.CONTEXT);

      // All nodes should be included
      const nodeIds = contextNodes.map((a) => a.nodeId);
      expect(nodeIds).toContain(node1);
      expect(nodeIds).toContain(node2);
      expect(nodeIds).toContain(node3);

      // Check selected state
      const node1InResult = contextNodes.find((a) => a.nodeId === node1);
      const node2InResult = contextNodes.find((a) => a.nodeId === node2);
      const node3InResult = contextNodes.find((a) => a.nodeId === node3);

      expect(node1InResult?.selected).toBe(true);
      expect(node2InResult?.selected).toBe(false);
      expect(node3InResult?.selected).toBe(true);
    });

    it("should handle empty context with CONTEXT filter", async () => {
      // Create nodes
      const node1 = await createNode({
        name: "Node 1",
      });

      const node2 = await createNode({
        name: "Node 2",
      });

      // Create a context with no nodes
      const contextId = await createContext({
        name: "Empty Context",
        nodeIds: [],
      });

      // Get filtered nodes with CONTEXT filter
      const contextNodes = await filteredNodeTree(NodeTreeFilter.CONTEXT);

      // All nodes should be included but none selected
      const nodeIds = contextNodes.map((a) => a.nodeId);
      expect(nodeIds).toContain(node1);
      expect(nodeIds).toContain(node2);

      // All should have selected = false
      expect(contextNodes.every((a) => a.selected === false)).toBe(true);
    });

    it("should support multiple parents in DAG structure", async () => {
      // Create nodes for DAG structure:
      // Parent1   Parent2
      //    \       /
      //     Child

      const parent1Id = await createNode({
        name: "Parent 1",
      });

      const parent2Id = await createNode({
        name: "Parent 2",
      });

      // Create child with multiple parents
      const childId = await createNode({
        name: "Child Node",
        parentNodeIds: [parent1Id, parent2Id],
      });

      // Verify relationships exist
      const client = await getConnection();
      const relationships = await client.query(
        "SELECT * FROM node_relationships WHERE child_node_id = $1",
        [childId],
      );

      expect(relationships.rows.length).toBe(2);
      const parentIds = relationships.rows.map((r) => r.parent_node_id);
      expect(parentIds).toContain(parent1Id);
      expect(parentIds).toContain(parent2Id);

      // Verify getParentNodes returns both parents
      const parents = await getParentNodes(childId);
      expect(parents.length).toBe(2);
      expect(parents.map((p) => p.nodeId)).toContain(parent1Id);
      expect(parents.map((p) => p.nodeId)).toContain(parent2Id);

      // Verify getChildNodes works for both parents
      const children1 = await getChildNodes(parent1Id);
      const children2 = await getChildNodes(parent2Id);
      expect(children1.length).toBe(1);
      expect(children2.length).toBe(1);
      expect(children1[0].nodeId).toBe(childId);
      expect(children2[0].nodeId).toBe(childId);
    });

    it("should add and remove node relationships", async () => {
      // Create nodes
      const parentId = await createNode({
        name: "Parent Node",
      });

      const childId = await createNode({
        name: "Child Node",
      });

      // Add relationship
      await addNodeRelationship(parentId, childId);

      // Verify relationship exists
      const client = await getConnection();
      const relationships = await client.query(
        "SELECT * FROM node_relationships WHERE parent_node_id = $1 AND child_node_id = $2",
        [parentId, childId],
      );
      expect(relationships.rows.length).toBe(1);

      // Remove relationship
      await removeNodeRelationship(parentId, childId);

      // Verify relationship is removed
      const relationshipsAfter = await client.query(
        "SELECT * FROM node_relationships WHERE parent_node_id = $1 AND child_node_id = $2",
        [parentId, childId],
      );
      expect(relationshipsAfter.rows.length).toBe(0);
    });

    it("should prevent duplicate relationships", async () => {
      // Create nodes
      const parentId = await createNode({
        name: "Parent Node",
        active: true,
      });

      const childId = await createNode({
        name: "Child Node",
        active: true,
      });

      // Add relationship
      await addNodeRelationship(parentId, childId);

      // Try to add the same relationship again
      let error: any;
      try {
        await addNodeRelationship(parentId, childId);
        expect(true).toBe(false); // Should not reach here
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toContain("Relationship already exists");
    });

    it("should validate node existence when adding relationships", async () => {
      const realNodeId = await createNode({
        name: "Real Node",
      });

      // Try to add relationship with non-existent parent
      let error: any;
      try {
        await addNodeRelationship("non-existent-parent", realNodeId);
        expect(true).toBe(false); // Should not reach here
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toContain(
        "Parent node with ID non-existent-parent does not exist",
      );

      // Try to add relationship with non-existent child
      try {
        await addNodeRelationship(realNodeId, "non-existent-child");
        expect(true).toBe(false); // Should not reach here
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toContain(
        "Child node with ID non-existent-child does not exist",
      );
    });
  });
});
