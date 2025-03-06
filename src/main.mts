#!/usr/bin/env tsx

import { createServer, Socket } from "net";
import { $, fs } from "zx";
import { createElement } from "react";
import { render } from "ink";

import { initializeDB } from "./db.mts";

import "./actions/base.mts";
import "./actions/navigation.mts";
import "./actions/currentActivity.mts";
import "./actions/resource.mts";

import { executeAction } from "./actions.mts";

import Root from "./ui/common/Root.tsx";

$.verbose = false; // suppress stdout from zx subprocess calls

fs.removeSync("/tmp/contexts.sock");

const server = createServer((socket: Socket) => {
  socket.setEncoding("utf8");
  socket.on("data", async (data: string) => {
    try {
      await executeAction(data);
      // TOFIX argument parsing
      // TOFIX action responses
    } catch (e) {
      const msg = `Error executing action ${data}!`;
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
  $`notify-send "Database initialization error occurred."`;
  console.error("Database initialization error:", e);
}

render(createElement(Root, null));

// setInterval(
//   () => {
//     handleCommand("storeBrowserStates");
//   },
//   15 * 60 * 1000,
// );
