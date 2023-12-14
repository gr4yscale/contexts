import { $, argv } from "zx";

import { getState, storeState, Context } from "./state.mts";

import { deactivateWorkspace } from "./workspaces.mts";
import { buildMenu } from "./menus.mts";
import {
  switchContextRofi,
  switchContext,
  sendWindowToAnotherContext,
} from "./commands/navigation.mts";
import { menuLinks, menuLinkGroups } from "./commands/links.mts";
import { viewEmacsBookmarks } from "./commands/emacs.mts";

// plugins
//   - get callbacks for things like contextSwitched, workspaceSwitched, menuSelected(menuKey)
//   - handle things like emacs bookmarks

// lifecycle
// TODO give plugins lifecycle hooks
const initContext = async (context: Context) => {
  if (context.orgBookmarks) {
    viewEmacsBookmarks("org");
  }
  // emacs bookmarks
  // run scripts
};

export const handleCommand = async (command: string | undefined) => {
  if (!command) {
    console.error("Error: You must specify a command.");
    return;
  }
  const currentContext = getState().currentContext;

  switch (command) {
    // navigation
    case "switchContextRofi": {
      await switchContextRofi();
      storeState();
      break;
    }
    case "switchContext": {
      await switchContext(argv.contextId);
      storeState();
      break;
    }
    case "sendWindowToAnotherContext": {
      await sendWindowToAnotherContext();
      break;
    }
    case "currentContextInit": {
      await initContext(currentContext);
      break;
    }
    // bookmarks
    case "bookmarks": {
      await buildMenuBookmarks();
      break;
    }
    // links
    case "links": {
      console.log("not implemented");
      break;
    }
    case "linkGroups": {
      console.log("not implemented");
      break;
    }
    // lifecycle
    case "deactivateWorkspace": {
      await deactivateWorkspace(currentContext);
      storeState();
      break;
    }
    case "pruneInactiveContexts": {
      // TODO
      // prompt user for deactivating contexts per dwmTag
      // store bookmarks, command snippets, etc for deactivated contexts
      break;
    }
    default: {
      console.error("command not recognized");
    }
  }
};

export const buildMenuBookmarks = async () =>
  await buildMenu({
    display: "Bookmarks",
    builder: () => [
      { display: "Web Links (All)", builder: () => menuLinks() },
      { display: "Web Links by Group", builder: () => menuLinkGroups() },
      { display: "Emacs", handler: () => viewEmacsBookmarks("org") },
      { display: "Scripts", handler: () => console.log("not implemented") },
    ],
  });
