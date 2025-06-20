import { $, fs } from "zx";
import { NodeId } from "./types.mts";
import { activateNode } from "./actions/navigation.mts";
import { retryAsync, RetryStatus } from "./retry-async.mts";
import { getAllNodes, getCurrentNode } from "./models/node.mts";
import { getWorkspaceById } from "./models/workspace.mts";

// make action for storing browser snapshots to all nodes

// dont forget hotkey: end, end (current node actions)

type Tab = {
  url: string;
  title: string;
  index: number;
  active?: boolean;
};

type Window = {
  winid: number;
  title: string;
  tabs: Tab[];
  nodeId?: NodeId;
  dwmTag?: number;
};

type TabFSResponse = Window[];

export type BrowserState = {
  windows: Window[];
  created: Date;
  accessed: Date;
};

const getWorkspaceIdsAndTitles = async () => {
  const result = await $`wmctrl -l | grep 'Firefox'`;
  const stdout = result.stdout;
  const lines = stdout.split("\n");
  const meta = lines.map((l) => {
    const workspaceId = parseInt(l.slice(11, 14).trim(), 10);
    const title = l.slice(21);
    return { workspaceId, title };
  });
  return meta;
};

const getWindowsAndTabs = () => {
  const filepath = `/home/gr4yscale/TabFS/fs/mnt/windows_with_tabs.json`;
  const contents = fs.readFileSync(filepath).toString("utf8");
  const details = JSON.parse(contents) as TabFSResponse;
  // TOFIX use zod for validation here?

  return details.map((window) => {
    // sort the tabs by their index
    // TOFIX test if this is necessary
    window.tabs = window.tabs.sort((ta, tb) => ta.index - tb.index);
    return window;
  });
};

const nodeByWorkspaceId = async (workspaceId: number) => {
  const workspace = await getWorkspaceById(workspaceId);
  if (workspace && workspace.nodeId) {
    const allNodes = await getAllNodes();
    return allNodes.find((node) => node.nodeId === workspace.nodeId);
  }
  return null;
};

const mapWindowsToNodes = async (): Promise<Window[]> => {
  const workspaceIdsAndTitles = await getWorkspaceIdsAndTitles();
  const windows = getWindowsAndTabs();

  for (const window of windows) {
    const workspaceId = workspaceIdsAndTitles.find(
      (t) => t.title === window.title,
    )?.workspaceId;
    if (workspaceId) {
      //console.log(window);
      const node = await nodeByWorkspaceId(workspaceId);
      if (node) {
        window.nodeId = node.nodeId;
      }
    }
  }
  return windows;
};

export const getBrowserStates = async () => {
  const browserStates = [];
  const windows = await mapWindowsToNodes();

  const allNodes = await getAllNodes();
  for (const node of allNodes) {
    const windowsForNode = windows.filter((w) => w.nodeId === node.nodeId);
    const browserState: BrowserState = {
      windows: windowsForNode, // windows and tabs
      created: new Date(),
      accessed: new Date(),
    };
    browserStates.push(browserState);
    // TOFIX: prune oldest browserState if > 10 stored
  }

  console.log("****** browser states: ******");
  console.log(browserStates);

  return browserStates;
};

export const getBrowserStateForCurrentNode =
  async (): Promise<BrowserState | null> => {
    const currentNode = await getCurrentNode();
    if (!currentNode) {
      return null;
    }

    const windows = await mapWindowsToNodes();
    const windowsForNode = windows.filter(
      (w) => w.nodeId === currentNode.nodeId,
    );

    const browserState: BrowserState = {
      windows: windowsForNode,
      created: new Date(),
      accessed: new Date(),
    };

    return browserState;
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
    const res = await getWorkspaceIdsAndTitles();
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

// make a per-node action for this
// make a global action for all nodes restore

export const loadLastBrowserStateForActiveNodes = async () => {
  const openWindows = await mapWindowsToNodes();

  // const decoratedWindowFinder = retryDecorator(findIt, {
  //   retries: 10,
  //   delay: 250,
  //   timeout: 5 * 1000,
  // });

  const allNodes = await getAllNodes();
  for (const node of allNodes) {
    const [lastBrowserState] = node.browserStates.slice(-1);
    // open windows which haven't already been opened in this node
    for (const window of lastBrowserState.windows) {
      // TOFIX compare hash of tab's URLs
      if (!windowAlreadyOpen(window, openWindows)) {
        // TOFIX
        // view dwm workspace for node (activate)
        await activateNode(node.nodeId);
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
  // verify that the node has all windows for the browser state open?
};

// -------------------------------------------

// Window { idTabFs, title, links[] }

// store dict: workspaceIds[] to Titles for firefox windows: wmctrl -l | g Firefox
// store Windows[].Links[] with TabFS $
// foreach Window
//   - find workspaceId where workspaceIdsToTitles.contains(w.title)
//  store workspaceId : Links[]

export const isTabActive = async (tab: Tab): Promise<boolean> => {
  try {
    const filepath = `/home/gr4yscale/TabFS/fs/mnt/tabs/last-focused/url.txt`;
    const contents = await fs.readFile(filepath, "utf8");
    return contents.trim() === tab.url;
  } catch (error) {
    // If file doesn't exist or can't be read, assume tab is not active
    return false;
  }
};

export type ActiveTabDetails = {
  url: string;
  text: string;
  title: string;
  body: string;
};

export const getActiveTabDetails =
  async (): Promise<ActiveTabDetails | null> => {
    try {
      const basePath = `/home/gr4yscale/TabFS/fs/mnt/tabs/last-focused`;

      const [url, text, title, body] = await Promise.all([
        fs.readFile(`${basePath}/url.txt`, "utf8"),
        fs.readFile(`${basePath}/text.txt`, "utf8"),
        fs.readFile(`${basePath}/title.txt`, "utf8"),
        fs.readFile(`${basePath}/body.html`, "utf8"),
      ]);

      return {
        url: url.trim(),
        text: text.trim(),
        title: title.trim(),
        body: body.trim(),
      };
    } catch (error) {
      // If any file doesn't exist or can't be read, return null
      return null;
    }
  };

// map Windows[].Links[] to workspaceIds[]

// foreach workspaceId
//   - find the Node associated with it
//   - store lists of Links in browserState
