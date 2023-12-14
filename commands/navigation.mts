import { $ } from "zx";

import {
  getState,
  createContext,
  updateCurrentContext,
  contextById,
  Context,
  ContextId,
} from "../state.mts";

import { activateWorkspace } from "../workspaces.mts";

import { rofiListSelectRecentContexts } from "../ui.mts";

// context switching
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

  await activateWorkspace(context);
};

// windows
export const sendWindowToAnotherContext = async () => {
  const context = await selectRecentContext("send to context:");
  if (context) {
    console.log(`sending window to ${context.dwmTag}: ${context.contextId}`);
    await $`dwmc tagex ${context.dwmTag}`;
    context.lastAccessed = new Date();
  }
};

// monitor selection

// util
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
