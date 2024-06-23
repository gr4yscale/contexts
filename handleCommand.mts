import { getState, storeState } from "./state.mts";
import { allocateWorkspace, deallocateWorkspace } from "./workspaces.mts";
import {
    activateContext,
    switchContext,
    swapContext,
    sendWindowToAnotherContext
} from "./commands/navigation.mts";
import { linkGroupStore, stickyLinkStore } from "./commands/links.mts";
import { saveEmacsWindowBookmark } from "./commands/emacs.mts";
import { buildMenuCurrentContext, buildMenuLinks, buildMenuLinkGroups, buildMenuEmacsBookmarks, buildMenuLaunchItems } from "./commands.mts";
export const handleCommand = async (command: string | undefined, args?: string) => {
    if (!command) {
        console.error("Error: You must specify a command.");
        return;
    }
    console.log(`handling command ${command}`);

    const currentContext = getState().currentContext;

    switch (command) {
        // navigation
        case "switchContext": {
            await switchContext("all");
            storeState();
            break;
        }
        case "switchContextActive": {
            await switchContext("active", "* ");
            storeState();
            break;
        }
        case "switchContextSticky": {
            await switchContext(" ", "sticky ");
            storeState();
            break;
        }
        case "swapContext": {
            await swapContext();
            storeState();
            break;
        }
        case "sendWindowToAnotherContext": {
            await sendWindowToAnotherContext();
            break;
        }
        case "activateContext": {
            if (args) {
                await activateContext(args);
                storeState();
            }
            break;
        }
        // current context operations
        case "initContext": {
            await allocateWorkspace(currentContext);
            await initContext(currentContext);
            storeState();
            break;
        }
        case "deactivateWorkspace": {
            //TOFIX: confirmation
            await deallocateWorkspace(currentContext);
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
            await saveEmacsWindowBookmark(currentContext);
            storeState();
            break;
        }
        case "emacsOrgBookmarkStore": {
            // await saveEmacsOrgBookmark(currentContext);
            // storeState();
            break;
        }
        // menus
        case "menuCurrentContext": {
            await buildMenuCurrentContext();
            break;
        }
        default: {
            console.error("command not recognized");
        }
    }
};
