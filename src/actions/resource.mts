import { Action, ActionType, registerAction as baseRegisterAction, executeAction as baseExecuteAction } from "../actions.mts";
import { Resource, ResourceType, ResourceId } from "../types.mts";
import * as logger from "../logger.mts";
// Import model functions if actions need to fetch resource details, e.g.:
// import { getResourceById } from '../models/resource.mts';

/**
 * Interface for actions that operate specifically on a Resource.
 * Extends the base Action interface.
 */
export interface ResourceAction extends Action {
  type: ActionType.RESOURCE; // Ensures this action is correctly typed as a RESOURCE action
  resourceType: ResourceType | ResourceType[]; // Specifies which resource type(s) this action applies to
  isDefault?: boolean; // Indicates if this is a default action for the specified resource type(s)
  /**
   * Handler for the resource action.
   * It can receive either a full Resource object or just its ResourceId.
   * Action implementations should be prepared to handle either, potentially fetching
   * the full Resource object if only an ID is provided and the full object is needed.
   */
  handler: (resourceOrId: Resource | ResourceId, ...args: any[]) => Promise<void> | void;
}

// Registry to store action IDs applicable to each resource type
const resourceActionRegistry = new Map<ResourceType, string[]>();
// Registry to store the ID of the default action for each resource type
const defaultResourceAction = new Map<ResourceType, string>();

/**
 * Registers a resource-specific action.
 * This function registers the action with the global action system and
 * also with the resource-specific action registries.
 * @param action The ResourceAction to register.
 */
export function registerResourceAction(action: ResourceAction): void {
  baseRegisterAction(action); // Register with the global/base action registry

  const applicableTypes = Array.isArray(action.resourceType)
    ? action.resourceType
    : [action.resourceType];

  for (const rType of applicableTypes) {
    if (!resourceActionRegistry.has(rType)) {
      resourceActionRegistry.set(rType, []);
    }
    resourceActionRegistry.get(rType)!.push(action.id);

    if (action.isDefault) {
      if (defaultResourceAction.has(rType)) {
        logger.warn(
          `Default action for resource type ${rType} is being overridden by ${action.id}. Previous default was: ${defaultResourceAction.get(rType)}`,
        );
      }
      defaultResourceAction.set(rType, action.id);
      logger.debug(`Action ${action.id} set as default for resource type ${rType}.`);
    }
  }
  logger.debug(`Registered resource action: ${action.id} for type(s): ${applicableTypes.join(", ")}`);
}

/**
 * Gets all applicable action IDs for a given resource type.
 * @param resourceType The type of the resource.
 * @returns An array of action IDs applicable to the resource type. Returns an empty array if no actions are registered.
 */
export function getActionsForResourceType(
  resourceType: ResourceType,
): string[] {
  return resourceActionRegistry.get(resourceType) || [];
}

/**
 * Gets the default action ID for a given resource type.
 * @param resourceType The type of the resource.
 * @returns The default action ID if one is set, otherwise undefined.
 */
export function getDefaultActionForResourceType(
  resourceType: ResourceType,
): string | undefined {
  return defaultResourceAction.get(resourceType);
}

/**
 * Executes a registered action, typically a ResourceAction, on a specific resource.
 * This is a convenience wrapper around the base executeAction, tailored for resource operations.
 * @param actionId The ID of the action to execute.
 * @param resourceOrId The resource object or its ID to operate on.
 * @param args Additional arguments to pass to the action's handler.
 */
export async function executeResourceAction(
  actionId: string,
  resourceOrId: Resource | ResourceId,
  ...args: any[]
): Promise<void> {
  logger.debug(`Attempting to execute resource action: ${actionId} on resource/ID:`, typeof resourceOrId === 'number' ? resourceOrId : resourceOrId.id);
  // The baseExecuteAction will find the action by ID and call its handler.
  // The handler (defined in ResourceAction) is responsible for processing `resourceOrId`.
  return baseExecuteAction(actionId, resourceOrId, ...args);
}

// Example of defining and registering a resource action:
// (This would typically be in a file dedicated to actions for a specific resource type, e.g., webLinkActions.mts)
/*
const openWebLinkAction: ResourceAction = {
  id: "resource.webLink.open",
  name: "Open Web Link",
  type: ActionType.RESOURCE,
  resourceType: ResourceType.WEB_LINK,
  isDefault: true,
  handler: async (resourceOrId: Resource | ResourceId) => {
    let targetResource: Resource | null = null;
    if (typeof resourceOrId === 'number') {
      // targetResource = await getResourceById(resourceOrId); // Assuming getResourceById is imported
    } else {
      targetResource = resourceOrId;
    }

    if (!targetResource || targetResource.type !== ResourceType.WEB_LINK) {
      logger.error("Invalid resource or resource type for openWebLinkAction. Expected WEB_LINK.", targetResource);
      return;
    }
    logger.info(`Simulating opening web link: ${targetResource.name} - ${targetResource.url}`);
    // In a real application, you would use something like:
    // import { shell } from 'electron'; // If in an Electron environment
    // shell.openExternal(targetResource.url);
    // Or for a web app:
    // window.open(targetResource.url, '_blank');
  },
};

registerResourceAction(openWebLinkAction);
*/
