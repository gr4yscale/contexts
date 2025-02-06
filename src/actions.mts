import { activityById } from "./state.mts";
import { viewEmacsSession } from "./commands/emacs.mts";

export type ActivityAction = {
  id: string;
  display: string;
  action: (id: string) => void;
};

type ActionTypes = "emacsLaunch";

const actionForType = {
  emacsLaunch: {
    id: "emacsLaunch",
    display: "emacs: load session",
    action: (id: string) => viewEmacsSession(id),
  },
  stateStoreBrowserFF: {
    id: "stateStoreBbrowserFF",
    display: "ff: store open windows's tabs",
    action: (id: string) => viewEmacsSession(id),
  },
};

export const runInitActionsForActivity = (activityId: string) => {
  const action = actionForType["emacsLaunch"];
  action.action(activityId);

  // console.log(`running activity action for ${activityId}`);
  // const activity = activityById(activityId);
  // if (activity) {
  //   console.log(`activity found ${activityId}`);

  //   if (activity && activity.actions.length > 0) {
  //     console.log("activity has actions");
  //     const actionType = activity.actions[0] as ActionTypes;
  //     const action = actionForType[actionType];

  //     if (action) {
  //       console.log(`action found`);
  //       action.action(activityId);
  //     }
  //   }
  // }
};
