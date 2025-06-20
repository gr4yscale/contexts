import { getConnection } from "../db.mts";
import * as logger from "../logger.mts";
import { Node } from "./node.mts";

/** Unique identifier for a Resource */
export type ResourceId = number;

/**
 * Enum for different types of Resources.
 */
export enum ResourceType {
  LINK = "link",
  WORKSPACE = "workspace",
  ORG_DOC = "orgDoc",
  TEXT = "text",
  LLM_CONVO = "llmConvo",
  SCREENSHOT = "screenshot",
  REPO = "repo",
  PDF = "pdf",
  VIDEO = "video",
}

// Resource data interfaces for each type
export interface LinkResourceData {
  url: string;
}

export interface WorkspaceResourceData {
  workspaceId: string;
  name: string;
}

export interface OrgDocResourceData {
  orgHeadlineId: string;
}

export interface TextResourceData {
  path: string;
}

export interface LlmConvoResourceData {
  path: string;
}

export interface ScreenshotResourceData {
  path: string;
}

export interface RepoResourceData {
  path: string;
}

export interface PdfResourceData {
  path: string;
}

export interface VideoResourceData {
  localPath: string;
  url: string;
}

export type ResourceData =
  | LinkResourceData
  | WorkspaceResourceData
  | OrgDocResourceData
  | TextResourceData
  | LlmConvoResourceData
  | ScreenshotResourceData
  | RepoResourceData
  | PdfResourceData
  | VideoResourceData;

/**
 * A Resource represents an entity that can be acted upon.
 * Examples include web links, documents, contacts, etc.
 */
export interface Resource {
  id: ResourceId;
  name: string;
  data: ResourceData; // JSON data specific to the resource type
  type: ResourceType;
  created: Date;
  lastAccessed: Date;
}

/**
 * Data required to create a new Resource.
 * 'name', 'data', and 'type' are mandatory.
 */
export type ResourceCreate = {
  name: string;
  data: ResourceData;
  type: ResourceType;
};

/**
 * Creates a new resource in the database.
 * @param resourceData - The data for the new resource.
 * @returns The ID of the newly created resource.
 */
export async function createResource(
  resourceData: ResourceCreate,
): Promise<ResourceId> {
  const client = await getConnection();
  const { name, data, type } = resourceData;

  try {
    const result = await client.query(
      `
      INSERT INTO resources (name, data, type, created, last_accessed)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id;
      `,
      [name, data, type],
    );
    logger.debug(`Resource created with ID: ${result.rows[0].id}`);
    return result.rows[0].id as ResourceId;
  } catch (error) {
    logger.error("Error creating resource:", error);
    throw error;
  }
}

/**
 * Retrieves a resource by its ID.
 * @param id - The ID of the resource to retrieve.
 * @returns The resource object if found, otherwise null.
 */
export async function getResourceById(
  id: ResourceId,
): Promise<Resource | null> {
  const client = await getConnection();
  try {
    const result = await client.query(
      "SELECT * FROM resources WHERE id = $1;",
      [id],
    );
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      id: row.id as ResourceId,
      name: row.name,
      data: row.data,
      type: row.type as ResourceType,
      created: new Date(row.created),
      lastAccessed: new Date(row.last_accessed),
    };
  } catch (error) {
    logger.error(`Error getting resource by ID ${id}:`, error);
    throw error;
  }
}

/**
 * Retrieves all resources from the database, ordered by name.
 * @returns An array of all resource objects.
 */
export async function getAllResources(): Promise<Resource[]> {
  const client = await getConnection();
  try {
    const result = await client.query("SELECT * FROM resources ORDER BY name;");
    return result.rows.map((row: any) => ({
      id: row.id as ResourceId,
      name: row.name,
      data: row.data,
      type: row.type as ResourceType,
      created: new Date(row.created),
      lastAccessed: new Date(row.last_accessed),
    }));
  } catch (error) {
    logger.error("Error getting all resources:", error);
    throw error;
  }
}

/**
 * Updates an existing resource.
 * @param id - The ID of the resource to update.
 * @param resourceUpdate - An object containing the fields to update.
 * @returns The updated resource object if found and updated, otherwise null.
 */
