#!/usr/bin/env tsx

import { $, argv, sleep } from "zx";
import { spawn } from "child_process";
import clipboard from "clipboardy";
import {
  getState,
  loadState,
  storeState,
  createContext,
  updateCurrentContext,
  contextById,
  contextsActive,
  Context,
  ContextId,
} from "./state.mts";

// dwm
const findEmptyDwmTag = () => {
  const { dwmTags } = getState();
  for (let i = 1; i < dwmTags.length; i++) {
    console.log(`tag: ${i}, val: ${dwmTags[i]}`);
    if (!dwmTags[i]) {
      $`notify-send "Found empty dwm tag: ${i}"`;
      return i;
    }
  }
  return 0;
};

const assignEmptyDwmTag = async (context: Context) => {
  const { dwmTags } = getState();
  const tag = findEmptyDwmTag();
  context.dwmTag = tag;
  dwmTags[tag] = context.contextId;
};

const syncDwmTags = (contexts: Context[]) => {
  const { dwmTags } = getState();
  for (const c of contexts) {
    //console.log(`checking context ${c.contextId} to see if dwm tag is assigned`)
    if (c.dwmTag !== undefined && c.dwmTag < dwmTags.length) {
      dwmTags[c.dwmTag] = c.contextId;
    } else {
      console.log(`context did not have a dwm tag assigned: ${c.contextId}`);
    }
  }
};

const viewDwmTag = async (context: Context) => {
  if (context.dwmTag === undefined) {
    console.log("Error: context is without a DWM tag!");
    return;
  }
  await $`dwmc viewex ${context.dwmTag}`;
};

// lifecycle

const initContext = async (context: Context) => {

const activateContext = async (context: Context) => {
  if (context.dwmTag === undefined) {
    assignEmptyDwmTag(context);
  }

  await viewDwmTag(context);
  context.active = true;
};

const deactivateContext = async (context: Context) => {

// rofi
const rofiSelect = async (list: string, prompt: string) => {
	$.verbose = false
	const selection = await $`echo ${list} | rofi -monitor -1 -normal-window -disable-history -dmenu -i -p ${prompt}`
	const sanitized = selection.stdout.trim().replace('*', '').split(' ')
	if (sanitized[0]) {
		return sanitized[0]
	}
}


// commands
const listRecentContexts = async () => {
  const contexts = getState().contexts;
  const sorted = contexts.sort(
    (l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime(),
  );
  const mapped = sorted.map((c) => {
    const activeMarker = c.active ? "*" : "";
    const contextId = c.contextId + activeMarker;
    return contextId.padEnd(64, " ") + c.tags.join(",");
  });
  return mapped.length > 0
    ? mapped.reduce((prev, item) => prev + "\n" + item)
    : "";
};

const selectRecentContextId = async (prompt: string) => {
  const recentList = await listRecentContexts();
  return await rofiSelect(recentList, prompt ?? "context: ");
};

const selectRecentContext = async (prompt: string) => {
  const contextId = await selectRecentContextId(prompt);
  if (contextId) {
    return contextById(contextId);
  }
};

// commands
const switchContextRofi = async () => {
  const selectedContextId = await selectRecentContextId("select context:");
  if (selectedContextId) {
    await switchContext(selectedContextId);
  }
};

const switchContext = async (id: ContextId) => {
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

const handleCommand = async (command: string | undefined) => {
  if (!command) {
    console.log("Error: You must specify the --command arg");
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
try {
  loadState();
  syncDwmTags(contextsActive());
  await handleCommand(argv.command);
} catch (e) {
  console.error(e);
}
