import { getConnection } from "../db.mts";

export interface WorkspaceDTO {
  id: number;
  activityId: string;
  name: string;
  activityName?: string;
}

export async function getAllWorkspaces(): Promise<WorkspaceDTO[]> {
  const client = await getConnection();
  const result = await client.query(`
    SELECT 
      w.id, 
      w.activityId, 
      w.name,
      a.name as activityName
    FROM workspaces w
    LEFT JOIN activities a ON w.activityId = a.activityId
    ORDER BY w.id ASC;
  `);

  if (!result.rows || result.rows.length === 0) {
    return [];
  }

  return result.rows.map((row) => ({
    id: row.id,
    activityId: row.activityid,
    name: row.name,
    activityName: row.activityname,
  }));
}

/**
 * Creates a new workspace for the given activity with a unique ID.
 * Tries to find any available ID in the range 1-32 that isn't currently used.
 * If all IDs are in use, it will throw an error.
 *
 * @param activityId - The ID of the activity to create a workspace for
 * @returns Promise<WorkspaceDTO> - The newly created workspace
 * @throws {Error} When all workspace IDs are in use or when insertion fails
 */
export async function createWorkspaceForNode(
  activityId: string,
  name: string,
): Promise<WorkspaceDTO> {
  const client = await getConnection();
  try {
    // First check if all IDs are in use
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM workspaces`
    );
    
    if (countResult.rows[0].count >= 29) {
      throw new Error("Maximum number of workspaces (29) reached. Delete some workspaces before creating new ones.");
    }
    
    // This query:
    // 1. Generates a series of numbers from 1 to 29 (all possible workspace IDs)
    // 2. Finds which IDs are not currently in use
    // 3. Inserts the new workspace with the first available ID
    const result = await client.query(
      `
      WITH available_ids AS (
        SELECT generate_series(1, 29) AS id
        EXCEPT
        SELECT id FROM workspaces
        ORDER BY id
        LIMIT 1
      )
      INSERT INTO workspaces (id, activityId, name)
      SELECT 
        id,
        $1,
        $2
      FROM available_ids
      RETURNING id, activityId, name;
    `,
      [activityId, name],
    );

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id,
        activityId: row.activityid,
        name: row.name,
      };
    }
    throw new Error("Failed to create workspace");
  } catch (error) {
    console.error("Error creating workspace:", error);
    throw error;
  }
}

export async function updateWorkspace(
  workspace: Partial<WorkspaceDTO>,
): Promise<void> {
  try {
    const fields: string[] = [];
    const values: any[] = [];

    const { id, activityId, name } = workspace;

    const fieldMappings: [string, any][] = [
      ["activityId", activityId],
      ["name", name],
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

    const query = `UPDATE workspaces SET ${fields.join(
      ", ",
    )} WHERE id = $${paramIndex}`;
    values.push(id);

    const client = await getConnection();
    await client.query(query, values);
  } catch (error) {
    console.error("Error updating workspace:", error);
    throw error;
  }
}

export async function assignWorkspaceToNode(
  workspaceId: number,
  activityId: string,
): Promise<void> {
  try {
    const query = `UPDATE workspaces SET activityId = $1 WHERE id = $2`;
    const client = await getConnection();
    await client.query(query, [activityId, workspaceId]);
  } catch (error) {
    console.error("Error assigning workspace to activity:", error);
    throw error;
  }
}

export async function getWorkspacesForNode(
  activityId: string,
): Promise<WorkspaceDTO[]> {
  const client = await getConnection();
  const result = await client.query(
    `
    SELECT 
      w.id, 
      w.activityId, 
      w.name,
      a.name as activityName
    FROM workspaces w
    LEFT JOIN activities a ON w.activityId = a.activityId
    WHERE w.activityId = $1
    ORDER BY w.id ASC;
  `,
    [activityId],
  );

  if (!result.rows || result.rows.length === 0) {
    return [];
  }

  return result.rows.map((row) => ({
    id: row.id,
    activityId: row.activityid,
    name: row.name,
    activityName: row.activityname,
  }));
}

export async function getWorkspaceById(id: number): Promise<WorkspaceDTO> {
  const client = await getConnection();
  const result = await client.query(
    `
    SELECT 
      w.id, 
      w.activityId, 
      w.name,
      a.name as activityName
    FROM workspaces w
    LEFT JOIN activities a ON w.activityId = a.activityId
    WHERE w.id = $1
  `,
    [id],
  );

  if (!result.rows || result.rows.length === 0) {
    throw new Error(`Workspace with id ${id} not found`);
  }

  const row = result.rows[0];
  return {
    id: row.id,
    activityId: row.activityid,
    name: row.name,
    activityName: row.activityname,
  };
}

export async function deleteWorkspaceById(id: number): Promise<void> {
  try {
    const client = await getConnection();
    await client.query("DELETE FROM workspaces WHERE id = $1", [id]);
  } catch (error) {
    console.error("Error deleting workspace:", error);
    throw error;
  }
}
