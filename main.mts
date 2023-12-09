#!/usr/bin/env tsx

import { argv } from "zx";
import { loadState, contextsActive } from "./state.mts";
import { handleCommand } from "./commands.mts";
import { syncWorkspaces } from "./workspaces.mts";

try {
  loadState();
  syncWorkspaces(contextsActive());
  await handleCommand(argv.command);
} catch (e) {
  console.error(e);
}
