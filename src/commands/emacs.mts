import { $, sleep } from "zx";
import { spawn } from "child_process";
import clipboard from "clipboardy";
import { nanoid } from "nanoid";
import { formatDistanceToNow } from "date-fns";

import { getState, Activity, EmacsBookmark } from "../state.mts";

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
  const activity = getState().currentActivity;
  if (!activity.emacsWindowBookmarks || !activity.emacsWindowBookmarks.length) {
    $`notify-send "No Emacs bookmarks for current activity."`;
    return;
  }
  for (const bm of activity.emacsWindowBookmarks) {
    viewEmacsWindowBookmark(bm)
  }
};

export const saveEmacsWindowBookmark = async (activity: Activity) => {
    await $`xdotool key "F10"`;
    await sleep(100);

  const headlinePath = clipboard.readSync() ?? ''; 

  await $`xdotool key "Control_L+F10"`;
  await sleep(500);

  const bookmarkTitle = `activities.${activity.name}.${nanoid()}`;
  await $`xdotool type "${bookmarkTitle}"`;
  await $`xdotool key Return`;

  const env = activity.tags.includes('dev') ? 'dev' : 'org'

    activity.emacsWindowBookmarks.push({
      id: nanoid(),
	title: headlinePath,
	env,
	created: new Date(),
	accessed: new Date(),
	sticky: false
    })
}

export const menuEmacsWindowBookmarks = () => {
  const { currentActivity } = getState();
  return currentActivity.emacsWindowBookmarks.map((bm) => {
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
  const activity = getState().currentActivity;
  if (!activity.emacsOrgBookmarks || !activity.emacsOrgBookmarks.length) {
    $`notify-send "No Emacs org bookmarks for current activity."`;
    return;
  }
  for (const bm of activity.emacsOrgBookmarks) {
    viewEmacsOrgBookmark(bm)
  }
};


export const menuEmacsOrgBookmarks = () => {
  const { currentActivity } = getState();
  return currentActivity.emacsOrgBookmarks.map((bm) => {
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
