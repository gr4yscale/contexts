import { $ } from "zx";

import { getState, Context } from "./state.mts";

const { dwmTags } = getState() 

export const findEmptyWorkspace = () => {
  for (let i = 1; i < dwmTags.length; i++) {
    if (!dwmTags[i] || dwmTags[i] === 'available') {
      console.log(`found ${i}`)
      return i;
    }
  }
  return 0;
};

const availableWorkspacesCount = () => {
  const a = 29 - (dwmTags.filter(ws => ws === ws).length)
  return a
}

export const assignEmptyWorkspace = async (context: Context) => {
  const ws = findEmptyWorkspace();

  if (ws > 0) {
    context.dwmTag = ws;
    dwmTags[ws] = context.contextId;
    $`notify-send "context ${context.name} allocated workspace\navailable: ${availableWorkspacesCount()}"`;
    return true
  } else {
    context.dwmTag = undefined;
    $`notify-send "Was unable to find an available workspace; cancelled"`;
    return false
  }
};

export const syncWorkspaces = (contexts: Context[]) => {
  for (const c of contexts) {
    if (!c.dwmTag) { return }
    if (c.dwmTag > dwmTags.length) { return }
    if (c.dwmTag === undefined || c.dwmTag === 0) { // every restart of contexts frees dwm tag for contexts which got assigned to 0 
      dwmTags[c.dwmTag] = 'available'
      c.dwmTag = undefined
    } else {
      dwmTags[c.dwmTag] = c.contextId;
    }
  }
};

export const viewWorkspace = async (context: Context) => {
  if (context.dwmTag === undefined || context.dwmTag === 0) { return false; }
  await $`dwmc viewex ${context.dwmTag}`;
  return true
};

export const allocateWorkspace = async (context: Context) => {
  //TOFIX: handle case of not finding an available dwm tag
  if (context.dwmTag === undefined || context.dwmTag === 0) {
    console.log(`Context needs a workspace allocated: ${context.name}`);
    if (availableWorkspacesCount() > 1) {
      await assignEmptyWorkspace(context)
    } else {
      $`notify-send "Available workspaces = 0; cancelling"`;
    }
  }

  if (await viewWorkspace(context)) {
    context.active = true; // TOFIX: make this a computed value
    return true
  }
  return false
};

export const deallocateWorkspace = async (context: Context) => {
  // rename dwm tag to "unused" or empty
  if (context.dwmTag) {
    // confirm ui?
    dwmTags[context.dwmTag] = 'available'
    context.dwmTag = undefined
  }
  context.active = false;
  // last accessed?
  // close clients?
  // rename dwm tag with dwmc
  $`notify-send "Context ${context.name} freed workspace\navailable: ${availableWorkspacesCount()}"`;
};
