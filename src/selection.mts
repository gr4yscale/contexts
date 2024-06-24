import { $ } from "zx";
import { Context } from "./state.mts";
import { formatDistanceToNow } from "date-fns";

export const rofiListSelect = async (list: string, prompt: string, prefilter?: string) => {
  $.verbose = false;
  //const selection =
  //  await $`echo ${list} | fzf `.nothrow();

  //const filterFlag = prefilter ? `-filter ${prefilter} ` : undefined

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

  //await $`echo ${list} | rofi -monitor -1 -normal-window -disable-history -matching fuzzy ${filterFlag} -dmenu -i -p ${prompt}`.nothrow();

  const sanitized = selection.stdout.trim().replace("*", "").replace("^","").split(" ") ?? [];
  if (sanitized[0]) {
    return sanitized[0];
  }
};

const formatContextsList = async (contexts: Context[]) => {
  // TOFIX: abstract sorting and filtering into a reuseable module; check for query lang libs
  const sorted = contexts.sort(
    (l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime(),
  );
  const mapped = sorted.map((c) => {
    // TOFIX: consider & for sticky contexts
    //        but then what about active *and* sticky contexts?
    //        maybe sticky contexts *must* be initialized to be valid?
    //        ie, can't deactivate a context until it is also no longer sticky

    let marker = c.active ? "*" : "^";
   
    // if (c.tags.includes('sticky')) {
    //   marker = '%'
    // }
    const contextId = c.contextId + marker;
    const tags = c.tags.join(",");
    return `${contextId.padEnd(80, " ")}  ${tags}`;
  });
  return mapped.length > 0
    ? mapped.reduce((prev, item) => prev + "\n" + item)
    : "";
};

const formatContextsListExtended = async (contexts: Context[]) => {
  // TOFIX: abstract sorting and filtering into a reuseable module; check for query lang libs
  const sorted = contexts.sort(
    (l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime(),
  );
  const mapped = sorted.map((c) => {
    // TOFIX: consider & for sticky contexts
    //        but then what about active *and* sticky contexts?
    //        maybe sticky contexts *must* be initialized to be valid?
    //        ie, can't deactivate a context until it is also no longer sticky

    let marker = c.active ? "*" : "^";
   
    // if (c.tags.includes('sticky')) {
    //   marker = '%'
    // }
    const contextId = c.contextId + marker;
    const tags = c.tags.join(",").substring(0, 32).padEnd(32, ' ')
    //TOFIX absoutely atrocious
    const lastAccessed = formatDistanceToNow(c.lastAccessed, {includeSeconds: true }).replace('about ', '').replace('days', 'days').replace('day', 'day').replace('minutes', 'mins').replace('minute', 'min').replace('less than a', '<').replace('less than', '<').replace('seconds', 'secs')

    return `${contextId.padEnd(36, " ")}  ${tags}  ${lastAccessed}`;
  });
  return mapped.length > 0
    ? mapped.reduce((prev, item) => prev + "\n" + item)
    : "";
};

export const rofiListSelectRecentContexts = async (
  contexts: Context[],
  prompt: string,
  prefilter?: string
) => {
  const list = await formatContextsListExtended(contexts);
  return await rofiListSelect(list, prompt, prefilter);
};

// TOFIX: pass in predicate
export const rofiListSelectRecentActiveContexts = async (
  contexts: Context[],
  prompt: string,
  prefilter?: string
) => {
  const activeContexts = contexts.filter(c => c.active === true)
  const list = await formatContextsList(activeContexts);
  return await rofiListSelect(list, prompt, prefilter);
};
