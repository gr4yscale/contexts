import { $ } from "zx";

import { getState } from "./state.mts";

import { buildMenu } from "./menus.mts";
import { menuLinks, menuLinkGroups } from "./commands/links.mts";
import { menuEmacsWindowBookmarks, menuEmacsOrgBookmarks } from "./commands/emacs.mts";
export const buildMenuCurrentContext = async () => {
  const currentContext = getState().currentContext;

  await buildMenu({
    display: "current context",
    builder: () => [
      { display: "links", builder: () => menuLinks() },
      { display: "links by group", builder: () => menuLinkGroups() },
      { display: "emacs capture", /*handler: () => emacsCapture() */ },
      { display: "emacs window bookmarks", builder: () => menuEmacsWindowBookmarks() },
      { display: "emacs org bookmarks", builder: () => menuEmacsOrgBookmarks() },
      { display: "links by group", builder: () => menuLinkGroups() },
      { display: "rename" /* handler: () => renamePrompt() */ },
      { display: "scripts" /* builder: () => menuScripts() */ },
      { display: "de-activate" /* handler: () => menuRename() */ },
    ],
  });
};

export const buildMenuLinks = async () => {
  await buildMenu({
    display: "links",
    builder: () => menuLinks(),
  });
};

export const buildMenuLinkGroups = async () => {
  await buildMenu({
    display: "link groups",
    builder: () => menuLinkGroups(),
  });
};

export const buildMenuEmacsBookmarks = async () => {
  await buildMenu({
    display: "emacs window bookmarks",
    handler: () => menuEmacsWindowBookmarks(),
    //TOFIX show list of emacs bookmarks; swap handler with builder
  });
};

export const buildMenuLaunchItems = async () => {
  const c = getState().currentContext;
  //const linksAll = linkGroups.flatMap((lg) => lg.links);

  const menuItemLinks = c.links.filter((l) => l.sticky === true).map((l) => {
    const title = l.title ?? ''
    const description = l.description ?? ''
    return {
      display: `link: ${title.substring(0, 60)} ${description.substring(
        0,
        30,
      )} ${l.url.substring(0, 30)}`,
      handler: async () => {
        await $`firefox --new-window ${l.url}`;
      },
    };
  });

  await buildMenu({
     display: "launch items",
     builder: () => { return menuItemLinks}
   });
};
