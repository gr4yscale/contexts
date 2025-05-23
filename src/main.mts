#!/usr/bin/env tsx

import { createServer, Socket } from "net";
import { $, fs } from "zx";
import { createElement } from "react";
import { render } from "ink";

import * as logger from "./logger.mts";
import { initializeDB } from "./db.mts";

import "./actions/base.mts";
import "./actions/navigation.mts";
import "./actions/currentActivity.mts";
import "./actions/resource.mts";
import "./actions/activity-bulk.mts";

import { executeAction } from "./actions.mts";

import Root from "./ui/common/Root.tsx";

$.verbose = false; // suppress stdout from zx subprocess calls

// Initialize logger
logger.configureLogger({
  level: logger.LogLevel.DEBUG,
});

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
      logger.error(msg, e);
      logger.error(e);
    }
  });
});

server.listen("/tmp/contexts.sock", () => {
  logger.info("Server is listening on /tmp/contexts.sock");
});

try {
  await initializeDB();
  logger.info("Database initialized successfully");
} catch (e) {
  $`notify-send "Database initialization error occurred."`;
  logger.error("Database initialization error:", e);
}

// write to an alternate screen, to preserve previous terminal contents
process.stdout.write("\x1b[?1049h");

// ui render loop
const instance = render(createElement(Root, null));

// restore previous terminal contents
await instance.waitUntilExit();
process.stdout.write("\x1b[?1049l");
