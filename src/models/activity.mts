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
  activity: NodeCreate,
): Promise<string> {
  const client = await getConnection();
  const { orgId, orgText, name, parentNodeId } = activity;

  // Use provided values or defaults
  const active = activity.active ?? true;
  const activityId = activity.activityId || nanoid();

  try {
    // If parentNodeId is provided, check if it exists
    if (parentNodeId) {
      const parentExists = await client.query(
        "SELECT 1 FROM activities WHERE activityId = $1",
        [parentNodeId],
      );

      if (parentExists.rows.length === 0) {
        throw new Error(
          `Parent activity with ID ${parentNodeId} does not exist`,
        );
      }
    }

    // Use provided temp value or default to false
    const temp = activity.temp ?? false;

    await client.query(
      `
              INSERT INTO activities (
                  activityId, orgId, orgText, name, created, lastAccessed,
                  active, parent_id, temp
              ) VALUES 
              ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $5, $6, $7);
          `,
      [
        activityId,
        orgId ?? "",
        orgText ?? "",
        name,
        active,
        parentNodeId || null,
        temp,
      ],
    );

    return activityId;
  } catch (error) {
    logger.error("Error creating activity:", error);
    throw error;
  }
}

/**
 * Fetches the activity tree for the last created context
 * Sets the selected field based on whether the activity is in the context
 * @param filter - The filter to apply to the activities (all, recent, temp, context)
 * @returns Array of activities with depth and selection information
 */
export async function filteredNodeTree(
  filter: NodeTreeFilter = NodeTreeFilter.ALL,
): Promise<NodeTreeItem[]> {
  try {
    // Get activities filtered by the specified filter (except for CONTEXT which needs special handling)
    const filteredActivities = await activityTree(
      filter ? filter : NodeTreeFilter.ALL,
    );

    const currentContext = await getCurrentContext();
    // Handle null context case
    if (!currentContext) {
      logger.debug(`No current context found`);
      if (filter === NodeTreeFilter.CONTEXT) {
        return [];
      }

      // For non-CONTEXT filters with no context, return all activities as unselected
      return filteredActivities.map((activity) => ({
        ...activity,
        selected: false,
      }));
    }

    // Get the set of activity IDs in the context for faster lookup
    const contextNodeIds = new Set(currentContext.activityIds);

    if (filter === NodeTreeFilter.CONTEXT) {
      const contextFilteredActivities = filteredActivities.filter((activity) =>
        contextNodeIds.has(activity.activityId),
      );

      return contextFilteredActivities.map((activity) => ({
        ...activity,
        selected: true,
      }));
    }

    // For non-CONTEXT filters, just return the filtered activities with selected=false
    const result = filteredActivities.map((activity) => ({
      ...activity,
      selected: contextNodeIds.has(activity.activityId),
    }));

    return result;
  } catch (error) {
    logger.error("Error getting filtered activity tree:", error);
    throw error;
  }
}

export async function getNodeById(
  activityId: string,
): Promise<Node | null> {
  try {
    const client = await getConnection();
    const result = await client.query(
      "SELECT * FROM activities WHERE activityId = $1;",
      [activityId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      activityId: row.activityid,
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
    logger.error("Error getting activity:", error);
    throw error;
  }
}

export async function getAllActivities(): Promise<Node[]> {
  try {
    const client = await getConnection();
    const result = await client.query("SELECT * FROM activities;");

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
      parentNodeId: row.parent_id,
    }));
  } catch (error) {
    logger.error("Error getting all activities:", error);
    throw error;
  }
}

export async function updateNode(
  activity: Partial<Node>,
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
      activityId,
      parentNodeId,
      temp,
      workspaceId,
    } = activity;

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

    values.push(activityId);

    const query = `UPDATE activities SET ${fields.join(
      ", ",
    )} WHERE activityid = $${paramIndex};`;

    await client.query(query, values);
  } catch (error) {
    logger.error("Error updating activity:", error);
    throw error;
  }
}

