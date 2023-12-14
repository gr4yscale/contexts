import { $ } from "zx";

import { getState, Context } from "./state.mts";

export const findEmptyWorkspace = () => {
  const { dwmTags } = getState();
  for (let i = 1; i < dwmTags.length; i++) {
    console.log(`tag: ${i}, val: ${dwmTags[i]}`);
    if (!dwmTags[i] || dwmTags[i] === "available") {
      $`notify-send "Found available dwm tag: ${i}"`;
      return i;
    }
  }
  $`notify-send "Was unable to find an available dwm tag, using 0"`;
  return 0;
};

export const assignEmptyWorkspace = async (context: Context) => {
  const { dwmTags } = getState();
  const tag = findEmptyWorkspace();
  context.dwmTag = tag;
  dwmTags[tag] = context.contextId;
};

export const syncWorkspaces = (contexts: Context[]) => {
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

export const viewWorkspace = async (context: Context) => {
  if (context.dwmTag === undefined) {
    console.log("Error: context is without a DWM tag!");
    return;
  }
  await $`dwmc viewex ${context.dwmTag}`;
};

export const activateWorkspace = async (context: Context) => {
  //TOFIX: handle case of not finding an available dwm tag
  if (context.dwmTag === undefined) {
    assignEmptyWorkspace(context);
  }

  await viewWorkspace(context);
  context.active = true;
};

export const deactivateWorkspace = async (context: Context) => {
  // confirm ui?
  await viewWorkspace(context);
  // rename dwm tag to "unused" or empty
  if (context.dwmTag) {
    getState().dwmTags[context.dwmTag] = "available";
    context.dwmTag = undefined;
  }
  context.active = false;
  // last accessed?
  // close clients?
  // save contexts.yml
};
