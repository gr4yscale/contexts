import { $, argv, sleep } from "zx";
import clipboard from "clipboardy";
import { spawn } from "child_process";

import {
  getState,
  storeState,
  createContext,
  updateCurrentContext,
  contextById,
  Context,
  ContextId,
} from "./state.mts";

import { assignEmptyWorkspace, viewWorkspace } from "./workspaces.mts";

import { rofiListSelect, rofiListSelectRecentContexts } from "./ui.mts";

// plugins
//   - get callbacks for things like contextSwitched, workspaceSwitched, menuSelected(menuKey)
//   - handle things like emacs bookmarks

const selectRecentContextId = async (prompt: string) => {
  const { contexts } = getState();
  return await rofiListSelectRecentContexts(
    contexts,
    prompt ?? "recent context: ",
  );
};

const selectRecentContext = async (prompt: string) => {
  const contextId = await selectRecentContextId(prompt);
  if (contextId) {
    return contextById(contextId);
  }
};
export const switchContextRofi = async () => {
  const selectedContextId = await selectRecentContextId("select context:");
  if (selectedContextId) {
    await switchContext(selectedContextId);
  }
};

export const switchContext = async (id: ContextId) => {
  let context: Context | undefined;
  context = contextById(id);
  if (!context) {
    console.log(`context not found, creating for id: ${id}`);
    context = createContext(id);
    $`notify-send "Created new context: ${id}"`;
  }

  updateCurrentContext(context);

  context.lastAccessed = new Date();

  await activateContext(context);
};

export const sendWindowToAnotherContext = async () => {
  const context = await selectRecentContext("send to context:");
  if (context) {
    console.log(`sending window to ${context.dwmTag}: ${context.contextId}`);
    await $`dwmc tagex ${context.dwmTag}`;
  }
  context.lastAccessed = new Date();
};

// link groups
export const linkGroupLoad = async () => {
  const { currentContext } = getState();
  if (!currentContext || !currentContext.linkGroups[0]) {
    return;
  }
  const links = currentContext.linkGroups[0].links;
  const mapped = links.map((l) => l.url);
  const list = mapped.reduce((prev, item) => prev + "\n" + item);
  const selected = await rofiListSelect(list, "link group: ");
  await $`firefox --new-window ${selected}`;
};

export const linkGroupStore = async () => {
  await $`xdotool key "Control_L+F12"`;
  await sleep(100);
  const t = clipboard.readSync();
  console.log(t);
};

// emacs
const viewEmacsBookmarks = (context: Context, emacsDaemon: string) => {
  for (let i = 0; i < context.orgBookmarks.length; i++) {
    const bm = context.orgBookmarks[i];
    const evalArg = '(burly-open-bookmark "' + bm + '")';
    const child = spawn(
      `/usr/bin/emacsclient`,
      ["-c", "-s", `'${emacsDaemon}'`, "--eval", evalArg],
      { detached: true, stdio: "ignore" },
    );
    child.unref();
  }
};

// lifecycle
// TODO give plugins lifecycle hooks
const initContext = async (context: Context) => {
  if (context.orgBookmarks) {
    viewEmacsBookmarks(context, "org");
  }
  // emacs bookmarks
  // run scripts
};

const activateContext = async (context: Context) => {
  if (context.dwmTag === undefined) {
    assignEmptyWorkspace(context);
  }

  await viewWorkspace(context);
  context.active = true;
};

const deactivateContext = async (context: Context) => {
  await viewWorkspace(context);
  context.active = false;
  // confirm?
  // save contexts.yml
  // close clients?
};

export const handleCommand = async (command: string | undefined) => {
  if (!command) {
    console.error("Error: You must specify a command.");
    return;
  }

  switch (command) {
    case "switchContextRofi": {
      await switchContextRofi();
      storeState();
      break;
    }
    case "switchContext": {
      await switchContext(argv.contextId);
      storeState();
      break;
    }
    case "sendWindowToAnotherContext": {
      await sendWindowToAnotherContext();
      break;
    }
    case "currentContextInit": {
      await initContext(getState().currentContext);
      break;
    }
    case "currentContextMenu": {
      // TODO
      break;
    }
    case "linkGroupLoad": {
      await linkGroupLoad();
      break;
    }
    case "linkGroupStore": {
      await linkGroupStore();
      storeState();
      break;
    }
    case "pruneInactiveContexts": {
      // TODO
      // prompt user for deactivating contexts per dwmTag
      // store bookmarks, command snippets, etc for deactivated contexts
      break;
    }
    default: {
      console.error("command not recognized");
    }
  }
};
