#!/usr/bin/env tsx

import { createServer, Socket } from "net";
import { $, fs } from "zx";

import { activitiesActive, getState, loadState } from "./state.mts";
import { handleCommand } from "./handleCommand.mts";
import { syncWorkspaces } from "./workspaces.mts";

fs.removeSync('/tmp/contexts.sock')

const server = createServer((socket: Socket) => {
  socket.setEncoding("utf8");
  socket.on("data", async (data: string) => {
    try {
      let response
      // TOFIX: lock while existing command is being handled
      if (data.includes('|')) {
        const cmd = data.split('|')[0]
        const args = data.split('|')[1]
        response = await handleCommand(cmd, args);
      } else {
        response = await handleCommand(data);
      }
      if (response) {
        console.log(response)
        socket.write(response)
      }

      //const activeActivities = activitiesActive(getState().activities)
      //const activityIds = activeActivities.map(a => a.activityId)

      //console.log(' activityIds:    *****')
      //console.log(activityIds)

      //console.log(' dwmTags:    *****')
      const dwmTags = getState().dwmTags.toString()
      console.log(dwmTags)

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
  // TODO
  const activeActivities = activitiesActive(getState().activities)
  syncWorkspaces(activeActivities);
} catch (e) {
  $`notify-send "Activities: unhandled error occurred."`;
  console.error(e);
}
