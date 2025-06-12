import { Node } from "../types.mts";
import { getConnection } from "../db.mts";
import { nanoid } from "nanoid";
import { getCurrentContext } from "./context.mts";
import * as logger from "../logger.mts";

export type NodeTreeItem = Node & {
  depth?: number;
  selected: boolean;
  parentNodeIds?: string[];
};

export enum NodeTreeFilter {
  ALL = "all",
  RECENT = "recent",
  TEMP = "temp",
  CONTEXT = "context",
  PROJECTS = "projects",
  TRAILS = "trails",
  TOPICS = "topics",
  MODES = "modes",
  TAGS = "tags",
}

// Define NodeCreate type as a partial of Node with required fields
export type NodeCreate = {
  name: string;
  created?: Date;
  lastAccessed?: Date;
  parentNodeIds?: string[];
  temp?: boolean;
  workspaceId?: string;
};

export async function createNode(
  node: NodeCreate,
): Promise<string> {
  const client = await getConnection();
  const { name, parentNodeIds } = node;

  const nodeId = nanoid();

  try {
    // If parentNodeIds are provided, check if they exist
    if (parentNodeIds && parentNodeIds.length > 0) {
      for (const parentId of parentNodeIds) {
        const parentExists = await client.query(
          "SELECT 1 FROM nodes WHERE nodeId = $1",
          [parentId],
        );

        if (parentExists.rows.length === 0) {
          throw new Error(
            `Parent node with ID ${parentId} does not exist`,
          );
        }
      }
    }

    // Use provided temp value or default to false
    const temp = node.temp ?? false;

    await client.query(
      `
              INSERT INTO nodes (
                  nodeId, name, created, lastAccessed, temp
              ) VALUES 
              ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3);
          `,
      [
        nodeId,
        name,
        temp,
      ],
    );

    // Insert parent-child relationships if parentNodeIds are provided
    if (parentNodeIds && parentNodeIds.length > 0) {
      for (const parentId of parentNodeIds) {
        await client.query(
          `INSERT INTO node_relationships (parent_node_id, child_node_id) 
           VALUES ($1, $2)`,
          [parentId, nodeId],
        );
      }
    }

    return nodeId;
  } catch (error) {
    logger.error("Error creating node:", error);
    throw error;
  }
}

/**
 * Fetches the node tree for the last created context
 * Sets the selected field based on whether the node is in the context
 * @param filter - The filter to apply to the nodes (all, recent, temp, context)
 * @returns Array of nodes with depth and selection information
 */
export async function filteredNodeTree(
  filter: NodeTreeFilter = NodeTreeFilter.ALL,
): Promise<NodeTreeItem[]> {
  try {
    // Get nodes filtered by the specified filter (except for CONTEXT which needs special handling)
    const filteredNodes = await nodeTree(
      filter ? filter : NodeTreeFilter.ALL,
    );

    const currentContext = await getCurrentContext();
    // Handle null context case
    if (!currentContext) {
      logger.debug(`No current context found`);
      if (filter === NodeTreeFilter.CONTEXT) {
        return [];
      }

      // For non-CONTEXT filters with no context, return all nodes as unselected
      return filteredNodes.map((node) => ({
        ...node,
        selected: false,
      }));
    }

    // Get the set of node IDs in the context for faster lookup
    const contextNodeIds = new Set(currentContext.nodeIds);

    if (filter === NodeTreeFilter.CONTEXT) {
      const contextFilteredNodes = filteredNodes.filter((node) =>
        contextNodeIds.has(node.nodeId),
      );

      return contextFilteredNodes.map((node) => ({
        ...node,
        selected: true,
      }));
    }

    // For non-CONTEXT filters, just return the filtered nodes with selected=false
    const result = filteredNodes.map((node) => ({
      ...node,
      selected: contextNodeIds.has(node.nodeId),
    }));

    return result;
  } catch (error) {
    logger.error("Error getting filtered node tree:", error);
    throw error;
  }
}

