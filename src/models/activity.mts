import { Activity } from "../types.mts";
import { getConnection } from "../db.mts";
// Hack
import { fs } from "zx";
import { parse, stringify } from "yaml";

type ActivityHistoryDoc = {
  currentActivityId: string;
  previousActivityId: string;
};

export async function createActivity(activity: Activity): Promise<void> {
  const client = await getConnection();
  const { activityId, orgId, orgText, name, created, lastAccessed, active } =
    activity;

  try {
    await client.query(
      `
              INSERT INTO activities (
                  activityId, orgId, orgText, name, created, lastAccessed,
                  active, parent_id
              ) VALUES 
              ($1, $2, $3, $4, $5, $6, $7, $8);
          `,
      [
        activityId,
        orgId ?? "",
        orgText ?? "",
        name,
        created.toISOString(),
        lastAccessed.toISOString(),
        active,
        activity.parentActivityId || null,
      ],
    );
  } catch (error) {
    console.error("Error creating activity:", error);
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
  activity: Activity,
  parentActivityId: string,
): Promise<void> {
  // Set the parentActivityId on the activity object
  activity.parentActivityId = parentActivityId;

  // Use the updated createActivity function which now handles parent_id
  await createActivity(activity);
}
