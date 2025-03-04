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
 * Uses a recursive SQL query to find the first available ID from the workspace_id_seq
 * sequence that doesn't conflict with existing workspace IDs. Will attempt up to 32
 * different sequence values before failing.
 *
 * @param activityId - The ID of the activity to create a workspace for
 * @returns Promise<WorkspaceDTO> - The newly created workspace
 * @throws {Error} When no available IDs are found or when maximum workspaces (32) is reached
 */
export async function createWorkspaceForActivity(
  activityId: string,
  name: string,
): Promise<WorkspaceDTO> {
  const client = await getConnection();
  try {
    const result = await client.query(
      `
      WITH RECURSIVE workspace_insert AS (
        SELECT 
          nextval('workspace_id_seq') as next_id,
          1 as attempt
        UNION ALL
        SELECT 
          nextval('workspace_id_seq'),
          attempt + 1
        FROM workspace_insert
        WHERE attempt < 32
        AND EXISTS (
          SELECT 1 FROM workspaces w 
          WHERE w.id = workspace_insert.next_id
        )
      )
      INSERT INTO workspaces (id, activityId, name)
      SELECT 
        next_id,
        $1,
        $2
      FROM (
        SELECT next_id
        FROM workspace_insert
        WHERE NOT EXISTS (
          SELECT 1 FROM workspaces w 
          WHERE w.id = workspace_insert.next_id
        )
        LIMIT 1
      ) available_id
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
    throw new Error("Failed to create workspace - no available IDs found");
  } catch (error: any) {
    if (error.message?.includes("workspace_id_seq")) {
      throw new Error("Maximum number of workspaces reached");
    }
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

export async function assignWorkspaceToActivity(
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

export async function getWorkspacesForActivity(
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
