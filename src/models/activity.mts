import { Activity } from "../types.mts";
import { getConnection } from "../db.mts";
import { nanoid } from "nanoid";
// Hack
import { fs } from "zx";
import { parse, stringify } from "yaml";
import { getCurrentContext } from "./context.mts";

export type ActivityTreeItem = Activity & {
  depth?: number;
  selected: boolean;
};

type ActivityHistoryDoc = {
  currentActivityId: string;
  previousActivityId: string;
};

// Define ActivityCreate type as a partial of Activity with required fields
export type ActivityCreate = {
  name: string;
  orgId?: string;
  orgText?: string;
  created?: Date;
  lastAccessed?: Date;
  active?: boolean;
  parentActivityId?: string;
};

export async function createActivity(activity: ActivityCreate): Promise<void> {
  const client = await getConnection();
  const { orgId, orgText, name, parentActivityId } = activity;

  // Use provided values or defaults
  const active = activity.active ?? true;

  try {
    await client.query(
      `
              INSERT INTO activities (
                  activityId, orgId, orgText, name, created, lastAccessed,
                  active, parent_id
              ) VALUES 
              ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $5, $6);
          `,
      [
        nanoid(),
        orgId ?? "",
        orgText ?? "",
        name,
        active,
        parentActivityId || null,
      ],
    );
  } catch (error) {
    console.error("Error creating activity:", error);
    throw error;
  }
}

/**
 * Fetches the activity tree for the last created context
 * Sets the selected field based on whether the activity is in the context
 * @returns Array of activities with depth and selection information
 */
export async function contextActivityTree(): Promise<ActivityTreeItem[]> {
  try {
    // Get all activities in the tree
    const allActivities = await activityTree();

    // Get the current context
    const currentContext = await getCurrentContext();

    if (!currentContext) {
      // If no context exists, return all activities as unselected
      return allActivities.map((activity) => ({
        ...activity,
        selected: false,
      }));
    }

    // Get the set of activity IDs in the context for faster lookup
    const contextActivityIds = new Set(currentContext.activityIds);

    // Map the activities, setting selected based on whether they're in the context
    return allActivities.map((activity) => ({
      ...activity,
      selected: contextActivityIds.has(activity.activityId),
    }));
  } catch (error) {
    console.error("Error getting context activity tree:", error);
    throw error;
  }
}

export async function getActivityById(
  activityId: string,
): Promise<Activity | null> {
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
      parentActivityId: row.parent_id,
    };
  } catch (error) {
    console.error("Error getting activity:", error);
    throw error;
  }
}

export async function getAllActivities(): Promise<Activity[]> {
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
      parentActivityId: row.parent_id,
    }));
  } catch (error) {
    console.error("Error getting all activities:", error);
    throw error;
  }
}

export async function updateActivity(
  activity: Partial<Activity>,
): Promise<void> {
  try {
    const client = await getConnection();
    const fields: string[] = [];
    const values: any[] = [];

    const { orgId, orgText, name, lastAccessed, active, activityId } = activity;

    const fieldMappings: [string, any][] = [
      ["orgId", orgId],
      ["orgText", orgText],
      ["name", name],
      ["lastAccessed", lastAccessed?.toISOString()],
      ["active", active],
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
    )} WHERE activityId = $${paramIndex};`;

    await client.query(query, values);
  } catch (error) {
    console.error("Error updating activity:", error);
    throw error;
  }
}

export async function deleteActivity(
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
        await deleteActivity(child.activityId, true);
      }
    }

    // Now delete the activity itself
    await client.query("DELETE FROM activities WHERE activityId = $1;", [
      activityId,
    ]);
  } catch (error) {
    console.error("Error deleting activity:", error);
    throw error;
  }
}

export async function getActiveActivities(): Promise<Activity[]> {
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
      parentActivityId: row.parent_id,
    }));
  } catch (error) {
    console.error("Error getting active activities:", error);
    throw error;
  }
}

// TOFIX hack
export async function updateActivityHistory(
  currentActivityId: string,
  previousActivityId: string,
): Promise<void> {
  try {
    const state: ActivityHistoryDoc = {
      currentActivityId,
      previousActivityId,
    };
    const stringified = stringify(state);
    fs.writeFileSync("./data/state-mini.yml", stringified);
  } catch (error) {
    console.error("Error updating activity state:", error);
    throw error;
  }
}

export async function getCurrentActivity(): Promise<Activity | null> {
  try {
    const file = fs.readFileSync("./data/state-mini.yml", "utf8");
    const parsed = parse(file) as ActivityHistoryDoc;
    const currentActivityId = parsed["currentActivityId"] as string;
    return getActivityById(currentActivityId);
  } catch (error) {
    console.error("Error retrieving current activity:", error);
    throw error;
  }
}

export async function getPreviousActivity(): Promise<Activity | null> {
  try {
    const file = fs.readFileSync("./data/state-mini.yml", "utf8");
    const parsed = parse(file) as ActivityHistoryDoc;
    const previousActivityId = parsed["previousActivityId"] as string;
    return getActivityById(previousActivityId);
  } catch (error) {
    console.error("Error retrieving previous activity:", error);
    throw error;
  }
}

/**
 * Gets all child activities for a given parent activity
 * @param parentActivityId The ID of the parent activity
 * @returns Array of child activities
 */
export async function getChildActivities(
  parentActivityId: string,
): Promise<Activity[]> {
  try {
    const client = await getConnection();
    const result = await client.query(
      "SELECT * FROM activities WHERE parent_id = $1;",
      [parentActivityId],
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
  } catch (error) {
    console.error("Error getting child activities:", error);
    throw error;
  }
}

/**
 * Creates a new activity as a child of the specified parent activity
 * @param activity The activity to create
 * @param parentActivityId The ID of the parent activity
 */
export async function createChildActivity(
  activity: ActivityCreate,
  parentActivityId: string,
): Promise<void> {
  // Create a new activity with the parent ID
  await createActivity({
    ...activity,
    parentActivityId,
  });
}

/**
 * Recursively fetches activities and their children up to a maximum depth of 3
 * @returns Array of activities with depth information
 */
export async function activityTree(): Promise<ActivityTreeItem[]> {
  try {
    const client = await getConnection();

    // This recursive CTE query:
    // 1. Starts with root activities (parent_id IS NULL)
    // 2. Recursively joins to find children up to depth 3
    // 3. Orders results so parents come before children
    const result = await client.query(`
      WITH RECURSIVE activity_tree AS (
        -- Base case: select root activities (no parent)
        SELECT 
          activityid, 
          orgid, 
          orgtext, 
          name, 
          created, 
          lastaccessed, 
          active, 
          parent_id,
          0 AS depth,
          ARRAY[activityid] AS path
        FROM activities
        WHERE parent_id IS NULL
        
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
          at.depth + 1 AS depth,
          at.path || a.activityid AS path
        FROM activities a
        JOIN activity_tree at ON a.parent_id = at.activityid
        WHERE at.depth < 3  -- Limit recursion to depth 3
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

    return result.rows.map((row: any) => ({
      activityId: row.activityid,
      orgId: row.orgid,
      orgText: row.orgtext,
      name: row.name,
      created: new Date(row.created),
      lastAccessed: new Date(row.lastaccessed),
      active: row.active,
      parentActivityId: row.parent_id,
      depth: row.depth,
      selected: false,
    }));
  } catch (error) {
    console.error("Error getting activity tree:", error);
    throw error;
  }
}