export async function deleteNode(
  activityId: string,
  cascade: boolean = false,
): Promise<void> {
  try {
    const client = await getConnection();

    // If cascade is true, first delete all child activities
    if (cascade) {
      // Get all child activities
      const childActivities = await getChildActivities(activityId);

      // Delete each child activity
      for (const child of childActivities) {
        // Recursively delete with cascade to handle nested hierarchies
        await deleteNode(child.activityId, true);
      }
    }

    // Now delete the activity itself
    await client.query("DELETE FROM activities WHERE activityId = $1;", [
      activityId,
    ]);
  } catch (error) {
    logger.error("Error deleting activity:", error);
    throw error;
  }
}

export async function getActiveActivities(): Promise<Node[]> {
  try {
    const client = await getConnection();
    const result = await client.query(
      "SELECT * FROM activities WHERE active = true;",
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
      parentNodeId: row.parent_id,
    }));
  } catch (error) {
    logger.error("Error getting active activities:", error);
    throw error;
  }
}

export async function updateNodeHistory(
  currentNodeId: string,
  previousNodeId: string,
): Promise<void> {
  try {
    const client = await getConnection();

    // Check if the previous activity ID exists or is empty
    let validPreviousId = null;
    if (previousNodeId && previousNodeId.trim() !== "") {
      const prevNodeExists = await client.query(
        "SELECT 1 FROM activities WHERE activityId = $1",
        [previousNodeId],
      );

      if (prevNodeExists.rows.length > 0) {
        validPreviousId = previousNodeId;
      }
    }

    // Insert a new record in the activity_history table
    await client.query(
      `INSERT INTO activity_history (current_activity_id, previous_activity_id)
       VALUES ($1, $2)`,
      [currentNodeId, validPreviousId],
    );

    // Update the lastAccessed timestamp for the current activity
    await client.query(
      `UPDATE activities SET lastAccessed = CURRENT_TIMESTAMP 
       WHERE activityId = $1`,
      [currentNodeId],
    );
  } catch (error) {
    logger.error("Error updating activity history:", error);
    throw error;
  }
}

export async function getCurrentNode(): Promise<Node | null> {
  try {
    const client = await getConnection();

    // Get the most recent activity history record
    const result = await client.query(
      `SELECT current_activity_id FROM activity_history
       ORDER BY timestamp DESC LIMIT 1`,
    );

    if (result.rows.length === 0) {
      return null;
    }

    const currentNodeId = result.rows[0].current_activity_id;

    if (!currentNodeId) {
      logger.debug(
        "Current activity ID from history is null or undefined. No current activity.",
      );
      return null;
    }

    return getNodeById(currentNodeId);
  } catch (error) {
    logger.error("Error retrieving current activity:", error);
    throw error;
  }
}

export async function getPreviousNode(): Promise<Node | null> {
  try {
    const client = await getConnection();

    // Get the most recent activity history record
    const result = await client.query(
      `SELECT previous_activity_id FROM activity_history
       ORDER BY timestamp DESC LIMIT 1`,
    );

    if (
      result.rows.length === 0 ||
      result.rows[0].previous_activity_id === null
    ) {
      return null;
    }

    const previousNodeId = result.rows[0].previous_activity_id;
    return getNodeById(previousNodeId);
  } catch (error) {
    logger.error("Error retrieving previous activity:", error);
    throw error;
  }
}

/**
 * Gets all child activities for a given parent activity
 * @param parentNodeId The ID of the parent activity
 * @returns Array of child activities
 */
export async function getChildActivities(
  parentNodeId: string,
): Promise<Node[]> {
  try {
    const client = await getConnection();
    const result = await client.query(
      "SELECT * FROM activities WHERE parent_id = $1;",
      [parentNodeId],
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
      parentNodeId: row.parent_id,
    }));
  } catch (error) {
    logger.error("Error getting child activities:", error);
    throw error;
  }
}

