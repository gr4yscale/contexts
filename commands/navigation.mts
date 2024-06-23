import { $ } from "zx";

import {
  getState,
  createContext,
  updateCurrentContext,
  contextById,
  Context,
  ContextId,
} from "../state.mts";

import { allocateWorkspace } from "../workspaces.mts";

import { rofiListSelectRecentContexts } from "../ui.mts";

// context switching
export const switchContext = async (prompt: string, prefilter?: string) => {
  const selectedContextId = await selectRecentContextId(prompt, prefilter);
  if (selectedContextId) {
    await activateContext(selectedContextId);
  }
};

// todo: overload this with contextId or Context
export const activateContext = async (id: ContextId) => {
  const previousContext = getState().currentContext;

  let context: Context | undefined;
  context = contextById(id);
  if (!context) {
    console.log(`context not found, creating for id: ${id}`);
    context = createContext(id);
    $`notify-send "Created new context: ${id}"`;
  }

  if(await allocateWorkspace(context)) {
    // todo: indempotency
    updateCurrentContext(context);
    updatePreviousContext(previousContext);
    context.lastAccessed = new Date();
    console.log('activated ' + context.name)
    $`notify-send -a context -t 500 "Activated context: ${context.name}; ws: ${context.dwmTag}"`;
  }
};

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
const selectRecentContextId = async (prompt: string, prefilter?: string) => {
  const { contexts } = getState();
  return await rofiListSelectRecentContexts(
    contexts,
    prompt ?? "recent context: ",
    prefilter
  );
};

const selectRecentContext = async (prompt: string) => {
  const contextId = await selectRecentContextId(prompt);
  if (contextId) {
    return contextById(contextId);
  }
};