export async function updateResource(
  id: ResourceId,
  resourceUpdate: Partial<Omit<Resource, "id" | "created">>,
): Promise<Resource | null> {
  const client = await getConnection();
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const updatableFields: (keyof typeof resourceUpdate)[] = [
    "name",
    "data",
    "type",
    "lastAccessed",
  ];

  updatableFields.forEach((key) => {
    if (resourceUpdate[key] !== undefined) {
      let dbKey = key;
      if (key === "lastAccessed") {
        dbKey = "last_accessed";
      }

      let value = resourceUpdate[key];

      if (key === "lastAccessed" && value instanceof Date) {
        value = value.toISOString();
      }

      fields.push(`${dbKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) {
    logger.debug(`No fields to update for resource ID ${id}.`);
    return getResourceById(id); // Return current state if no updates
  }

  values.push(id); // For the WHERE id = $N clause

  const query = `
    UPDATE resources
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING *;
  `;

  try {
    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    logger.debug(`Resource updated with ID: ${row.id}`);
    return {
      id: row.id as ResourceId,
      name: row.name,
      data: row.data,
      type: row.type as ResourceType,
      created: new Date(row.created),
      lastAccessed: new Date(row.last_accessed),
    };
  } catch (error) {
    logger.error(`Error updating resource with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Deletes a resource by its ID.
 * @param id - The ID of the resource to delete.
 * @returns True if the resource was deleted, false otherwise.
 */
export async function deleteResource(id: ResourceId): Promise<boolean> {
  const client = await getConnection();
  try {
    // TODO: Consider implications for related entities, e.g., node_resources links.
    // For now, it just deletes the resource itself.
    const result = await client.query("DELETE FROM resources WHERE id = $1;", [
      id,
    ]);
    logger.debug(`Resource deleted with ID: ${id}, count: ${result.rowCount}`);
    return result.rowCount > 0;
  } catch (error) {
    logger.error(`Error deleting resource with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Retrieves all resources of a specific type, ordered by name.
 * @param type - The type of resources to retrieve.
 * @returns An array of resource objects of the specified type.
 */
export async function getResourcesByType(
  type: ResourceType,
): Promise<Resource[]> {
  const client = await getConnection();
  try {
    const result = await client.query(
      "SELECT * FROM resources WHERE type = $1 ORDER BY name;",
      [type],
    );
    return result.rows.map((row: any) => ({
      id: row.id as ResourceId,
      name: row.name,
      data: row.data,
      type: row.type as ResourceType,
      created: new Date(row.created),
      lastAccessed: new Date(row.last_accessed),
    }));
  } catch (error) {
    logger.error(`Error getting resources by type ${type}:`, error);
    throw error;
  }
}

/**
 * Associates a node with a resource
 * @param resourceId The ID of the resource
 * @param nodeId The ID of the node
 */
export async function addResourceNode(
  resourceId: ResourceId,
  nodeId: string,
): Promise<void> {
  const client = await getConnection();
  try {
    await client.query(
      `INSERT INTO resource_nodes (resource_id, node_id)
       VALUES ($1, $2)
       ON CONFLICT (resource_id, node_id) DO NOTHING`,
      [resourceId, nodeId],
    );
    logger.debug(`Added node ${nodeId} to resource ${resourceId}`);
  } catch (error) {
    logger.error(
      `Error adding node ${nodeId} to resource ${resourceId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Removes the association between a resource and a node
 * @param resourceId The ID of the resource
 * @param nodeId The ID of the node
 */
export async function removeResourceNode(
  resourceId: ResourceId,
  nodeId: string,
): Promise<void> {
  const client = await getConnection();
  try {
    await client.query(
      `DELETE FROM resource_nodes 
       WHERE resource_id = $1 AND node_id = $2`,
      [resourceId, nodeId],
    );
    logger.debug(`Removed node ${nodeId} from resource ${resourceId}`);
  } catch (error) {
    logger.error(
      `Error removing node ${nodeId} from resource ${resourceId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Gets all nodes associated with a resource
 * @param resourceId The ID of the resource
 * @returns Array of nodes associated with the resource
 */
export async function getResourceNodes(
  resourceId: ResourceId,
): Promise<Node[]> {
  const client = await getConnection();
  try {
    const result = await client.query(
      `SELECT n.* FROM nodes n
       JOIN resource_nodes rn ON n.nodeid = rn.node_id
       WHERE rn.resource_id = $1`,
      [resourceId],
    );

    return result.rows.map((row: any) => ({
      nodeId: row.nodeid,
      name: row.name,
      parentIds: row.parent_ids ? JSON.parse(row.parent_ids) : [],
      childIds: row.child_ids ? JSON.parse(row.child_ids) : [],
      temp: row.temp || false,
      created: new Date(row.created),
      lastAccessed: new Date(row.last_accessed),
    }));
  } catch (error) {
    logger.error(`Error getting nodes for resource ${resourceId}:`, error);
    throw error;
  }
}

/**
 * Gets all resources associated with a node
 * @param nodeId The ID of the node
 * @returns Array of resources associated with the node
 */
export async function getNodeResources(nodeId: string): Promise<Resource[]> {
  const client = await getConnection();
  try {
    const result = await client.query(
      `SELECT r.* FROM resources r
       JOIN resource_nodes rn ON r.id = rn.resource_id
       WHERE rn.node_id = $1
       ORDER BY r.name`,
      [nodeId],
    );

    return result.rows.map((row: any) => ({
      id: row.id as ResourceId,
      name: row.name,
      data: row.data,
      type: row.type as ResourceType,
      created: new Date(row.created),
      lastAccessed: new Date(row.last_accessed),
    }));
  } catch (error) {
    logger.error(`Error getting resources for node ${nodeId}:`, error);
    throw error;
  }
}
