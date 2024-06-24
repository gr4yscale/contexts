import { $, sleep } from "zx";
import { spawn } from "child_process";
import clipboard from "clipboardy";
import { nanoid } from "nanoid";
import { formatDistanceToNow } from "date-fns";

import { getState, Context, EmacsBookmark } from "../state.mts";

export const viewEmacsWindowBookmark = (bookmark: EmacsBookmark) => {
    const evalArg = '(burly-open-bookmark "' + bookmark.id + '")';
    const child = spawn(
      `/usr/bin/emacsclient`,
      ["-c", "-s", bookmark.env ?? 'org', "--eval", evalArg],
      { detached: true, stdio: "ignore" },
    );
    child.unref();
};


export const viewEmacsWindowBookmarks = () => {
  const context = getState().currentContext;
  if (!context.emacsWindowBookmarks || !context.emacsWindowBookmarks.length) {
    $`notify-send "No Emacs bookmarks for current context."`;
    return;
  }
  for (const bm of context.emacsWindowBookmarks) {
    viewEmacsWindowBookmark(bm)
  }
};

export const saveEmacsWindowBookmark = async (context: Context) => {
    await $`xdotool key "F10"`;
    await sleep(100);

  const headlinePath = clipboard.readSync() ?? ''; 

  await $`xdotool key "Control_L+F10"`;
  await sleep(500);

  const bookmarkTitle = `contexts.${context.name}.${nanoid()}`;
  await $`xdotool type "${bookmarkTitle}"`;
  await $`xdotool key Return`;

  const env = context.tags.includes('dev') ? 'dev' : 'org'

    context.emacsWindowBookmarks.push({
      id: nanoid(),
	title: headlinePath,
	env,
	created: new Date(),
	accessed: new Date(),
	sticky: false
    })
}

export const menuEmacsWindowBookmarks = () => {
  const { currentContext } = getState();
  return currentContext.emacsWindowBookmarks.map((bm) => {
    const createdString = formatDistanceToNow(bm.created, {includeSeconds: true })
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
        const evalArg = `(gr4yscale/jump-into-by-id '${bookmark.id})`
	//const evalArg = `(org-id-goto '${bookmark.id})`
	const child = spawn(
		`/usr/bin/emacsclient`,
		["-c", "-s", bookmark.env ?? 'org', "--eval", evalArg],
		{ detached: true, stdio: "ignore" },
	);
	child.unref();
};

export const viewEmacsOrgBookmarks = () => {
  const context = getState().currentContext;
  if (!context.emacsOrgBookmarks || !context.emacsOrgBookmarks.length) {
    $`notify-send "No Emacs org bookmarks for current context."`;
    return;
  }
  for (const bm of context.emacsOrgBookmarks) {
    viewEmacsOrgBookmark(bm)
  }
};


export const menuEmacsOrgBookmarks = () => {
  const { currentContext } = getState();
  return currentContext.emacsOrgBookmarks.map((bm) => {
    const createdString = formatDistanceToNow(bm.created, {includeSeconds: true })
    // if bm.id is org heading vs bookmark...
    return {
      display: `${bm.title} - ${bm.id}   ${createdString} ago`,
      handler: async (_?: number) => {
	viewEmacsOrgBookmark(bm);
      },
    };
  });
};
