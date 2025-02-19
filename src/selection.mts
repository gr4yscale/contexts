import { $ } from "zx";

export const rofiListSelect = async (
  list: string,
  prompt: string,
  prefilter?: string,
) => {
  $.verbose = false;
  //const selection =
  //  await $`echo ${list} | fzf `.nothrow();

  //const filterFlag = prefilter ? `-filter ${prefilter} ` : undefined

  const args = [
    "-monitor",
    "-1",
    "-normal-window",
    "-disable-history",
    "-matching fuzzy",
    "-dmenu",
    "-no-fixed-num-lines",
    "-i",
  ];

  if (prefilter) {
    args.push("-filter");
    args.push(prefilter);
  }

  args.push("-p");
  args.push(prompt);

  // TOFIX: -format flag

  const selection = await $`echo ${list} | rofi ${args}`.nothrow();

  //await $`echo ${list} | rofi -monitor -1 -normal-window -disable-history -matching fuzzy ${filterFlag} -dmenu -i -p ${prompt}`.nothrow();

  const sanitized =
    selection.stdout.trim().replace("*", "").replace("^", "").split(" ") ?? [];
  if (sanitized[0]) {
    return sanitized[0];
  }
};