/**
 * Creates a new activity as a child of the specified parent activity
 * @param activity The activity to create
 * @param parentNodeId The ID of the parent activity
 * @returns The ID of the created activity
 */
export async function createChildNode(
  activity: NodeCreate,
  parentNodeId: string,
): Promise<string> {
  // Create a new activity with the parent ID
  return await createNode({
    ...activity,
    parentNodeId,
  });
}

/**
 * Recursively fetches activities and their children up to a maximum depth of 3
 * @param filter - The filter to apply to the activities (all, recent, temp)
 * @returns Array of activities with depth information
 */
/**
 * Formats an activity name with its hierarchy path
 * @param activity - The activity to format
 * @param activities - All activities in the tree
 * @returns Formatted activity name with hierarchy (e.g. "parent > child > grandchild")
 */
export async function formatNodeWithHierarchy(
  activity: NodeTreeItem,
  activities: NodeTreeItem[],
): Promise<string> {
  // If it's a root activity (no parent), just return the name
  if (!activity.parentNodeId) {
    return activity.name;
  }

  // Build the hierarchy path
  const path: string[] = [activity.name];
  let currentId = activity.parentNodeId;
  let isDirectParentRoot = false;

  // Traverse up the hierarchy to build the path
  while (currentId) {
    // First try to find the parent in the provided activities array
    let parent = activities.find((a) => a.activityId === currentId);

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
          `Parent not found for ID: ${currentId}, activity: ${activity.name}`,
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

export async function activityTree(
  filter: NodeTreeFilter = NodeTreeFilter.ALL,
): Promise<NodeTreeItem[]> {
  try {
    const client = await getConnection();

    // Build the filter condition for the base case
    let filterCondition = "";
    if (filter === NodeTreeFilter.RECENT) {
      // Activities from the last 7 days
      filterCondition =
        "AND lastaccessed > (CURRENT_TIMESTAMP - INTERVAL '7 days')";
    } else if (filter === NodeTreeFilter.TEMP) {
      // Only temporary activities
      filterCondition = "AND temp = true";
    }

    // This recursive CTE query:
    // 1. Starts with root activities (parent_id IS NULL) that match the filter
    // 2. Recursively joins to find children up to depth 3
    // 3. Orders results so parents come before children
    const result = await client.query(`
      WITH RECURSIVE activity_tree AS (
        -- Base case: select root activities (no parent) with filter applied
        SELECT 
          activityid, 
          orgid, 
          orgtext, 
          name, 
          created, 
          lastaccessed, 
          active, 
          parent_id,
          temp,
          0 AS depth,
          ARRAY[activityid] AS path
        FROM activities
        WHERE parent_id IS NULL ${filterCondition}
        
        UNION ALL
        
        -- Recursive case: select children and increment depth
        SELECT 
          a.activityid, 
          a.orgid, 
          a.orgtext, 
          a.name, 
          a.created, 
          a.lastaccessed, 
          a.active, 
          a.parent_id,
          a.temp,
          at.depth + 1 AS depth,
          at.path || a.activityid AS path
        FROM activities a
        JOIN activity_tree at ON a.parent_id = at.activityid
        WHERE at.depth < 3  -- Limit recursion to depth 3
        ${filter === NodeTreeFilter.TEMP ? "AND a.temp = true" : ""}
      )
      
      SELECT 
        activityid, 
        orgid, 
        orgtext, 
        name, 
        created, 
        lastaccessed, 
        active, 
        parent_id,
        temp,
        depth
      FROM activity_tree
      ORDER BY 
        CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,  -- Root activities first
        CASE WHEN parent_id IS NULL THEN lastaccessed END DESC,  -- Sort roots by lastaccessed
        path;  -- Then ensure parents come before children
    `);

    if (result.rows.length === 0) {
      return [];
    }

    const mappedResults = result.rows.map((row: any) => ({
      activityId: row.activityid,
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
    logger.error("Error getting activity tree:", error);
    throw error;
  }
}
