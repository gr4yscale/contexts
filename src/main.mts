#!/usr/bin/env tsx

import { createServer, Socket } from "net";
import { $, fs } from "zx";

import { loadState, activitiesActive } from "./state.mts";
import { handleCommand } from "./handleCommand.mts";
import { syncWorkspaces } from "./workspaces.mts";

fs.removeSync('/tmp/contexts.sock')

const server = createServer((socket: Socket) => {
  socket.setEncoding("utf8");
  socket.on("data", async (data: string) => {
    try {
      // TOFIX: lock while existing command is being handled
      if (data.includes('|')) {
	const cmd = data.split('|')[0]
	const args = data.split('|')[1]
	const response = await handleCommand(cmd, args);
	if (response) {
	  socket.write(response) 
	}
      } else {
	await handleCommand(data);
      }
    } catch (e) {
      const msg = `Activities: Error handling command ${data}!`;
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
  await loadState();
  syncWorkspaces(activitiesActive());
} catch (e) {
  $`notify-send "Activities: unhandled error occurred."`;
  console.error(e);
}
