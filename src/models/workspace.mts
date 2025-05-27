import { getConnection } from "../db.mts";

export interface WorkspaceDTO {
  id: number;
  nodeId: string;
  name: string;
  nodeName?: string;
}

export async function getAllWorkspaces(): Promise<WorkspaceDTO[]> {
  const client = await getConnection();
  const result = await client.query(`
    SELECT 
      w.id, 
      w.nodeId, 
      w.name,
      a.name as nodeName
    FROM workspaces w
    LEFT JOIN activities a ON w.nodeId = a.nodeId
    ORDER BY w.id ASC;
  `);

  if (!result.rows || result.rows.length === 0) {
    return [];
  }

  return result.rows.map((row) => ({
    id: row.id,
    nodeId: row.nodeid,
    name: row.name,
    nodeName: row.nodename,
  }));
}

/**
 * Creates a new workspace for the given node with a unique ID.
 * Tries to find any available ID in the range 1-32 that isn't currently used.
 * If all IDs are in use, it will throw an error.
 *
 * @param nodeId - The ID of the node to create a workspace for
 * @returns Promise<WorkspaceDTO> - The newly created workspace
 * @throws {Error} When all workspace IDs are in use or when insertion fails
 */
export async function createWorkspaceForNode(
  nodeId: string,
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
      INSERT INTO workspaces (id, nodeId, name)
      SELECT 
        id,
        $1,
        $2
      FROM available_ids
      RETURNING id, nodeId, name;
    `,
      [nodeId, name],
    );

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id,
        nodeId: row.nodeid,
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

    const { id, nodeId, name } = workspace;

    const fieldMappings: [string, any][] = [
      ["nodeId", nodeId],
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
  nodeId: string,
): Promise<void> {
  try {
    const query = `UPDATE workspaces SET nodeId = $1 WHERE id = $2`;
    const client = await getConnection();
    await client.query(query, [nodeId, workspaceId]);
  } catch (error) {
    console.error("Error assigning workspace to node:", error);
    throw error;
  }
}

export async function getWorkspacesForNode(
  nodeId: string,
): Promise<WorkspaceDTO[]> {
  const client = await getConnection();
  const result = await client.query(
    `
    SELECT 
      w.id, 
      w.nodeId, 
      w.name,
      a.name as nodeName
    FROM workspaces w
    LEFT JOIN activities a ON w.nodeId = a.nodeId
    WHERE w.nodeId = $1
    ORDER BY w.id ASC;
  `,
    [nodeId],
  );

  if (!result.rows || result.rows.length === 0) {
    return [];
  }

  return result.rows.map((row) => ({
    id: row.id,
    nodeId: row.nodeid,
    name: row.name,
    nodeName: row.nodename,
  }));
}

export async function getWorkspaceById(id: number): Promise<WorkspaceDTO> {
  const client = await getConnection();
  const result = await client.query(
    `
    SELECT 
      w.id, 
      w.nodeId, 
      w.name,
      a.name as nodeName
    FROM workspaces w
    LEFT JOIN activities a ON w.nodeId = a.nodeId
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
    nodeId: row.nodeid,
    name: row.name,
    nodeName: row.nodename,
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
