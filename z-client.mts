#!/usr/bin/env tsx

import { argv } from "zx";
import { UnixDgramSocket } from "unix-dgram-socket";

const socket = new UnixDgramSocket();

socket.on("error", (error: any) => {
  console.log(error);
});

socket.on("connect", (path: string) => {
  console.log(`socket connected: ${path}`);
});

socket.connect("/tmp/contexts.sock");

if (argv.command) {
  socket.send(argv.command);
} else {
  console.error("Error: You must specify a command.");
}

socket.close();
