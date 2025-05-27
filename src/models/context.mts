import { nanoid } from "nanoid";
import { Node, Context } from "../types.mts";
import { getConnection } from "../db.mts";
import { getNodeById } from "./activity.mts";

/**
 * Creates a new context
 * @param context The context to create
 * @returns The created context
 */
export async function createContext(
  context: Omit<Context, "contextId" | "created">,
): Promise<Context> {
  try {
    const client = await getConnection();
    const contextId = nanoid();
    const created = new Date();

    // Insert the context
    await client.query(
      `INSERT INTO contexts (context_id, name, created) 
       VALUES ($1, $2, $3);`,
      [contextId, context.name, created.toISOString()],
    );

    // If activityIds are provided, add them to the junction table
    if (context.activityIds && context.activityIds.length > 0) {
      for (const activityId of context.activityIds) {
        await client.query(
          `INSERT INTO context_activities (context_id, activity_id)
           VALUES ($1, $2);`,
          [contextId, activityId],
        );
      }
    }

    return {
      contextId,
      name: context.name,
      created,
      activityIds: context.activityIds || [],
    };
  } catch (error) {
    console.error("Error creating context:", error);
    throw error;
  }
}

/**
 * Gets a context by its ID
 * @param contextId The ID of the context to get
 * @returns The context or null if not found
 */
export async function getContextById(
  contextId: string,
): Promise<Context | null> {
  try {
    const client = await getConnection();

    // Get the context
    const contextResult = await client.query(
      `SELECT * FROM contexts WHERE context_id = $1;`,
      [contextId],
    );

    if (contextResult.rows.length === 0) {
      return null;
    }

    const context = contextResult.rows[0];

    // Get the associated activities
    const activitiesResult = await client.query(
      `SELECT activity_id FROM context_activities WHERE context_id = $1;`,
      [contextId],
    );

    const activityIds = activitiesResult.rows.map((row) => row.activity_id);

    return {
      contextId: context.context_id,
      name: context.name,
      created: new Date(context.created),
      activityIds,
    };
  } catch (error) {
    console.error("Error getting context:", error);
    throw error;
  }
}

/**
 * Gets all contexts
 * @returns Array of all contexts
 */
export async function getAllContexts(): Promise<Context[]> {
  try {
    const client = await getConnection();

    // Get all contexts
    const contextsResult = await client.query(`SELECT * FROM contexts;`);

    if (contextsResult.rows.length === 0) {
      return [];
    }

    // For each context, get its activities
    const contexts: Context[] = [];

    for (const contextRow of contextsResult.rows) {
      const activitiesResult = await client.query(
        `SELECT activity_id FROM context_activities WHERE context_id = $1;`,
        [contextRow.context_id],
      );

      const activityIds = activitiesResult.rows.map((row) => row.activity_id);

      contexts.push({
        contextId: contextRow.context_id,
        name: contextRow.name,
        created: new Date(contextRow.created),
        activityIds,
      });
    }

    return contexts;
  } catch (error) {
    console.error("Error getting all contexts:", error);
    throw error;
  }
}

/**
 * Updates a context
 * @param context The context data to update
 */
export async function updateContext(
  context: Partial<Context> & { contextId: string },
): Promise<void> {
  try {
    const client = await getConnection();
    const { contextId, name, activityIds } = context;

    // Update the context name if provided
    if (name !== undefined) {
      await client.query(
        `UPDATE contexts SET name = $1 WHERE context_id = $2;`,
        [name, contextId],
      );
    }

    // Update activities if provided
    if (activityIds !== undefined) {
      // First, remove all existing associations
      await client.query(
        `DELETE FROM context_activities WHERE context_id = $1;`,
        [contextId],
      );

      // Then add the new ones
      for (const activityId of activityIds) {
        await client.query(
          `INSERT INTO context_activities (context_id, activity_id)
           VALUES ($1, $2);`,
          [contextId, activityId],
        );
      }
    }
  } catch (error) {
    console.error("Error updating context:", error);
    throw error;
  }
}

/**
 * Deletes a context
 * @param contextId The ID of the context to delete
 */
export async function deleteContext(contextId: string): Promise<void> {
  try {
    const client = await getConnection();

    // The foreign key constraints with ON DELETE CASCADE will automatically
    // remove entries from the junction table
    await client.query(`DELETE FROM contexts WHERE context_id = $1;`, [
      contextId,
    ]);
  } catch (error) {
    console.error("Error deleting context:", error);
    throw error;
  }
}

