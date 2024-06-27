import { getState, storeState } from "./state.mts";
import { allocateWorkspace, deallocateWorkspace } from "./workspaces.mts";
import {
    activateActivity,
    switchActivity,
    swapActivity,
    sendWindowToAnotherActivity
} from "./commands/navigation.mts";
import { linkGroupStore, stickyLinkStore } from "./commands/links.mts";
import { saveEmacsWindowBookmark } from "./commands/emacs.mts";
import { listEnabledModes } from "./commands/modes.mts";
import { buildMenuCurrentActivity, buildMenuLinks, buildMenuLinkGroups, buildMenuEmacsBookmarks, buildMenuLaunchItems } from "./menuBuilders.mjs";
import { initActivity } from "./initActivity.mts";

export const handleCommand = async (command: string | undefined, args?: string) : Promise<string | undefined> => {
    if (!command) {
        console.error("Error: You must specify a command.");
      return Promise.resolve("error");
    }
    console.log(`handling command ${command}`);

    const currentActivity = getState().currentActivity;

    switch (command) {
        // navigation
        case "switchActivity": {
            await switchActivity("all");
            storeState();
            break;
        }
        case "switchActivityActive": {
            await switchActivity("active", "* ");
            storeState();
            break;
        }
        case "switchActivitySticky": {
            await switchActivity(" ", "sticky ");
            storeState();
            break;
        }
        case "swapActivity": {
            await swapActivity();
            storeState();
            break;
        }
        case "sendWindowToAnotherActivity": {
            await sendWindowToAnotherActivity();
            break;
        }
        case "listEnabledModes": {
          return await listEnabledModes(); // returns comma-separated string of enabled modes
        }
        case "activateActivity": {
            if (args) {
                await activateActivity(args);
                storeState();
            }
            break;
        }
        // current activity operations
        case "initActivity": {
            await allocateWorkspace(currentActivity);
            await initActivity(currentActivity);
            storeState();
            break;
        }
        case "deactivateWorkspace": {
            //TOFIX: confirmation
            await deallocateWorkspace(currentActivity);
            storeState();
            break;
        }
        // links operations
        case "linkGroupStore": {
            await linkGroupStore();
            storeState();
            break;
        }
        case "stickyLinkStore": {
            await stickyLinkStore();
            storeState();
            break;
        }
        // emacs bookmarks + capture
        case "emacsWindowBookmarkStore": {
            await saveEmacsWindowBookmark(currentActivity);
            storeState();
            break;
        }
        case "emacsOrgBookmarkStore": {
            // await saveEmacsOrgBookmark(currentActivity);
            // storeState();
            break;
        }
        // menus
        case "menuCurrentActivity": {
            await buildMenuCurrentActivity();
            break;
        }
        case "menuLinks": {
            await buildMenuLinks();
            break;
        }
        case "menuLinkGroups": {
            await buildMenuLinkGroups();
            break;
        }
        case "menuEmacsBookmarks": {
            await buildMenuEmacsBookmarks();
            break;
        }
        // launchItems
        case "menuLaunchItems": {
            await buildMenuLaunchItems();
            break;
        }
        default: {
          console.error("command not recognized");
        }
    }
};
