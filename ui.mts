import { $ } from "zx";
import { Context } from "./state.mts";
import { formatDistanceToNow } from "date-fns";

export const rofiListSelect = async (list: string, prompt: string) => {
  $.verbose = false;
  const selection =
    await $`echo ${list} | rofi -monitor -1 -disable-history -dmenu -i -p ${prompt}`.nothrow();
  const sanitized = selection.stdout.trim().replace("*", "").split(" ") ?? [];

  const args = ['-monitor',
    '-1','-normal-window','-disable-history', '-matching fuzzy', '-dmenu', '-no-fixed-num-lines', '-i' ]

  if (prefilter) {
    args.push('-filter')
    args.push(prefilter)
  }

  args.push('-p')
  args.push(prompt)

  // TOFIX: -format flag

  const selection = await $`echo ${list} | rofi ${args}`.nothrow();
  const sanitized = selection.stdout.trim().replace("*", "").replace("^","").split(" ") ?? [];
  if (sanitized[0]) {
    return sanitized[0];
  }
};

const formatRecentContextsList = async (contexts: Context[]) => {
  const sorted = contexts.sort(
    (l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime(),
  );
  const mapped = sorted.map((c) => {
    const activeMarker = c.active ? "*" : "";
    const contextId = c.contextId + activeMarker;
    const tags = c.tags.join(",");
    return `${contextId.padEnd(64, " ")}  ${tags}`;
  });
  return mapped.length > 0
    ? mapped.reduce((prev, item) => prev + "\n" + item)
    : "";
};

const formatRecentContextsListExtended = async (contexts: Context[]) => {
  const sorted = contexts.sort(
    (l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime(),
  );
  const mapped = sorted.map((c) => {
    const activeMarker = c.active ? "*" : "";
    const contextId = c.contextId + activeMarker;
    const tags = c.tags.join(",").padEnd(36, " ");
    const accessed = formatDistanceToNow(c.lastAccessed, {
      includeSeconds: true,
    });
    return `${contextId.padEnd(56, " ")}  ${tags}  ${accessed}`;
  });
  return mapped.length > 0
    ? mapped.reduce((prev, item) => prev + "\n" + item)
    : "";
};

export const rofiListSelectRecentContexts = async (
  contexts: Context[],
  prompt: string,
) => {
  const list = await formatRecentContextsList(contexts);
  return await rofiListSelect(list, prompt);
export const rofiListSelectRecentActiveContexts = async (
  contexts: Context[],
  prompt: string,
  prefilter?: string
) => {
  const activeContexts = contexts.filter(c => c.active === true)
  const list = await formatContextsList(activeContexts);
  return await rofiListSelect(list, prompt, prefilter);
};
