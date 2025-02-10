import { $, fs } from "zx";
import { activityByDwmTag } from "./state.mts";
import { ActivityId } from "./types.mts";
import { activateActivity } from "./commands/navigation.mts";
import { retryAsync, RetryStatus } from "./retry-async.mts";
import { getActiveActivities } from "./db.mts";

// make action for storing browser snapshots to all activities
// ui for executing global actions can be copied from linkgroups
// ui for executing actions on activities can be copied from linkgroups

// dont forget hotkey: end, end (current activity actions)

type Tab = {
  url: string;
  title: string;
  index: number;
};

type Window = {
  winid: number;
  title: string;
  tabs: Tab[];
  activityId?: ActivityId;
  dwmTag?: number;
};

type TabFSResponse = Window[];

export type BrowserState = {
  windows: Window[];
  created: Date;
  accessed: Date;
};

const getDwmTagsAndTitles = async () => {
  const result = await $`wmctrl -l | grep 'Firefox'`;
  const stdout = result.stdout;
  const lines = stdout.split("\n");
  const meta = lines.map((l) => {
    const dwmTag = l.slice(11, 14);
    const title = l.slice(21);
    return { dwmTag, title };
  });
  //console.log(meta)
  return meta;
};

const getWindowsAndTabs = () => {
  const filepath = `/home/gr4yscale/TabFS/fs/mnt/windows_with_tabs.json`;
  const contents = fs.readFileSync(filepath).toString("utf8");
  const details = JSON.parse(contents) as TabFSResponse;
  // tofix use zod for validation here

  return details.map((window) => {
    // sort the tabs by their index
    // TOFIX test if this is necessary
    window.tabs = window.tabs.sort((ta, tb) => ta.index - tb.index);
    return window;
  });
};

const mapWindowsToActivities = async (): Promise<Window[]> => {
  const dwmTagsAndTitles = await getDwmTagsAndTitles();
  const windows = getWindowsAndTabs();

  for (const window of windows) {
    const dwmTag = dwmTagsAndTitles.find((t) => t.title === window.title)
      ?.dwmTag;
    if (dwmTag) {
      //console.log(window);
      const activity = activityByDwmTag(Number(dwmTag));
      if (activity) {
        window.activityId = activity.activityId;
      }
    }
  }
  return windows;
};

export const storeBrowserStates = async () => {
  const windows = await mapWindowsToActivities();

  const activeActivities = await getActiveActivities();
  for (const activity of activeActivities) {
    const windowsForActivity = windows.filter(
      (w) => w.activityId === activity.activityId,
    );
    const browserState: BrowserState = {
      windows: windowsForActivity,
      created: new Date(),
      accessed: new Date(),
    };
    activity.browserStates.push(browserState);
    // TOFIX: prune oldest browserState if > 10 stored
  }

  console.log("********************************************");
  console.log("******** browser states stored *************");
  console.log("********************************************");
};

const windowAlreadyOpen = (
  browserStateWindow: Window,
  openWindows: Window[],
) => {
  const sortedBrowserStateWindowTabs = browserStateWindow.tabs.sort(
    (ta, tb) => ta.index - tb.index,
  );
  return openWindows.find((openWindow) => {
    if (openWindow.tabs[0].url === sortedBrowserStateWindowTabs[0].url) {
      return true;
    }
    return false;
  });
};

// had issues using TabFS to create a window with URLs
// for moz-extension: and about:newtab urls

const openBrowserWindowForUrls = async (urls: string[]) => {
  const filepath = `/home/gr4yscale/TabFS/fs/mnt/windows_create_with_tabs`;
  const filtered = urls.filter((url: string) => {
    return url !== "about:newtab";
  });

  const contents = filtered.join(",");
  await fs.writeFile(filepath, contents);
};

const findIt = async (firstTabTitle: string) => {
  return new Promise(async (resolve, reject) => {
    const res = await getDwmTagsAndTitles();
    if (res) {
      console.log(res);
      console.log(`trying to find ${firstTabTitle}`);
      const titles = res.map((l) => l.title);
      if (titles && firstTabTitle) {
        console.log(titles);
        const found = titles.find((t) => t.includes(firstTabTitle));
        console.log(found);
        if (found) {
          console.log("found!");
          return resolve(true);
        }
      }
      console.log("not found!");
      return reject();
    }
  });
};

// make a per-activity action for this
// make a global action for all activities restore

export const loadLastBrowserStateForActiveActivities = async () => {
  const openWindows = await mapWindowsToActivities();

  // const decoratedWindowFinder = retryDecorator(findIt, {
  //   retries: 10,
  //   delay: 250,
  //   timeout: 5 * 1000,
  // });

  const activeActivities = await getActiveActivities();
  for (const activity of activeActivities) {
    const [lastBrowserState] = activity.browserStates.slice(-1);
    // open windows which haven't already been opened in this activity
    for (const window of lastBrowserState.windows) {
      // TOFIX compare hash of tab's URLs
      if (!windowAlreadyOpen(window, openWindows)) {
        // TOFIX
        // view dwm workspace for activity (activate)
        await activateActivity(activity.activityId);
        const urls = window.tabs.map((t) => t.url);
        const firstTabTitle = window.tabs[0].title;
        if (urls.length === 1) {
          await $`firefox --new-window ${urls[0]}`;
          // wait for ff window to appear (use wmctrl -l? use TabFS to look for it?)
        } else {
          await $`firefox ${urls}`;
          // wait for ff window to appear (use wmctrl -l? use TabFS to look for it?)
        }

        // find the ff window before moving on
        // TOFIX this should be overrideable and replaced with a sleep?

        // use delays with 0.25s increments:
        const delay = (s: RetryStatus) => (s.index + 1) * 250;

        // retry for up to 30 times, with duration not exceeding 10s:
        const retry = (s: RetryStatus) => s.index < 30 && s.duration <= 10000;

        const error = (s: RetryStatus) => {
          const info = {
            index: s.index,
            duration: s.duration,
            error: "error",
            //error: s.error.message,
          };
          console.error("Handling:", info);
        };

        console.log(`trying to find${firstTabTitle}`);
        await retryAsync(async () => findIt(firstTabTitle), {
          retry,
          delay,
          error,
        });
        console.log(`found ${firstTabTitle}`);
        // .then((data) => console.log("SUCCESS:", data))
        // .catch((err) => console.error("FAILED:", err));

        // TOFIX discard tabs

        // await sleep(1000);
      }
    }
  }
  // verify that the activity has all windows for the browser state open?
};

// -------------------------------------------

// Window { idTabFs, title, links[] }

// store dict: dwmTags[] to Titles for firefox windows: wmctrl -l | g Firefox
// store Windows[].Links[] with TabFS $
// foreach Window
//   - find dwmTag where dwmTagsToTitles.contains(w.title)
//  store dwmTag : Links[]

// map Windows[].Links[] to dwmTags[]

// foreach dwmTag
//   - find the Activity associated with it
//   - store lists of Links in browserState
