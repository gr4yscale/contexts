import { $, sleep } from "zx";
import clipboard from "clipboardy";
import { nanoid } from "nanoid";

import { getState } from "../state.mts";

import { rofiListSelect } from "../ui.mts";
import { MenuItem } from "../menus.mts";

// links, link groups
export const linkLoad = async () => {
  const { currentContext } = getState();
  if (!currentContext || !currentContext.linkGroups[0]) {
    return;
  }
  const links = currentContext.linkGroups[0].links;
  const mapped = links.map((l) => {
    const description = l.description
      ? l.description.substring(0, 40).padEnd(40, " ")
      : "";
    return `${description}     ${l.url}`;
  });
  const list = mapped.reduce((prev, item) => prev + "\n" + item);
  const selected = await rofiListSelect(list, "link from 1st linkgroup: ");
  await $`firefox --new-window ${selected}`;
};

export const linkStore = async () => {
  $`notify-send "Contexts: Not Implemented."`;
};

export const linkGroupLoad = async (id: string) => {
  console.log("link group id");
  console.log(id);
  const { currentContext } = getState();
  if (!currentContext || !currentContext.linkGroups) {
    console.log("no link groups or context");
    //TOFIX notify-send
    return;
  }

  // select link group, or is there a "selected link group?" state for current context?
  const linkGroup = currentContext.linkGroups.find((lg) => (lg.id = id));
  if (linkGroup) {
    console.log("found link group");
    const links = linkGroup.links ?? []; //TODO createContext mapping
    const mapped = links.map((l) => l.url);
    await $`firefox -url ${mapped}`;
  }
};

export const linkGroupStore = async () => {
  const { currentContext } = getState();
  if (!currentContext) {
    return;
  }

  // fetching links metadata w/ requests?
  const extractLink = (line: string, created: Date) => {
    const parts = line.split("](") ?? [];
    if (parts.length === 2) {
      const title = parts[0].substring(5).trim();
      const url = parts[1].slice(0, -1);
      return { url, title, id: nanoid(), created, accessed: created };
    }
    return {
      url: "unknown",
      title: "unknown",
      id: nanoid(),
      created,
      accessed: created,
    };
  };

  //TOFIX
  await sleep(500);
  await $`xdotool key "Control_L+F12"`;
  await sleep(100);
  const created = new Date();
  const clipboardSelection = clipboard.readSync().split("\n") ?? [];

  const links = clipboardSelection.map((link) => extractLink(link, created));
  if (links.length > 0) {
    currentContext.linkGroups.push({
      id: nanoid(),
      links,
      created,
      accessed: created,
    });
  }
  console.log("stored linkgroup");
  console.log(currentContext.linkGroups[0]);
};

export const menuLinks = () => {
  const { currentContext } = getState();
  if (!currentContext || !currentContext.linkGroups[0]) {
    return [];
  }
  const links = currentContext.linkGroups[0].links ?? [];
  return links.map((l) => {
    //TOFIX description != title
    const description = l.description
      ? l.description.substring(0, 40).padEnd(40, " ")
      : "";
    const display = `${description}     ${l.url}`;
    const menuItem: MenuItem = {
      display,
      handler: async (selectionIndex?: number) => {
        if (!selectionIndex) {
          // TOFIX notify error
          return;
        }
        const url = links[selectionIndex].url;
        await $`firefox --new-window ${url}`;
        return;
      },
    };
    return menuItem;
  });
};

export const menuLinkGroups = () => {
  const { currentContext } = getState();
  return currentContext.linkGroups.map((lg) => {
    const linkCount = lg.links ? lg.links.length : 0;
    // const created = lg.created ?? new Date(); //TOFIX hack
    // console.log(created)
    // const createdString = formatDistanceToNow(created, {includeSeconds: true })
    // console.log(createdString)
    return {
      //display: `${linkCount.toString()} - ${lg.id}                      ${createdString}`,
      display: `${linkCount.toString()} - ${lg.id}`,
      handler: async (_?: number) => {
        await linkGroupLoad(lg.id);
      },
    };
  });
};
