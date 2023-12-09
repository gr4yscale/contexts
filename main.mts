#!/usr/bin/env tsx

import { createServer, Socket } from "net";
import { $ } from "zx";

import { loadState, contextsActive } from "./state.mts";
import { handleCommand } from "./commands.mts";
import { syncWorkspaces } from "./workspaces.mts";

const server = createServer((socket: Socket) => {
  socket.setEncoding("utf8");
  socket.on("data", async (data: string) => {
    try {
      await handleCommand(data);
    } catch (e) {
      const msg = `Contexts: Error handling command ${data}!`;
      $`notify-send "${msg}"`;
      console.error(msg);
      console.error(e);
    }
  });
});

server.listen("/tmp/contexts.sock", () => {
  console.log("Server is listening");
});

try {
  loadState();
  syncWorkspaces(contextsActive());
} catch (e) {
  $`notify-send "Contexts: unhandled error occurred."`;
  console.error(e);
}