/**
 * Adds an activity to the latest context created
 * @param activityId The ID of the activity to add
 */
export async function addNodeToLatestContext(
  activityId: string,
): Promise<void> {
  try {
    const client = await getConnection();

    // Check if the activity exists
    const activity = await getNodeById(activityId);
    if (!activity) {
      throw new Error(`Node with ID ${activityId} not found`);
    }

    // Find the latest context
    const latestContextResult = await client.query(
      `SELECT context_id FROM contexts ORDER BY created DESC LIMIT 1;`,
    );

    if (latestContextResult.rows.length === 0) {
      throw new Error("No contexts found");
    }

    const contextId = latestContextResult.rows[0].context_id;

    // Add the activity to the context (if not already added)
    await client.query(
      `INSERT INTO context_activities (context_id, activity_id)
       VALUES ($1, $2)
       ON CONFLICT (context_id, activity_id) DO NOTHING;`,
      [contextId, activityId],
    );
  } catch (error) {
    console.error("Error adding activity to latest context:", error);
    throw error;
  }
}

/**
 * Removes an activity from the latest context created
 * @param activityId The ID of the activity to remove
 */
export async function removeNodeFromLatestContext(
  activityId: string,
): Promise<void> {
  try {
    const client = await getConnection();

    // Find the latest context
    const latestContextResult = await client.query(
      `SELECT context_id FROM contexts ORDER BY created DESC LIMIT 1;`,
    );

    if (latestContextResult.rows.length === 0) {
      throw new Error("No contexts found");
    }

    const contextId = latestContextResult.rows[0].context_id;

    await client.query(
      `DELETE FROM context_activities 
       WHERE context_id = $1 AND activity_id = $2;`,
      [contextId, activityId],
    );
  } catch (error) {
    console.error("Error removing activity from latest context:", error);
    throw error;
  }
}

/**
 * Gets all activities for a context
 * @param contextId The ID of the context
 * @returns Array of Node objects
 */
// export async function getContextNodes(
//   contextId: string,
// ): Promise<Node[]> {
//   try {
//     const client = await getConnection();

//     const result = await client.query(
//       `SELECT a.activityid, a.name, a.created, a.lastaccessed, a.active, a.parent_id, a.orgid, a.orgtext
//        FROM activities a
//        JOIN context_activities ca ON a.activityid = ca.activity_id
//        WHERE ca.context_id = $1;`,
//       [contextId],
//     );

//     if (result.rows.length === 0) {
//       return [];
//     }

//     return result.rows.map((row) => ({
//       activityId: row.activityid,
//       orgId: row.orgid || "",
//       orgText: row.orgtext || "",
//       name: row.name,
//       created: new Date(row.created),
//       lastAccessed: new Date(row.lastaccessed),
//       active: row.active,
//       parentNodeId: row.parent_id,
//     }));
//   } catch (error) {
//     console.error("Error getting context activities:", error);
//     throw error;
//   }
// }

/**
 * Gets the most recently created context
 * @returns The most recent context or null if none exists
 */
export async function getCurrentContext(): Promise<Context | null> {
  try {
    const client = await getConnection();

    // Get the most recent context
    const contextResult = await client.query(
      `SELECT * FROM contexts ORDER BY created DESC LIMIT 1;`,
    );

    if (contextResult.rows.length === 0) {
      return null;
    }

    const context = contextResult.rows[0];

    // Get the associated activities
    const activitiesResult = await client.query(
      `SELECT activity_id FROM context_activities WHERE context_id = $1;`,
      [context.context_id],
    );

    const activityIds = activitiesResult.rows.map((row) => row.activity_id);

    return {
      contextId: context.context_id,
      name: context.name,
      created: new Date(context.created),
      activityIds,
    };
  } catch (error) {
    console.error("Error getting current context:", error);
    throw error;
  }
}

/**
 * Gets all activities for the current (most recently created) context
 * @returns Array of Node objects or empty array if no current context exists
 */
// export async function getCurrentContextNodes(): Promise<Node[]> {
//   try {
//     const currentContext = await getCurrentContext();

//     if (!currentContext) {
//       return [];
//     }

//     return await getContextNodes(currentContext.contextId);
//   } catch (error) {
//     console.error("Error getting current context activities:", error);
//     throw error;
//   }
// }
