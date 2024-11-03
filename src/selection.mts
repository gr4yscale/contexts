import { $ } from "zx";
import { Activity } from "./state.mts";
import { formatActivitiesListExtended } from "./activityList.mts";

export const rofiListSelect = async (list: string, prompt: string, prefilter?: string) => {
  $.verbose = false;
  //const selection =
  //  await $`echo ${list} | fzf `.nothrow();

  //const filterFlag = prefilter ? `-filter ${prefilter} ` : undefined

  const args = ['-monitor',
    '-1', '-normal-window', '-disable-history', '-matching fuzzy', '-dmenu', '-no-fixed-num-lines', '-i']

  if (prefilter) {
    args.push('-filter')
    args.push(prefilter)
  }

  args.push('-p')
  args.push(prompt)

  // TOFIX: -format flag

  const selection = await $`echo ${list} | rofi ${args}`.nothrow();

  //await $`echo ${list} | rofi -monitor -1 -normal-window -disable-history -matching fuzzy ${filterFlag} -dmenu -i -p ${prompt}`.nothrow();

  const sanitized = selection.stdout.trim().replace("*", "").replace("^", "").split(" ") ?? [];
  if (sanitized[0]) {
    return sanitized[0];
  }
};


export const rofiListSelectRecentActivities = async (
  activities: Activity[],
  prompt: string,
  prefilter?: string
) => {
  const formatted = await formatActivitiesListExtended(activities);
  const stringified = formatted.length > 0 ? formatted.reduce((prev, item) => prev + "\n" + item) : "";

  return await rofiListSelect(stringified, prompt, prefilter);
};


// export const rofiListSelectRecentActivities = async (
//   activities: Activity[],
//   prompt: string,
//   prefilter?: string
// ) => {
//   const list = await formatActivitiesListExtended(activities);
//   const stringified = list.length > 0 ? list.reduce((prev, item) => prev + "\n" + item) : "";

//   return await rofiListSelect(stringified, prompt, prefilter);
// };
