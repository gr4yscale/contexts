import { ActionType, Action, registerAction } from "../actions.mts";

// actions that act on a resource
interface ResourceAction extends Action {
  type: ActionType.RESOURCE;
  handler: (resourceId: string) => Promise<void> | void;
}

export const openResourceAction: ResourceAction = {
  id: "openResource",
  name: "Open Resource",
  type: ActionType.RESOURCE,
  handler: async (resourceId: string) => {
    console.log(`Opening resource ${resourceId}...`);
  },
};

export const resourcePlayInMpvAction: ResourceAction = {
  id: "resourcePlayInMpv",
  name: "Play in MPV",
  type: ActionType.RESOURCE,
  handler: async (resourceId: string) => {
    console.log(`Playing resource ${resourceId} in MPV...`);
  },
};

registerAction(openResourceAction);
registerAction(resourcePlayInMpvAction);
