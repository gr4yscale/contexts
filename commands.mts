import { $, argv } from "zx";

import { getState, storeState, Context } from "./state.mts";

import { buildMenu } from "./menus.mts";
import {
  switchContextRofi,
  switchContext,
  sendWindowToAnotherContext,
} from "./commands/navigation.mts";
import { menuLinks, menuLinkGroups } from "./commands/links.mts";


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
