import { Node } from "../types.mts";
import { getConnection } from "../db.mts";
import { nanoid } from "nanoid";
import { getCurrentContext } from "./context.mts";
import * as logger from "../logger.mts";

export type NodeTreeItem = Node & {
  depth?: number;
  selected: boolean;
};

export enum NodeTreeFilter {
  ALL = "all",
  RECENT = "recent",
  TEMP = "temp",
  CONTEXT = "context",
}

// Define NodeCreate type as a partial of Node with required fields
export type NodeCreate = {
  activityId?: string;
  name: string;
  orgId?: string;
  orgText?: string;
  created?: Date;
  lastAccessed?: Date;
  active?: boolean;
  parentNodeId?: string;
  temp?: boolean;
  workspaceId?: string;
};

export async function createNode(
  node: NodeCreate,
): Promise<string> {
  const client = await getConnection();
  const { orgId, orgText, name, parentNodeId } = node;

  // Use provided values or defaults
  const active = node.active ?? true;
  const nodeId = node.nodeId || nanoid();

  try {
    // If parentNodeId is provided, check if it exists
    if (parentNodeId) {
      const parentExists = await client.query(
        "SELECT 1 FROM nodes WHERE nodeId = $1",
        [parentNodeId],
      );

      if (parentExists.rows.length === 0) {
        throw new Error(
          `Parent node with ID ${parentNodeId} does not exist`,
        );
      }
    }

    // Use provided temp value or default to false
    const temp = node.temp ?? false;

    await client.query(
      `
              INSERT INTO nodes (
                  nodeId, orgId, orgText, name, created, lastAccessed,
                  active, parent_id, temp
              ) VALUES 
              ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $5, $6, $7);
          `,
      [
        nodeId,
        orgId ?? "",
        orgText ?? "",
        name,
        active,
        parentNodeId || null,
        temp,
      ],
    );

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
      orgId: row.orgid,
      orgText: row.orgtext,
      name: row.name,
      created: new Date(row.created),
      lastAccessed: new Date(row.lastaccessed),
      active: row.active,
      parentNodeId: row.parent_id,
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
      orgId: row.orgid,
      orgText: row.orgtext,
      name: row.name,
      created: new Date(row.created),
      lastAccessed: new Date(row.lastaccessed),
      active: row.active,
      parentNodeId: row.parent_id,
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
      orgId,
      orgText,
      name,
      lastAccessed,
      active,
      nodeId,
      parentNodeId,
      temp,
      workspaceId,
    } = node;

    const fieldMappings: [string, any][] = [
      ["parent_id", parentNodeId],
      ["orgid", orgId],
      ["orgtext", orgText],
      ["name", name],
      ["lastaccessed", lastAccessed?.toISOString()],
      ["active", active],
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

export async function getActiveNodes(): Promise<Node[]> {
  try {
    const client = await getConnection();
    const result = await client.query(
      "SELECT * FROM nodes WHERE active = true;",
    );

    if (result.rows.length === 0) {
      return [];
    }

    return result.rows.map((row: any) => ({
      nodeId: row.nodeid,
      orgId: row.orgid,
      orgText: row.orgtext,
      name: row.name,
      created: new Date(row.created),
      lastAccessed: new Date(row.lastaccessed),
      active: row.active,
      parentNodeId: row.parent_id,
    }));
  } catch (error) {
    logger.error("Error getting active nodes:", error);
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
      "SELECT * FROM nodes WHERE parent_id = $1;",
      [parentNodeId],
    );

    if (result.rows.length === 0) {
      return [];
    }

    return result.rows.map((row: any) => ({
      nodeId: row.nodeid,
      orgId: row.orgid,
      orgText: row.orgtext,
      name: row.name,
      created: new Date(row.created),
      lastAccessed: new Date(row.lastaccessed),
      active: row.active,
      parentNodeId: row.parent_id,
    }));
  } catch (error) {
    logger.error("Error getting child nodes:", error);
    throw error;
  }
}

/**
 * Creates a new node as a child of the specified parent node
 * @param node The node to create
 * @param parentNodeId The ID of the parent node
 * @returns The ID of the created node
 */
export async function createChildNode(
  node: NodeCreate,
  parentNodeId: string,
): Promise<string> {
  // Create a new node with the parent ID
  return await createNode({
    ...node,
    parentNodeId,
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
  // If it's a root node (no parent), just return the name
  if (!node.parentNodeId) {
    return node.name;
  }

  // Build the hierarchy path
  const path: string[] = [node.name];
  let currentId = node.parentNodeId;
  let isDirectParentRoot = false;

  // Traverse up the hierarchy to build the path
  while (currentId) {
    // First try to find the parent in the provided nodes array
    let parent = nodes.find((a) => a.nodeId === currentId);

    // If not found in the array, fetch it directly from the database
    if (!parent) {
      const fetchedParent = await getNodeById(currentId);
      if (fetchedParent) {
        parent = {
          ...fetchedParent,
          selected: false,
          depth: 0, // Default depth
        };
      } else {
        logger.debug(
          `Parent not found for ID: ${currentId}, node: ${node.name}`,
        );
        break;
      }
    }

    // If this is a root parent (no parent of its own), mark it
    if (!parent.parentNodeId) {
      isDirectParentRoot = true;
    } else {
      // Only add non-root parents to the path
      path.unshift(parent.name);
    }

    currentId = parent.parentNodeId;
  }

  // Join the path with "→"
  return path.join(" → ");
}

export async function nodeTree(
  filter: NodeTreeFilter = NodeTreeFilter.ALL,
): Promise<NodeTreeItem[]> {
  try {
    const client = await getConnection();

    // Build the filter condition for the base case
    let filterCondition = "";
    if (filter === NodeTreeFilter.RECENT) {
      // Nodes from the last 7 days
      filterCondition =
        "AND lastaccessed > (CURRENT_TIMESTAMP - INTERVAL '7 days')";
    } else if (filter === NodeTreeFilter.TEMP) {
      // Only temporary nodes
      filterCondition = "AND temp = true";
    }

    // This recursive CTE query:
    // 1. Starts with root nodes (parent_id IS NULL) that match the filter
    // 2. Recursively joins to find children up to depth 3
    // 3. Orders results so parents come before children
    const result = await client.query(`
      WITH RECURSIVE node_tree AS (
        -- Base case: select root nodes (no parent) with filter applied
        SELECT 
          nodeid, 
          orgid, 
          orgtext, 
          name, 
          created, 
          lastaccessed, 
          active, 
          parent_id,
          temp,
          0 AS depth,
          ARRAY[nodeid] AS path
        FROM nodes
        WHERE parent_id IS NULL ${filterCondition}
        
        UNION ALL
        
        -- Recursive case: select children and increment depth
        SELECT 
          a.nodeid, 
          a.orgid, 
          a.orgtext, 
          a.name, 
          a.created, 
          a.lastaccessed, 
          a.active, 
          a.parent_id,
          a.temp,
          at.depth + 1 AS depth,
          at.path || a.nodeid AS path
        FROM nodes a
        JOIN node_tree at ON a.parent_id = at.nodeid
        WHERE at.depth < 3  -- Limit recursion to depth 3
        ${filter === NodeTreeFilter.TEMP ? "AND a.temp = true" : ""}
      )
      
      SELECT 
        nodeid, 
        orgid, 
        orgtext, 
        name, 
        created, 
        lastaccessed, 
        active, 
        parent_id,
        temp,
        depth
      FROM node_tree
      ORDER BY 
        CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,  -- Root nodes first
        CASE WHEN parent_id IS NULL THEN lastaccessed END DESC,  -- Sort roots by lastaccessed
        path;  -- Then ensure parents come before children
    `);

    if (result.rows.length === 0) {
      return [];
    }

    const mappedResults = result.rows.map((row: any) => ({
      nodeId: row.nodeid,
      orgId: row.orgid,
      orgText: row.orgtext,
      name: row.name,
      created: new Date(row.created),
      lastAccessed: new Date(row.lastaccessed),
      active: row.active,
      parentNodeId: row.parent_id,
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
