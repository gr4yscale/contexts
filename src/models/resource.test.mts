import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getConnection } from "../db.mts";
import { setupTestDatabase, teardownTestDatabase } from "../testUtils.mts";
import {
  createResource,
  getResourceById,
  getAllResources,
  updateResource,
  deleteResource,
  getResourcesByType,
  addResourceNode,
  removeResourceNode,
  getResourceNodes,
  getNodeResources,
  ResourceCreate,
  ResourceType,
  Resource,
} from "./resource.mts";
import { createNode, NodeCreate } from "./node.mts";

const isIntegrationTest = process.env.RUN_INTEGRATION_TESTS === "true";

// Skip tests if not running integration tests
const testSuite = isIntegrationTest ? describe : describe.skip;

testSuite("Resource Model Integration Tests", () => {
  // Test resource data
  const testResource1: ResourceCreate = {
    name: "Test Link Resource",
    data: { url: "https://example.com" },
    type: ResourceType.LINK,
  };

  const testResource2: ResourceCreate = {
    name: "Test Text Resource",
    data: { path: "/path/to/text.txt" },
    type: ResourceType.TEXT,
  };

  const testResource3: ResourceCreate = {
    name: "Test PDF Resource",
    data: { path: "/path/to/document.pdf" },
    type: ResourceType.PDF,
  };

  // Test node data
  const testNode1: NodeCreate = {
    name: "Test Node 1",
    active: true,
    orgId: "org-id-1",
    orgText: "* Test Org Text 1",
  };

  const testNode2: NodeCreate = {
    name: "Test Node 2",
    active: true,
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

    // Clear existing data - only if tables exist
    try {
      await client.query("DELETE FROM resources");
    } catch (error) {
      // Table might not exist yet, ignore the error
    }
    
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
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      const client = await getConnection();

      // Drop test tables
      await client.query("DROP TABLE IF EXISTS resources CASCADE");
      await client.query("DROP TABLE IF EXISTS nodes CASCADE");

      // teardown test db container after tests
      await teardownTestDatabase();
    } catch (error) {
      console.error("Error cleaning up test environment:", error);
    }
  });

  it("should create a resource", async () => {
    // Create a resource
    const resourceId = await createResource(testResource1);

    // Verify the resource was created
    const resource = await getResourceById(resourceId);
    expect(resource).toBeDefined();
    expect(resource?.id).toBe(resourceId);
    expect(resource?.name).toBe(testResource1.name);
    expect(resource?.data).toEqual(testResource1.data);
    expect(resource?.type).toBe(testResource1.type);
  });

  it("should get a resource by ID", async () => {
    // Create a resource
    const resourceId = await createResource(testResource1);

    // Get the resource by ID
    const resource = await getResourceById(resourceId);

    // Verify the resource was retrieved
    expect(resource).toBeDefined();
    expect(resource?.id).toBe(resourceId);
    expect(resource?.name).toBe(testResource1.name);
    expect(resource?.data).toEqual(testResource1.data);
    expect(resource?.type).toBe(testResource1.type);
  });

  it("should return null when getting a non-existent resource", async () => {
    // Get a non-existent resource
    const resource = await getResourceById(999999);

    // Verify null was returned
    expect(resource).toBeNull();
  });

  it("should get all resources", async () => {
    // Create test resources
    const resourceId1 = await createResource(testResource1);
    const resourceId2 = await createResource(testResource2);

    // Get all resources
    const resources = await getAllResources();

    // Verify resources were retrieved
    expect(resources).toHaveLength(2);

    // Find resources by ID
    const resource1 = resources.find((r) => r.id === resourceId1);
    const resource2 = resources.find((r) => r.id === resourceId2);

    expect(resource1).toBeDefined();
    expect(resource1?.name).toBe(testResource1.name);
    expect(resource1?.type).toBe(testResource1.type);

    expect(resource2).toBeDefined();
    expect(resource2?.name).toBe(testResource2.name);
    expect(resource2?.type).toBe(testResource2.type);
  });

  it("should update a resource", async () => {
    // Create a resource
    const resourceId = await createResource(testResource1);

    // Update the resource
    const updatedName = "Updated Resource Name";
    const updatedData = { url: "https://updated-example.com" };
    await updateResource(resourceId, {
      name: updatedName,
      data: updatedData,
    });

    // Get the updated resource
    const resource = await getResourceById(resourceId);

    // Verify the resource was updated
    expect(resource).toBeDefined();
    expect(resource?.name).toBe(updatedName);
    expect(resource?.data).toEqual(updatedData);
    // Verify other fields weren't changed
    expect(resource?.type).toBe(testResource1.type);
  });

  it("should delete a resource", async () => {
    // Create a resource
    const resourceId = await createResource(testResource1);

    // Delete the resource
    const deleted = await deleteResource(resourceId);

    // Verify deletion was successful
    expect(deleted).toBe(true);

    // Try to get the deleted resource
    const resource = await getResourceById(resourceId);

    // Verify the resource was deleted
    expect(resource).toBeNull();
  });

  it("should get resources by type", async () => {
    // Create resources of different types
    const linkResourceId = await createResource(testResource1); // LINK
    const textResourceId = await createResource(testResource2); // TEXT
    const pdfResourceId = await createResource(testResource3); // PDF

    // Get resources by type
    const linkResources = await getResourcesByType(ResourceType.LINK);
    const textResources = await getResourcesByType(ResourceType.TEXT);
    const pdfResources = await getResourcesByType(ResourceType.PDF);

    // Verify correct resources were retrieved
    expect(linkResources).toHaveLength(1);
    expect(linkResources[0].id).toBe(linkResourceId);
    expect(linkResources[0].type).toBe(ResourceType.LINK);

    expect(textResources).toHaveLength(1);
    expect(textResources[0].id).toBe(textResourceId);
    expect(textResources[0].type).toBe(ResourceType.TEXT);

    expect(pdfResources).toHaveLength(1);
    expect(pdfResources[0].id).toBe(pdfResourceId);
    expect(pdfResources[0].type).toBe(ResourceType.PDF);
  });

  it("should handle empty results", async () => {
    // Get all resources from empty table
    const resources = await getAllResources();

    // Verify empty array was returned
    expect(resources).toHaveLength(0);

    // Get resources by type from empty table
    const linkResources = await getResourcesByType(ResourceType.LINK);
    expect(linkResources).toHaveLength(0);
  });

  describe("Resource-Node Relationships", () => {
    it("should add a node to a resource", async () => {
      // Create a resource and a node
      const resourceId = await createResource(testResource1);
      const nodeId = await createNode(testNode1);

      // Add the node to the resource
      await addResourceNode(resourceId, nodeId);

      // Verify the relationship was created
      const nodes = await getResourceNodes(resourceId);
      expect(nodes.map(n => n.nodeId)).toContain(nodeId);
      expect(nodes).toHaveLength(1);
    });

    it("should add multiple nodes to a resource", async () => {
      // Create a resource and multiple nodes
      const resourceId = await createResource(testResource1);
      const nodeId1 = await createNode(testNode1);
      const nodeId2 = await createNode(testNode2);

      // Add both nodes to the resource
      await addResourceNode(resourceId, nodeId1);
      await addResourceNode(resourceId, nodeId2);

      // Verify both relationships were created
      const nodes = await getResourceNodes(resourceId);
      const nodeIds = nodes.map(n => n.nodeId);
      expect(nodeIds).toContain(nodeId1);
      expect(nodeIds).toContain(nodeId2);
      expect(nodes).toHaveLength(2);
    });

    it("should not add duplicate node relationships", async () => {
      // Create a resource and a node
      const resourceId = await createResource(testResource1);
      const nodeId = await createNode(testNode1);

      // Add the node to the resource twice
      await addResourceNode(resourceId, nodeId);
      await addResourceNode(resourceId, nodeId);

      // Verify only one relationship exists
      const nodes = await getResourceNodes(resourceId);
      expect(nodes.map(n => n.nodeId)).toContain(nodeId);
      expect(nodes).toHaveLength(1);
    });

    it("should remove a node from a resource", async () => {
      // Create a resource and a node
      const resourceId = await createResource(testResource1);
      const nodeId = await createNode(testNode1);

      // Add the node to the resource
      await addResourceNode(resourceId, nodeId);

      // Verify the relationship was created
      let nodes = await getResourceNodes(resourceId);
      expect(nodes.map(n => n.nodeId)).toContain(nodeId);

      // Remove the node from the resource
      await removeResourceNode(resourceId, nodeId);

      // Verify the relationship was removed
      nodes = await getResourceNodes(resourceId);
      expect(nodes.map(n => n.nodeId)).not.toContain(nodeId);
      expect(nodes).toHaveLength(0);
    });

    it("should remove only the specified node from a resource with multiple nodes", async () => {
      // Create a resource and multiple nodes
      const resourceId = await createResource(testResource1);
      const nodeId1 = await createNode(testNode1);
      const nodeId2 = await createNode(testNode2);

      // Add both nodes to the resource
      await addResourceNode(resourceId, nodeId1);
      await addResourceNode(resourceId, nodeId2);

      // Remove only the first node
      await removeResourceNode(resourceId, nodeId1);

      // Verify only the first relationship was removed
      const nodes = await getResourceNodes(resourceId);
      const nodeIds = nodes.map(n => n.nodeId);
      expect(nodeIds).not.toContain(nodeId1);
      expect(nodeIds).toContain(nodeId2);
      expect(nodes).toHaveLength(1);
    });

    it("should handle removing a non-existent node relationship gracefully", async () => {
      // Create a resource and a node
      const resourceId = await createResource(testResource1);
      const nodeId = await createNode(testNode1);

      // Try to remove a node that was never added
      await removeResourceNode(resourceId, nodeId);

      // Verify the resource still exists and has no nodes
      const nodes = await getResourceNodes(resourceId);
      expect(nodes).toHaveLength(0);
    });

    it("should get all nodes associated with a resource", async () => {
      // Create a resource and multiple nodes
      const resourceId = await createResource(testResource1);
      const nodeId1 = await createNode(testNode1);
      const nodeId2 = await createNode(testNode2);

      // Add both nodes to the resource
      await addResourceNode(resourceId, nodeId1);
      await addResourceNode(resourceId, nodeId2);

      // Get all nodes for the resource
      const nodes = await getResourceNodes(resourceId);

      // Verify both nodes were retrieved
      expect(nodes).toHaveLength(2);
      const nodeIds = nodes.map((n) => n.nodeId);
      expect(nodeIds).toContain(nodeId1);
      expect(nodeIds).toContain(nodeId2);

      // Verify node properties
      const node1 = nodes.find((n) => n.nodeId === nodeId1);
      const node2 = nodes.find((n) => n.nodeId === nodeId2);
      expect(node1?.name).toBe(testNode1.name);
      expect(node2?.name).toBe(testNode2.name);
    });

    it("should return empty array when getting nodes for resource with no associations", async () => {
      // Create a resource with no node associations
      const resourceId = await createResource(testResource1);

      // Get nodes for the resource
      const nodes = await getResourceNodes(resourceId);

      // Verify empty array was returned
      expect(nodes).toHaveLength(0);
    });

    it("should get all resources associated with a node", async () => {
      // Create multiple resources and a node
      const resourceId1 = await createResource(testResource1);
      const resourceId2 = await createResource(testResource2);
      const resourceId3 = await createResource(testResource3);
      const nodeId = await createNode(testNode1);

      // Associate the node with first two resources
      await addResourceNode(resourceId1, nodeId);
      await addResourceNode(resourceId2, nodeId);

      // Get all resources for the node
      const resources = await getNodeResources(nodeId);

      // Verify only the associated resources were retrieved
      expect(resources).toHaveLength(2);
      const resourceIds = resources.map((r) => r.id);
      expect(resourceIds).toContain(resourceId1);
      expect(resourceIds).toContain(resourceId2);
      expect(resourceIds).not.toContain(resourceId3);

      // Verify resource properties
      const resource1 = resources.find((r) => r.id === resourceId1);
      const resource2 = resources.find((r) => r.id === resourceId2);
      expect(resource1?.name).toBe(testResource1.name);
      expect(resource1?.type).toBe(testResource1.type);
      expect(resource2?.name).toBe(testResource2.name);
      expect(resource2?.type).toBe(testResource2.type);
    });

    it("should return empty array when getting resources for node with no associations", async () => {
      // Create a node with no resource associations
      const nodeId = await createNode(testNode1);

      // Get resources for the node
      const resources = await getNodeResources(nodeId);

      // Verify empty array was returned
      expect(resources).toHaveLength(0);
    });

    it("should handle complex many-to-many relationships", async () => {
      // Create multiple resources and nodes
      const resourceId1 = await createResource(testResource1);
      const resourceId2 = await createResource(testResource2);
      const nodeId1 = await createNode(testNode1);
      const nodeId2 = await createNode(testNode2);

      // Create cross-relationships:
      // Resource1 -> Node1, Node2
      // Resource2 -> Node1
      await addResourceNode(resourceId1, nodeId1);
      await addResourceNode(resourceId1, nodeId2);
      await addResourceNode(resourceId2, nodeId1);

      // Verify Resource1 has both nodes
      const resource1Nodes = await getResourceNodes(resourceId1);
      expect(resource1Nodes).toHaveLength(2);
      const resource1NodeIds = resource1Nodes.map((n) => n.nodeId);
      expect(resource1NodeIds).toContain(nodeId1);
      expect(resource1NodeIds).toContain(nodeId2);

      // Verify Resource2 has only Node1
      const resource2Nodes = await getResourceNodes(resourceId2);
      expect(resource2Nodes).toHaveLength(1);
      expect(resource2Nodes[0].nodeId).toBe(nodeId1);

      // Verify Node1 is associated with both resources
      const node1Resources = await getNodeResources(nodeId1);
      expect(node1Resources).toHaveLength(2);
      const node1ResourceIds = node1Resources.map((r) => r.id);
      expect(node1ResourceIds).toContain(resourceId1);
      expect(node1ResourceIds).toContain(resourceId2);

      // Verify Node2 is associated with only Resource1
      const node2Resources = await getNodeResources(nodeId2);
      expect(node2Resources).toHaveLength(1);
      expect(node2Resources[0].id).toBe(resourceId1);
    });

    it("should maintain relationships when updating resource properties", async () => {
      // Create a resource and node with relationship
      const resourceId = await createResource(testResource1);
      const nodeId = await createNode(testNode1);
      await addResourceNode(resourceId, nodeId);

      // Update the resource name
      await updateResource(resourceId, { name: "Updated Resource Name" });

      // Verify the relationship is maintained
      const nodes = await getResourceNodes(resourceId);
      expect(nodes.map(n => n.nodeId)).toContain(nodeId);
      
      const updatedResource = await getResourceById(resourceId);
      expect(updatedResource?.name).toBe("Updated Resource Name");

      // Verify the relationship works both ways
      const nodeResources = await getNodeResources(nodeId);
      expect(nodeResources).toHaveLength(1);
      expect(nodeResources[0].id).toBe(resourceId);
      expect(nodeResources[0].name).toBe("Updated Resource Name");
    });
  });
});
