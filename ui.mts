import { $ } from "zx";
import { Context } from "./state.mts";

export const rofiListSelect = async (list: string, prompt: string) => {
  $.verbose = false;
  const selection =
    await $`echo ${list} | rofi -monitor primary -normal-window -disable-history -dmenu -i -p ${prompt}`.nothrow();
  const sanitized = selection.stdout.trim().replace("*", "").split(" ") ?? [];
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
    return contextId.padEnd(64, " ") + c.tags.join(",");
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
};
