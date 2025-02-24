import { allocateWorkspace, deallocateWorkspace } from "./workspaces.mts";
import {
  activateActivity,
  toggleActivity,
  switchActivity,
  swapActivity,
  sendWindowToAnotherWorkspace,
  showTUI,
} from "./commands/navigation.mts";
import { linkGroupStore, stickyLinkStore } from "./commands/links.mts";
import { saveEmacsWindowBookmark } from "./commands/emacs.mts";
import {
  buildMenuCurrentActivity,
  buildMenuTagsToggle,
  buildMenuLinks,
  buildMenuLinkGroups,
  buildMenuEmacsBookmarks,
  buildMenuLaunchItems,
  buildMenuActivityListTypesToggle,
} from "./menuBuilders.mts";

import { activitiesActive } from "./activityList.mts";
import { initActivity } from "./initActivity.mts";
import { runInitActionsForActivity } from "./actions.mts";
import {
  storeBrowserStates,
  loadLastBrowserStateForActiveActivities,
} from "./browser.mts";

import activityDTO from "./models/activity.mts";
const { getCurrentActivity } = await activityDTO();

type Listener = (command: string) => void;
let listeners: Listener[] = [];

export const registerCommandListener = (listener: Listener) => {
  listeners.push(listener);
};

export const unregisterCommandListener = (listener: Listener) => {
  const idx = listeners.indexOf(listener);
  listeners.splice(idx, 1);
};

export const handleCommand = async (
  command: string | undefined,
  args?: string,
): Promise<string | undefined> => {
  if (!command) {
    console.error("Error: You must specify a command.");
    return Promise.resolve("error");
  }
  //console.error(`handling command ${command}`);

  // switchActivity
  // toggle enabledActivityListTypes
  // toggle enabledTags
  // activity lifecycle

  switch (command) {
    // navigation
    case "switchActivity": {
      await switchActivity();
      break;
    }
    case "globalLeader": {
      await showTUI();
      break;
    }
    case "swapActivity": {
      await swapActivity();
      break;
    }
    case "sendWindowToAnotherWorkspace": {
      await sendWindowToAnotherWorkspace();
      break;
    }
    case "toggleActivity": {
      if (args) {
        await toggleActivity(args);
      }
      break;
    }
    // activity lifecycle
    case "activateActivity": {
      if (args) {
        await activateActivity(args);
      }
      break;
    }
    // TODO: cleanup
    case "deactivateWorkspace": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //TOFIX: confirmation
      //await deallocateWorkspace(currentActivity);
      break;
    }
    // case "listEnabledTags": {
    //   const a = await listEnabledTags();
    //   console.log('enabled tags:')
    //   console.log(a)
    //   return await listEnabledTags(); // returns comma-separated string of enabled modes
    // }
    case "initActivity": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await allocateWorkspace(currentActivity);
      //await initActivity(currentActivity);
      break;
    }
    case "storeBrowserStates": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await storeBrowserStates();
      break;
    }
    case "loadBrowserStates": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await loadLastBrowserStateForActiveActivities();
      break;
    }

    case "hydrateActivities": {
      // do this for 'active' activities (ones that i last had open), which also have an 'init action'

      // wmctrl -l | g "Firefox"

      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      // const activeActivities = await getActiveActivities();
      // for (const activity in activeActivities) {
      //   // todo need to block / wait here... even with setInterval etc
      //   runInitActionsForActivity(activity);
      // }
      break;
    }

    // keybindings
    case "leaderKey": {
      // triggered by ctrl + home

      // tagList, listType for filtering activities

      // home = show plan activity (emacs + current orgql query)

      //await leaderKey();
      break;
    }
    case "localLeaderKey": {
      // triggered by ctrl + end

      // activities/modes/context-specific
      // run actions, act on resources (dwm workspaces,org headlines)

      // end = show activities list

      //await localLeaderKey();
      break;
    }
    // UI: tags/modes, global context
    case "menuActivityListTypesToggle": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await buildMenuActivityListTypesToggle();
      break;
    }
    case "menuTagsToggle": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await buildMenuTagsToggle();
      break;
    }
    // emacs org-mode integration
    case "activateActivityForOrgId": {
      console.log("not implemented currently");
      // if (args) {
      //   const response = await activateActivityForOrgId(args);
      //   return response;
      // }
      break;
    }
    // context-sensitive operations (perform actions on resources)
    // links operations
    case "menuCurrentActivity": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await buildMenuCurrentActivity();
      break;
    }
    case "linkGroupStore": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await linkGroupStore();
      break;
    }
    case "stickyLinkStore": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await stickyLinkStore();
      break;
    }
    // emacs bookmarks + capture
    case "emacsWindowBookmarkStore": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await saveEmacsWindowBookmark(currentActivity);
      break;
    }
    case "emacsOrgBookmarkStore": {
      // await saveEmacsOrgBookmark(currentActivity);
      break;
    }
    // UI, menus
    case "menuLinks": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await buildMenuLinks();
      break;
    }
    case "menuLinkGroups": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await buildMenuLinkGroups();
      break;
    }
    case "menuEmacsBookmarks": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await buildMenuEmacsBookmarks();
      break;
    }
    // launchItems
    case "menuLaunchItems": {
      console.log("commented. need to transform/merge ActivityDTO -> Activity");
      //await buildMenuLaunchItems();
      break;
    }
    default: {
      console.error("command not recognized");
    }
  }

  for (const listener of listeners) {
    listener(command);
  }
};
