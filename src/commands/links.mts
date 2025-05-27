import { $, sleep } from "zx";
import clipboard from "clipboardy";
import { nanoid } from "nanoid";
import { formatDistanceToNow } from "date-fns";

import { rofiListSelect } from "../selection.mts";
import { MenuItem } from "../menus.mts";
import { getCurrentNode } from "../db.mts";

// fetching links metadata w/ requests?
const extractLink = (line: string) => {
  const parts = line.split("](") ?? [];
  if (parts.length === 2) {
    // tab discard extension puts this unicode character (zzz) for sleeping tabs; sanitize
    const title = parts[0].replace(/💤/g, " ").substring(3).trim();
    const url = parts[1].slice(0, -1);
    return {
      url,
      title,
      id: nanoid(),
      created: new Date(),
      accessed: new Date(),
      sticky: false,
    };
  } else {
    //TOFIX throw error here
    $`notify-send "Error parsing link"`;
  }
  return {
    url: "unknown",
    title: "unknown",
    id: nanoid(),
    created: new Date(),
    accessed: new Date(),
    sticky: false,
  };
};

// links, link groups
export const linkLoad = async () => {
  const currentNode = await getCurrentNode();
  if (!currentNode || !currentNode.linkGroups[0]) {
    return;
  }
  const links = currentNode.linkGroups[0].links;
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
  $`notify-send "Nodes: Not Implemented."`;
};

export const stickyLinkStore = async () => {
  const currentNode = await getCurrentNode();
  await sleep(500); //TOFIX sleep
  await $`xdotool key "Control_L+Shift+F12"`;
  await sleep(100);
  const clipboardSelection = clipboard.readSync() ?? "";
  const link = extractLink(clipboardSelection);
  link.sticky = true;
  currentNode.links.push(link);
  const msg = "Stored link " + link.title;
  $`notify-send ${msg}`;
};

export const linkGroupLoad = async (id: string) => {
  const currentNode = await getCurrentNode();
  if (!currentNode || !currentNode.linkGroups) {
    console.log("no link groups or node");
    $`notify-send "Link Group not found."`;
    return;
  }

  // select link group, or is there a "selected link group?" state for current node?
  const linkGroup = currentNode.linkGroups.find((lg) => lg.id === id);
  if (linkGroup) {
    const mapped = linkGroup.links.map((l) => l.url);
    await $`firefox -url ${mapped}`;
  }
};

export const linkGroupStore = async () => {
  const currentNode = await getCurrentNode();
  if (!currentNode) {
    return;
  }

  try {
    await sleep(500); //TOFIX sleep
    await $`xdotool key "Control_L+F12"`;
    await sleep(100);
    const clipboardContent = clipboard.readSync().split("\n") ?? [];

    const links = clipboardContent.map((link) => extractLink(link));
    if (links.length > 0) {
      const name = `${links[0].title}`;
      const lg = {
        id: nanoid(),
        name,
        created: new Date(),
        accessed: new Date(),
        links,
      };
      currentNode.linkGroups.push(lg);
      const msg = "Stored link group (" + links.length + ") " + lg.name;
      $`notify-send ${msg}`;
      console.log(`stored linkgroup ${lg.name}`);
    }
  } catch (e) {
    $`notify-send "Nodes: Error occurred while storing link group."`;
  }
};

export const menuLinks = async () => {
  const currentNode = await getCurrentNode();
  if (!currentNode || !currentNode.linkGroups[0]) {
    return [];
  }

  const links = currentNode.linkGroups
    .sort((l, r) => r.created.getTime() - l.created.getTime())
    .flatMap((lg) => lg.links);

  return links.map((l) => {
    //TOFIX
    const timeAgo = formatDistanceToNow(l.created, { includeSeconds: true })
      .replace("about ", "")
      .replace(" hours", "h")
      .replace(" days", "d")
      .replace(" day", "d")
      .replace(" hour", "h");
    const title = l.title.substring(0, 100).padEnd(100, " ");
    const display = `${title}   ${timeAgo} ago`;

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
  const currentNode = await getCurrentNode();

  const sorted = currentNode.linkGroups.sort(
    (l, r) => r.created.getTime() - l.created.getTime(),
  );

  return sorted.map((lg) => {
    const linkCount = lg.links ? lg.links.length : 0;
    const created = lg.created ?? new Date(); //TOFIX hack
    const createdString = formatDistanceToNow(created, { includeSeconds: true })
      .replace("about ", "")
      .replace(" hours", "h")
      .replace(" days", "d");
    const title = lg.name.substring(0, 100).padEnd(100, " ");
    return {
      display: `${linkCount.toString()} - ${title}   ${createdString} ago`,
      //display: `${linkCount.toString()} - ${lg.name}`,
      handler: async (_?: number) => {
        await linkGroupLoad(lg.id);
      },
    };
  });
};
