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

  const currentContext = getState().currentContext;


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
