import { $ } from "zx";
import { spawn } from "child_process";

import { getState } from "../state.mts";

export const viewEmacsBookmarks = (emacsDaemon: string) => {
  const context = getState().currentContext;
  if (!context.orgBookmarks || !context.orgBookmarks.length) {
    $`notify-send "No Emacs bookmarks for current context."`;
    return;
  }
  for (let i = 0; i < context.orgBookmarks.length; i++) {
    const bm = context.orgBookmarks[i];
    const evalArg = '(burly-open-bookmark "' + bm + '")';
    const child = spawn(
      `/usr/bin/emacsclient`,
      ["-c", "-s", `'${emacsDaemon}'`, "--eval", evalArg],
      { detached: true, stdio: "ignore" },
    );
    child.unref();
  }
};
