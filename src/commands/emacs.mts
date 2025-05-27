import { $, sleep } from "zx";
import { spawn } from "child_process";
import clipboard from "clipboardy";
import { nanoid } from "nanoid";
import { formatDistanceToNow } from "date-fns";

import { getCurrentNode } from "../db.mts";

import { Node, EmacsBookmark } from "../types.mts";

export const viewEmacsWindowBookmark = (bookmark: EmacsBookmark) => {
  const evalArg = '(burly-open-bookmark "' + bookmark.id + '")';
  const child = spawn(
    `/usr/bin/emacsclient`,
    ["-c", "-s", bookmark.env ?? "org", "--eval", evalArg],
    { detached: true, stdio: "ignore" },
  );
  child.unref();
};

export const viewEmacsWindowBookmarks = async () => {
  const currentNode = await getCurrentNode();
  if (!currentNode) {return;}

  if (!currentNode.emacsWindowBookmarks || !currentNode.emacsWindowBookmarks.length) {
    $`notify-send "No Emacs bookmarks for current node."`;
    return;
  }
  for (const bm of currentNode.emacsWindowBookmarks) {
    viewEmacsWindowBookmark(bm);
  }
};

export const saveEmacsWindowBookmark = async (node: Node) => {
  await $`xdotool key "F10"`;
  await sleep(100);

  const headlinePath = clipboard.readSync() ?? "";

  await $`xdotool key "Control_L+F10"`;
  await sleep(500);

  const bookmarkTitle = `nodes.${node.name}.${nanoid()}`;
  await $`xdotool type "${bookmarkTitle}"`;
  await $`xdotool key Return`;

  const env = node.tags.includes("dev") ? "dev" : "org";

  node.emacsWindowBookmarks.push({
    id: nanoid(),
    title: headlinePath,
    env,
    created: new Date(),
    accessed: new Date(),
    sticky: false,
  });
};

export const menuEmacsWindowBookmarks = async () => {
  const currentNode = await getCurrentNode();
  return currentNode.emacsWindowBookmarks.map((bm) => {
    const createdString = formatDistanceToNow(bm.created, {
      includeSeconds: true,
    });
    // if bm.id is org heading vs bookmark...
    return {
      display: `${bm.title} - ${bm.id}   ${createdString} ago`,
      handler: async (_?: number) => {
        viewEmacsWindowBookmark(bm);
      },
    };
  });
};

// export const viewEmacsOrgBookmark = (bookmark: EmacsBookmark) => {
// 	// emacsclient -c -s org --eval "(org-id-goto '1c2097d0-d25b-4b5c-b395-723aac387af2)"
// 	// emacsclient -c -s org --eval "(gr4yscale/jump-into-by-id '1c2097d0-d25b-4b5c-b395-723aac387af2)"
// 	const evalArg = `(gr4yscale/jump-into-by-id "${bookmark.id}")`
// 	//const evalArg = `(org-id-goto '${bookmark.id})`
// 	const child = spawn(
// 		`/usr/bin/emacsclient`,
// 		["-c", "-s", bookmark.env ?? 'org', "--eval", evalArg],
// 		{ detached: true, stdio: "ignore" },
// 	);
// 	child.unref();
// };

export const viewEmacsOrgBookmark = (bookmark: EmacsBookmark) => {
  // emacsclient -c -s org --eval "(org-id-goto '1c2097d0-d25b-4b5c-b395-723aac387af2)"
  // emacsclient -c -s org --eval "(gr4yscale/jump-into-by-id '1c2097d0-d25b-4b5c-b395-723aac387af2)"
  const evalArg = `(gr4yscale/jump-into-by-id '${bookmark.id})`;
  //const evalArg = `(org-id-goto '${bookmark.id})`
  const child = spawn(
    `/usr/bin/emacsclient`,
    ["-c", "-s", bookmark.env ?? "org", "--eval", evalArg],
    { detached: true, stdio: "ignore" },
  );
  child.unref();
};

export const viewEmacsOrgBookmarks = async () => {
  const currentNode = await getCurrentNode();
  if (!currentNode.emacsOrgBookmarks || !currentNode.emacsOrgBookmarks.length) {
    $`notify-send "No Emacs org bookmarks for current node."`;
    return;
  }
  for (const bm of currentNode.emacsOrgBookmarks) {
    viewEmacsOrgBookmark(bm);
  }
};

export const menuEmacsOrgBookmarks = () => {
  const currentNode = await getCurrentNode();
  return currentNode.emacsOrgBookmarks.map((bm) => {
    const createdString = formatDistanceToNow(bm.created, {
      includeSeconds: true,
    });
    // if bm.id is org heading vs bookmark...
    return {
      display: `${bm.title} - ${bm.id}   ${createdString} ago`,
      handler: async (_?: number) => {
        viewEmacsOrgBookmark(bm);
      },
    };
  });
};

export const viewEmacsSession = (id: string) => {
  const evalArg = '(easysession-switch-to "z-' + id + '")';
  const child = spawn(
    `/usr/bin/emacsclient`,
    ["-c", "-s", `z-${id}`, "--eval", evalArg],
    { detached: true, stdio: "ignore" },
  );
  // const child = spawn(`/usr/bin/emacsclient`, ["-c", "-s", `z-${id}`], {
  //   detached: true,
  //   stdio: "ignore",
  // });
  child.unref();
};

// for saving emacs session, we're not gauranteed to be in the right emacs daemon for the node

// we should call easysession-save-as on the current window

// we need a save func to persist nodes automatically

// for persisting nodes automation, we would iterate through nodes's workspaces, and if emacs windows in this workspace === 1, save session
