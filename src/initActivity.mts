// import { $, sleep } from "zx";
// import { Activity } from "./state.mts";
import { runInitActionsForActivity } from "./actions.mts";
import { Activity } from "./types.mts";

// import {
//   viewEmacsWindowBookmarks,
//   viewEmacsOrgBookmarks,
// } from "./commands/emacs.mts";

export const initActivity = async (activity: Activity) => {
  //
  runInitActionsForActivity(activity.activityId);
  // shell out to "selected" or "sticky" "command items" (menu items' command handlers)
  // this should probably be defined in activities yaml
  // if (activity.emacsWindowBookmarks.length > 0) {
  //   viewEmacsWindowBookmarks();
  // }
  // if (activity.emacsOrgBookmarks.length > 0) {
  //   viewEmacsOrgBookmarks();
  // }
  // const stickyLinks = activity.links
  //   .filter((l) => l.sticky === true)
  //   .map((l) => l.url);

  // if (stickyLinks.length > 0) {
  //   // need to make several invocations to ff in order to deterministically open a list of links in 1 window on the same dwm tag
  //   // TOFIX: investigate better interface; sleep is fragile
  //   await $`firefox --new-window ${stickyLinks[0]}`;
  //   for (let i = 1; i < stickyLinks.length; i++) {
  //     const l = stickyLinks[i];
  //     await sleep(50);
  //     await $`firefox --new-tab ${l}`;
  //   }
  // }

  // await $`notify-send 'initialized ${activity.activityId}'`;
};
