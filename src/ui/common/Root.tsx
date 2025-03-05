import React, { useState, useEffect } from "react";
import { Box, useInput } from "ink";
import { KeysContext } from "./Context.mts";

import { Keymap, key } from "./Keymapping.mts";

import ActivityRoot from "../ActivityRoot.tsx";
import ActivitySelection from "../ActivitySelection.tsx";
//import ActivityNavigate from "../ActivityNavigate.tsx";
import Workspace from "../Workspace.tsx";
import WhichKey from "../WhichKey.tsx";
import Home from "../Home.tsx";

import {
  registerCommandListener,
  unregisterCommandListener,
} from "../../handleCommand.mts";

const routes = [
  { path: "/", component: Home },
  { path: "/activity", component: ActivityRoot },
  { path: "/activitySelection", component: ActivitySelection },
  { path: "/workspace", component: Workspace },
];

// define root keymap
const keymap = Keymap([]);

const Root: React.FC = () => {
  const [routePath, setRoutePath] = useState("/");

  // global key handling
  useInput((input, key) => {
    const result = keymap.handleKeyEvent(input, key);
    if (result) {
      if (result.handler) {
        result.handler();
      }
    } else {
      // unhandled key event
      // console.log (info level)
    }
  });

  // listen for "showHome" command coming via unix socket
  useEffect(() => {
    const listener = (command: string) => {
      // TOFIX: check command type in handleCommand
      if (command === "globalLeader") {
        setRoutePath("/");
      }
    };

    registerCommandListener(listener);

    return () => {
      unregisterCommandListener(listener);
    };
  }, []);

  // define root keymap
  useEffect(() => {
    if (routePath === "/") {
      keymap.pushKeymap([
        {
          sequence: [key("w")],
          description: "Show Workspaces",
          name: "workspaces-show",
          handler: () => setRoutePath("/workspace"),
        },
        {
          sequence: [key("a")],
          description: "Activities",
          name: "show-activities-root",
          handler: () => setRoutePath("/activity"),
        },
        {
          sequence: [key("s")],
          description: "Select Activities",
          name: "activities-select",
          handler: () => setRoutePath("/activitySelection"),
        },
      ]);
    }

    return () => {
      keymap.popKeymap();
    };
  }, [routePath]);

  const route = routes.find((r) => r.path === routePath);
  const Component = route ? route?.component : null;

  return (
    <KeysContext.Provider value={{ keymap }}>
      <Box>{Component && <Component />}</Box>
      <Box>
        <WhichKey />
      </Box>
    </KeysContext.Provider>
  );
};

export default Root;