export async function getNodeById(
  nodeId: string,
): Promise<Node | null> {
  try {
    const client = await getConnection();
    const result = await client.query(
      "SELECT * FROM nodes WHERE nodeId = $1;",
      [nodeId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      nodeId: row.nodeid,
      name: row.name,
      created: new Date(row.created),
      lastAccessed: new Date(row.lastaccessed),
      temp: row.temp,
    };
  } catch (error) {
    logger.error("Error getting node:", error);
    throw error;
  }
}

export async function getAllNodes(): Promise<Node[]> {
  try {
    const client = await getConnection();
    const result = await client.query("SELECT * FROM nodes;");

    if (result.rows.length === 0) {
      return [];
    }

    return result.rows.map((row: any) => ({
      nodeId: row.nodeid,
      name: row.name,
      created: new Date(row.created),
      lastAccessed: new Date(row.lastaccessed),
      temp: row.temp,
    }));
  } catch (error) {
    logger.error("Error getting all nodes:", error);
    throw error;
  }
}

export async function updateNode(
  node: Partial<Node>,
): Promise<void> {
  try {
    const client = await getConnection();
    const fields: string[] = [];
    const values: any[] = [];

    const {
      name,
      lastAccessed,
      nodeId,
      temp,
      workspaceId,
    } = node;

    const fieldMappings: [string, any][] = [
      ["name", name],
      ["lastaccessed", lastAccessed?.toISOString()],
      ["temp", temp],
      ["workspace_id", workspaceId],
    ];

    let paramIndex = 1;
    fieldMappings.forEach(([field, value]) => {
      if (value !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(nodeId);

    const query = `UPDATE nodes SET ${fields.join(
      ", ",
    )} WHERE nodeid = $${paramIndex};`;

    await client.query(query, values);
  } catch (error) {
    logger.error("Error updating node:", error);
    throw error;
  }
}

export async function deleteNode(
  nodeId: string,
  cascade: boolean = false,
): Promise<void> {
  try {
    const client = await getConnection();

    // If cascade is true, first delete all child nodes
    if (cascade) {
      // Get all child nodes
      const childNodes = await getChildNodes(nodeId);

      // Delete each child node
      for (const child of childNodes) {
        // Recursively delete with cascade to handle nested hierarchies
        await deleteNode(child.nodeId, true);
      }
    } else {
      // If not cascading, check if node has children and prevent deletion
      const childNodes = await getChildNodes(nodeId);
      if (childNodes.length > 0) {
        throw new Error(
          `Cannot delete node ${nodeId}: node has ${childNodes.length} child node(s). Use cascade=true to delete children as well.`
        );
      }
    }

    // Now delete the node itself
    await client.query("DELETE FROM nodes WHERE nodeId = $1;", [
      nodeId,
    ]);
  } catch (error) {
    logger.error("Error deleting node:", error);
    throw error;
  }
}


export async function updateNodeHistory(
  currentNodeId: string,
  previousNodeId: string,
): Promise<void> {
  try {
    const client = await getConnection();

    // Check if the previous node ID exists or is empty
    let validPreviousId = null;
    if (previousNodeId && previousNodeId.trim() !== "") {
      const prevNodeExists = await client.query(
        "SELECT 1 FROM nodes WHERE nodeId = $1",
        [previousNodeId],
      );

      if (prevNodeExists.rows.length > 0) {
        validPreviousId = previousNodeId;
      }
    }

    // Insert a new record in the node_history table
    await client.query(
      `INSERT INTO node_history (current_node_id, previous_node_id)
       VALUES ($1, $2)`,
      [currentNodeId, validPreviousId],
    );

    // Update the lastAccessed timestamp for the current node
    await client.query(
      `UPDATE nodes SET lastAccessed = CURRENT_TIMESTAMP 
       WHERE nodeId = $1`,
      [currentNodeId],
    );
  } catch (error) {
    logger.error("Error updating node history:", error);
    throw error;
  }
}

export async function getCurrentNode(): Promise<Node | null> {
  try {
    const client = await getConnection();

    // Get the most recent node history record
    const result = await client.query(
      `SELECT current_node_id FROM node_history
       ORDER BY timestamp DESC LIMIT 1`,
    );

    if (result.rows.length === 0) {
      return null;
    }

    const currentNodeId = result.rows[0].current_node_id;

    if (!currentNodeId) {
      logger.debug(
        "Current node ID from history is null or undefined. No current node.",
      );
      return null;
    }

    return getNodeById(currentNodeId);
  } catch (error) {
    logger.error("Error retrieving current node:", error);
    throw error;
  }
}

export async function getPreviousNode(): Promise<Node | null> {
  try {
    const client = await getConnection();

    // Get the most recent node history record
    const result = await client.query(
      `SELECT previous_node_id FROM node_history
       ORDER BY timestamp DESC LIMIT 1`,
    );

    if (
      result.rows.length === 0 ||
      result.rows[0].previous_node_id === null
    ) {
      return null;
    }

    const previousNodeId = result.rows[0].previous_node_id;
    return getNodeById(previousNodeId);
  } catch (error) {
    logger.error("Error retrieving previous node:", error);
    throw error;
  }
}

/**
 * Gets all child nodes for a given parent node
 * @param parentNodeId The ID of the parent node
 * @returns Array of child nodes
 */
export async function getChildNodes(
  parentNodeId: string,
): Promise<Node[]> {
  try {
    const client = await getConnection();
    const result = await client.query(
      `SELECT n.* FROM nodes n
       INNER JOIN node_relationships nr ON n.nodeId = nr.child_node_id
       WHERE nr.parent_node_id = $1;`,
      [parentNodeId],
    );

    if (result.rows.length === 0) {
      return [];
    }

    return result.rows.map((row: any) => ({
      nodeId: row.nodeid,
      name: row.name,
      created: new Date(row.created),
      lastAccessed: new Date(row.lastaccessed),
      temp: row.temp,
    }));
  } catch (error) {
    logger.error("Error getting child nodes:", error);
    throw error;
  }
}

/**
 * Creates a new node as a child of the specified parent node(s)
 * @param node The node to create
 * @param parentNodeIds The IDs of the parent nodes
 * @returns The ID of the created node
 */
export async function createChildNode(
  node: NodeCreate,
  parentNodeIds: string[],
): Promise<string> {
  // Create a new node with the parent IDs
  return await createNode({
    ...node,
    parentNodeIds,
  });
}

/**
 * Recursively fetches nodes and their children up to a maximum depth of 3
 * @param filter - The filter to apply to the nodes (all, recent, temp)
 * @returns Array of nodes with depth information
 */
/**
 * Formats an node name with its hierarchy path
 * @param node - The node to format
 * @param nodes - All nodes in the tree
 * @returns Formatted node name with hierarchy (e.g. "parent > child > grandchild")
 */
export async function formatNodeWithHierarchy(
  node: NodeTreeItem,
  nodes: NodeTreeItem[],
): Promise<string> {
  // Get the parent nodes for this node
  const parentNodes = await getParentNodes(node.nodeId);
  
  // If it's a root node (no parents), just return the name
  if (parentNodes.length === 0) {
    return node.name;
  }

  // For simplicity, use the first parent to build hierarchy path
  // In a DAG, a node could have multiple parents, but we'll show one path
  const firstParent = parentNodes[0];
  
  // Build the hierarchy path by recursively getting parent names
  const buildPath = async (nodeId: string): Promise<string[]> => {
    const parents = await getParentNodes(nodeId);
    if (parents.length === 0) {
      const currentNode = await getNodeById(nodeId);
      return currentNode ? [currentNode.name] : [];
    }
    
    // Use first parent for path building
    const parentPath = await buildPath(parents[0].nodeId);
    const currentNode = await getNodeById(nodeId);
    return currentNode ? [...parentPath, currentNode.name] : parentPath;
  };

  const fullPath = await buildPath(node.nodeId);
  
  // Join the path with "→"
  return fullPath.join(" → ");
}

/**
 * Gets all parent nodes for a given child node
 * @param childNodeId The ID of the child node
 * @returns Array of parent nodes
 */
export async function getParentNodes(
  childNodeId: string,
): Promise<Node[]> {
  try {
    const client = await getConnection();
    const result = await client.query(
      `SELECT n.* FROM nodes n
       INNER JOIN node_relationships nr ON n.nodeId = nr.parent_node_id
       WHERE nr.child_node_id = $1;`,
      [childNodeId],
    );

    if (result.rows.length === 0) {
      return [];
    }

    return result.rows.map((row: any) => ({
      nodeId: row.nodeid,
      name: row.name,
      created: new Date(row.created),
      lastAccessed: new Date(row.lastaccessed),
      temp: row.temp,
    }));
  } catch (error) {
    logger.error("Error getting parent nodes:", error);
    throw error;
  }
}

/**
 * Gets all parent node IDs for a given child node
 * @param childNodeId The ID of the child node
 * @returns Array of parent node IDs
 */
export async function getParentNodeIds(
  childNodeId: string,
): Promise<string[]> {
  try {
    const parentNodes = await getParentNodes(childNodeId);
    return parentNodes.map(node => node.nodeId);
  } catch (error) {
    logger.error("Error getting parent node IDs:", error);
    throw error;
  }
}

/**
 * Checks if adding a relationship between two nodes would create a cycle
 * @param parentNodeId The ID of the parent node
 * @param childNodeId The ID of the child node
 * @returns Promise<boolean> True if a cycle would be created, false otherwise
 */
async function detectCycle(
  parentNodeId: string,
  childNodeId: string,
): Promise<boolean> {
  try {
    const client = await getConnection();
    
    // Check if there's already a path from childNodeId to parentNodeId
    const result = await client.query(`
      WITH RECURSIVE path_check AS (
        -- Base case: start from the child node
        SELECT child_node_id AS current_node, ARRAY[child_node_id] AS path
        FROM node_relationships 
        WHERE parent_node_id = $1
        
        UNION ALL
        
        -- Recursive case: follow the path down
        SELECT nr.child_node_id AS current_node, pc.path || nr.child_node_id AS path
        FROM node_relationships nr
        JOIN path_check pc ON nr.parent_node_id = pc.current_node
        WHERE NOT (nr.child_node_id = ANY(pc.path))  -- Prevent infinite loops
        AND array_length(pc.path, 1) < 100  -- Safety limit
      )
      SELECT 1 FROM path_check WHERE current_node = $2
    `, [childNodeId, parentNodeId]);

    return result.rows.length > 0;
  } catch (error) {
    logger.error("Error checking for cycle:", error);
    throw error;
  }
}

/**
 * Adds a parent-child relationship between two nodes
 * @param parentNodeId The ID of the parent node
 * @param childNodeId The ID of the child node
 */
export async function addNodeRelationship(
  parentNodeId: string,
  childNodeId: string,
): Promise<void> {
  try {
    const client = await getConnection();
    
    // Check if both nodes exist
    const parentExists = await client.query(
      "SELECT 1 FROM nodes WHERE nodeId = $1",
      [parentNodeId],
    );
    const childExists = await client.query(
      "SELECT 1 FROM nodes WHERE nodeId = $1",
      [childNodeId],
    );

    if (parentExists.rows.length === 0) {
      throw new Error(`Parent node with ID ${parentNodeId} does not exist`);
    }
    if (childExists.rows.length === 0) {
      throw new Error(`Child node with ID ${childNodeId} does not exist`);
    }

    const relationshipExists = await client.query(
      "SELECT 1 FROM node_relationships WHERE parent_node_id = $1 AND child_node_id = $2",
      [parentNodeId, childNodeId],
    );

    if (relationshipExists.rows.length > 0) {
      throw new Error(`Relationship already exists between ${parentNodeId} and ${childNodeId}`);
    }

    if (await detectCycle(parentNodeId, childNodeId)) {
      throw new Error(`Cannot add relationship: would create a cycle between ${parentNodeId} and ${childNodeId}`);
    }
    
    await client.query(
      `INSERT INTO node_relationships (parent_node_id, child_node_id) 
       VALUES ($1, $2)`,
      [parentNodeId, childNodeId],
    );
  } catch (error) {
    logger.error("Error adding node relationship:", error);
    throw error;
  }
}

/**
 * Sets the parent relationships for a node, replacing all existing relationships
 * @param childNodeId The ID of the child node
 * @param parentNodeIds Array of parent node IDs to set
 */
export async function setNodeParents(
  childNodeId: string,
  parentNodeIds: string[],
): Promise<void> {
  try {
    const client = await getConnection();
    
    // Check if child node exists
    const childExists = await client.query(
      "SELECT 1 FROM nodes WHERE nodeId = $1",
      [childNodeId],
    );

    if (childExists.rows.length === 0) {
      throw new Error(`Child node with ID ${childNodeId} does not exist`);
    }

    // Check if all parent nodes exist
    for (const parentNodeId of parentNodeIds) {
      const parentExists = await client.query(
        "SELECT 1 FROM nodes WHERE nodeId = $1",
        [parentNodeId],
      );

      if (parentExists.rows.length === 0) {
        throw new Error(`Parent node with ID ${parentNodeId} does not exist`);
      }

      // Check for cycles
      if (await detectCycle(parentNodeId, childNodeId)) {
        throw new Error(`Cannot add relationship: would create a cycle between ${parentNodeId} and ${childNodeId}`);
      }
    }

    // Remove all existing parent relationships
    await client.query(
      `DELETE FROM node_relationships WHERE child_node_id = $1`,
      [childNodeId],
    );

    // Add new parent relationships
    for (const parentNodeId of parentNodeIds) {
      await client.query(
        `INSERT INTO node_relationships (parent_node_id, child_node_id) 
         VALUES ($1, $2)`,
        [parentNodeId, childNodeId],
      );
    }
  } catch (error) {
    logger.error("Error setting node parents:", error);
    throw error;
  }
}

/**
 * Removes a parent-child relationship between two nodes
 * @param parentNodeId The ID of the parent node
 * @param childNodeId The ID of the child node
 */
export async function removeNodeRelationship(
  parentNodeId: string,
  childNodeId: string,
): Promise<void> {
  try {
    const client = await getConnection();
    
    await client.query(
      `DELETE FROM node_relationships 
       WHERE parent_node_id = $1 AND child_node_id = $2`,
      [parentNodeId, childNodeId],
    );
  } catch (error) {
    logger.error("Error removing node relationship:", error);
    throw error;
  }
}

export async function nodeTree(
  filter: NodeTreeFilter = NodeTreeFilter.ALL,
): Promise<NodeTreeItem[]> {
  try {
    const client = await getConnection();

    // Build the filter condition for the base case
    let filterCondition = "";
    let nodeIdForType = "";
    
    if (filter === NodeTreeFilter.RECENT) {
      // Nodes from the last 7 days
      filterCondition =
        "AND lastaccessed > (CURRENT_TIMESTAMP - INTERVAL '7 days')";
    } else if (filter === NodeTreeFilter.TEMP) {
      // Only temporary nodes
      filterCondition = "AND temp = true";
    } else if (filter === NodeTreeFilter.PROJECTS) {
      nodeIdForType = "z-bJhwlUaeUhEsO2Ts_VC";
    } else if (filter === NodeTreeFilter.TRAILS) {
      nodeIdForType = "Ud_NiOMjCZiXBAxi8pBID";
    } else if (filter === NodeTreeFilter.TOPICS) {
      nodeIdForType = "8mAFMg8bCzELMcBCcF3Xg";
    } else if (filter === NodeTreeFilter.MODES) {
      nodeIdForType = "UZENv7LTTolbL0sa5RVL1";
    } else if (filter === NodeTreeFilter.TAGS) {
      nodeIdForType = "1nGe7HBcOdnHwdw8Eg_Kl";
    }

    // This recursive CTE query for DAG:
    // 1. Starts with root nodes (no parents in node_relationships) that match the filter
    // 2. Recursively joins to find children up to depth 3
    // 3. Orders results so parents come before children
    let result;
    
    if (nodeIdForType) {
      // For specific node filters, start from the specific node and get its children
      result = await client.query(`
        WITH RECURSIVE node_tree AS (
          -- Base case: select the specific node
          SELECT 
            n.nodeid, 
            n.name, 
            n.created, 
            n.lastaccessed, 
            n.temp,
            0 AS depth,
            ARRAY[n.nodeid] AS path
          FROM nodes n
          WHERE n.nodeid = $1
          
          UNION ALL
          
          -- Recursive case: select children and increment depth
          SELECT 
            n.nodeid, 
            n.name, 
            n.created, 
            n.lastaccessed,
            n.temp,
            nt.depth + 1 AS depth,
            nt.path || n.nodeid AS path
          FROM nodes n
          JOIN node_relationships nr ON n.nodeid = nr.child_node_id
          JOIN node_tree nt ON nr.parent_node_id = nt.nodeid
          WHERE nt.depth < 3  -- Limit recursion to depth 3
          AND NOT (n.nodeid = ANY(nt.path))  -- Prevent cycles
        )
        
        SELECT DISTINCT
          nodeid, 
          name, 
          created, 
          lastaccessed,
          temp,
          MIN(depth) as depth  -- Use minimum depth if node appears multiple times
        FROM node_tree
        GROUP BY nodeid, name, created, lastaccessed, temp
        ORDER BY 
          depth,  -- Order by depth first
          lastaccessed DESC;  -- Then by last accessed
      `, [nodeIdForType]);
    } else {
      // For other filters, use the original query
      result = await client.query(`
        WITH RECURSIVE node_tree AS (
          -- Base case: select root nodes (no parents in relationships table) with filter applied
          SELECT 
            n.nodeid, 
            n.name, 
            n.created, 
            n.lastaccessed, 
            n.temp,
            0 AS depth,
            ARRAY[n.nodeid] AS path
          FROM nodes n
          WHERE NOT EXISTS (
            SELECT 1 FROM node_relationships nr WHERE nr.child_node_id = n.nodeid
          ) ${filterCondition}
          
          UNION ALL
          
          -- Recursive case: select children and increment depth
          SELECT 
            n.nodeid, 
            n.name, 
            n.created, 
            n.lastaccessed,
            n.temp,
            nt.depth + 1 AS depth,
            nt.path || n.nodeid AS path
          FROM nodes n
          JOIN node_relationships nr ON n.nodeid = nr.child_node_id
          JOIN node_tree nt ON nr.parent_node_id = nt.nodeid
          WHERE nt.depth < 3  -- Limit recursion to depth 3
          AND NOT (n.nodeid = ANY(nt.path))  -- Prevent cycles
          ${filter === NodeTreeFilter.TEMP ? "AND n.temp = true" : ""}
        )
        
        SELECT DISTINCT
          nodeid, 
          name, 
          created, 
          lastaccessed,
          temp,
          MIN(depth) as depth  -- Use minimum depth if node appears multiple times
        FROM node_tree
        GROUP BY nodeid, name, created, lastaccessed, temp
        ORDER BY 
          depth,  -- Order by depth first
          lastaccessed DESC;  -- Then by last accessed
      `);
    }

    if (result.rows.length === 0) {
      return [];
    }

    const mappedResults = result.rows.map((row: any) => ({
      nodeId: row.nodeid,
      name: row.name,
      created: new Date(row.created),
      lastAccessed: new Date(row.lastaccessed),
      temp: row.temp,
      depth: row.depth,
      selected: false,
    }));

    return mappedResults;
  } catch (error) {
    logger.error("Error getting node tree:", error);
    throw error;
  }
}
