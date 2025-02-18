import { getConnection } from "../db.mts";

export interface WorkspaceDTO {
  id: number;
  activityId: string;
  name: string;
  activityName?: string;
}

export async function getAllWorkspaces(): Promise<WorkspaceDTO[]> {
  const conn = await getConnection();
  const result = await conn.run(
    `
    SELECT 
      w.id, 
      w.activityId, 
      w.name,
      a.name as activityName
    FROM workspaces w
    LEFT JOIN activities a ON w.activityId = a.activityId
    ORDER BY w.id ASC;
    `,
  );

  const rows = await result.fetchAllChunks();
  if (!rows || rows.length === 0) {
    return [];
  }

  return rows[0].getRows().map((row: any) => ({
    id: row[0],
    activityId: row[1],
    name: row[2],
    activityName: row[3],
  }));
}

export async function createWorkspaceForActivity(
  activityId: string,
): Promise<WorkspaceDTO> {
  const conn = await getConnection();
  try {
    // Get the next sequence value and create a workspace
    const result = await conn.run(
      `
      INSERT INTO workspaces (activityId, name)
      VALUES (?, ? || '_' || nextval('workspace_id_seq'))
      RETURNING id, activityId, name;
    `,
      [activityId, "test1"],
    );

    const rows = await result.fetchAllChunks();
    if (rows && rows.length > 0) {
      const row = rows[0].getRows()[0];
      return {
        id: row[0],
        activityId: row[1],
        name: row[2],
      };
    }
    throw new Error("Failed to create workspace");
  } catch (error: any) {
    if (error.message?.includes("workspace_id_seq")) {
      throw new Error("Maximum number of workspaces (32) reached");
    }
    throw error;
  }
}

export async function updateWorkspace(workspace: Partial<WorkspaceDTO>): Promise<void> {
  try {
    const fields: string[] = [];
    const values: any[] = [];

    const { id, activityId, name } = workspace;

    const fieldMappings: [string, any][] = [
      ["activityId = ?", activityId],
      ["name = ?", name]
    ];

    fieldMappings.forEach(([field, value]) => {
      if (value !== undefined) {
        fields.push(field);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    const query = `UPDATE workspaces SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    const conn = await getConnection();
    await conn.run(query, values);
  } catch (error) {
    console.error('Error updating workspace:', error);
    throw error;
  }
}

export async function assignWorkspaceToActivity(workspaceId: number, activityId: string): Promise<void> {
  try {
    const query = `UPDATE workspaces SET activityId = ? WHERE id = ?`;
    const conn = await getConnection();
    await conn.run(query, [activityId, workspaceId]);
  } catch (error) {
    console.error('Error assigning workspace to activity:', error);
    throw error;
  }
}

export async function getWorkspacesForActivity(activityId: string): Promise<WorkspaceDTO[]> {
  const conn = await getConnection();
  const result = await conn.run(
    `
    SELECT 
      w.id, 
      w.activityId, 
      w.name,
      a.name as activityName
    FROM workspaces w
    LEFT JOIN activities a ON w.activityId = a.activityId
    WHERE w.activityId = ?
    ORDER BY w.id ASC;
    `,
    [activityId],
  );

  const rows = await result.fetchAllChunks();
  if (!rows || rows.length === 0) {
    return [];
  }

  return rows[0].getRows().map((row: any) => ({
    id: row[0],
    activityId: row[1],
    name: row[2],
    activityName: row[3],
  }));
}
