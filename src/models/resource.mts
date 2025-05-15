import { getConnection } from "../db.mts";
import { Resource, ResourceId, ResourceType } from "../types.mts";
import * as logger from "../logger.mts";

/**
 * Data required to create a new Resource.
 * 'name', 'url', and 'type' are mandatory.
 */
export type ResourceCreate = {
  name: string;
  url: string;
  type: ResourceType;
  description?: string;
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
  const { name, url, type, description } = resourceData;

  try {
    const result = await client.query(
      `
      INSERT INTO resources (name, url, type, description, created, last_accessed)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id;
      `,
      [name, url, type, description ?? null],
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
    const result = await client.query("SELECT * FROM resources WHERE id = $1;", [
      id,
    ]);
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      id: row.id as ResourceId,
      name: row.name,
      url: row.url,
      type: row.type as ResourceType,
      description: row.description,
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
      url: row.url,
      type: row.type as ResourceType,
      description: row.description,
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
    "url",
    "type",
    "description",
    "lastAccessed",
  ];

  updatableFields.forEach((key) => {
    if (resourceUpdate[key] !== undefined) {
      const dbKey = key === "lastAccessed" ? "last_accessed" : key;
      const value =
        key === "lastAccessed" && resourceUpdate[key] instanceof Date
          ? (resourceUpdate[key] as Date).toISOString()
          : resourceUpdate[key];
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
      url: row.url,
      type: row.type as ResourceType,
      description: row.description,
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
    // TODO: Consider implications for related entities, e.g., activity_resources links.
    // For now, it just deletes the resource itself.
    const result = await client.query(
      "DELETE FROM resources WHERE id = $1;",
      [id],
    );
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
      url: row.url,
      type: row.type as ResourceType,
      description: row.description,
      created: new Date(row.created),
      lastAccessed: new Date(row.last_accessed),
    }));
  } catch (error) {
    logger.error(`Error getting resources by type ${type}:`, error);
    throw error;
  }
}
