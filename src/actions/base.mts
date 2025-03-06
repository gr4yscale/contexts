import { ActionType, Action, registerAction } from "../actions.mts";

// actions that are generic, not context specific
interface BaseAction extends Action {
  type: ActionType.BASE;
  handler: () => Promise<void> | void;
}

export const runFirefoxAction: BaseAction = {
  id: "runFirefox",
  name: "Run Firefox",
  type: ActionType.BASE,
  handler: async () => {
    console.log("Running Firefox...");
  },
};

export const runEmacsAction: BaseAction = {
  id: "runEmacs",
  name: "Run Emacs",
  type: ActionType.BASE,
  handler: async () => {
    console.log("Running Emacs...");
  },
};

export const runRangerAction: BaseAction = {
  id: "runRanger",
  name: "Run Ranger",
  type: ActionType.BASE,
  handler: async () => {
    console.log("Running Ranger file manager...");
  },
};

registerAction(runFirefoxAction);
registerAction(runEmacsAction);
registerAction(runRangerAction);
