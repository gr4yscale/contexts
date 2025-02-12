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
