import { getConnection } from "../db.mts";

export interface WorkspaceDTO {
  id: number;
  activityId: string;
  name: string;
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
  } catch (error) {
    if (error.message?.includes("workspace_id_seq")) {
      throw new Error("Maximum number of workspaces (32) reached");
    }
    throw error;
  }
}
