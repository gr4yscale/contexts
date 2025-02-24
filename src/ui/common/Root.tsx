import React, { useState, useEffect } from "react";
import { Box, useInput, useStdout } from "ink";
import { KeysContext } from "./Context.mts";

import { Keymap, key } from "./Keymapping.mts";

import Activity from "../Activity.tsx";
import Workspace from "../Workspace.tsx";
import WhichKey from "../WhichKey.tsx";
import Home from "../Home.tsx";

import {
  registerCommandListener,
  unregisterCommandListener,
} from "../../handleCommand.mts";

const routes = [
  { path: "/", component: Home },
  { path: "/activity", component: Activity },
  { path: "/workspace", component: Workspace },
];

// define root keymap
const keymap = Keymap([]);

const Root: React.FC = () => {
  const [routePath, setRoutePath] = useState("/");
  const { write } = useStdout();

  // global key handling
  useInput((input, key) => {
    const result = keymap.handleKeyEvent(input, key);
    if (result) {
      if (result.handler) {
        result.handler();
      }
    } else {
      write(`unhandled input received: ${input}`);
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
          description: "Show Activities",
          name: "activities-show",
          handler: () => setRoutePath("/activity"),
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
