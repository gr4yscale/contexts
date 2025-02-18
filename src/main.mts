#!/usr/bin/env tsx

import { createServer, Socket } from "net";
import { $, fs } from "zx";
import { createElement } from "react";
import { render } from "ink";

import { initializeDB } from "./db.mts";
import { handleCommand } from "./handleCommand.mts";

// import { getState, loadState } from "./state.mts";
// import { activitiesActive } from "./activityList.mts";

//import { syncWorkspaces } from "./workspaces.mts";

import Root from "./ui/common/Root.tsx";

fs.removeSync("/tmp/contexts.sock");

const server = createServer((socket: Socket) => {
  socket.setEncoding("utf8");
  socket.on("data", async (data: string) => {
    try {
      let response;
      // TOFIX: lock while existing command is being handled
      if (data.includes("|")) {
        const cmd = data.split("|")[0];
        const args = data.split("|")[1];
        response = await handleCommand(cmd, args);
      } else {
        response = await handleCommand(data);
      }
      if (response) {
        console.log(response);
        socket.write(response);
      }
    } catch (e) {
      const msg = `Activities: Error handling command ${data}!`;
      $`notify-send "${msg}"`;
      console.log(msg);
      console.log(e);
    }
  });
});

server.listen("/tmp/contexts.sock", () => {
  //console.error("Server is listening");
});

try {
  await initializeDB();
} catch (e) {
  $`notify-send "Activities: unhandled error occurred."`;
  console.error(e);
}

$.verbose = false; // suppress stdout from zx subprocess calls

// handleCommand("storeBrowserStates");

// setInterval(
//   () => {
//     handleCommand("storeBrowserStates");
//   },
//   15 * 60 * 1000,
// );

render(createElement(Root, null));
