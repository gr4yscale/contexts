import React, { useState, useEffect } from "react";
import { Box, useInput, useStdout } from "ink";
import { KeysContext } from "./Context.mts";

import { Keymap, key } from "./Keymapping.mts";

import Activity from "../Activity.tsx";
import Workspace from "../Workspace.tsx";
import WhichKey from "../WhichKey.tsx";
import Home from "../Home.tsx";

import {
  registerShowHomeListener,
  unregisterShowHomeListener,
} from "../../commands/navigation.mts";

const routes = [
  { path: "/", component: Home },
  { path: "/activity", component: Activity },
  { path: "/workspace", component: Workspace },
];

const Root: React.FC = () => {
  const [routePath, setRoutePath] = useState("/");
  const { write } = useStdout();

  // define root keymap
  const keymap = Keymap([]);

  // listen for "showHome" command coming via unix socket
  useEffect(() => {
    console.log("showHome listener useEffect");

    const listener = () => {
      setRoutePath("/");
      console.log("showHome was called!");
    };

    registerShowHomeListener(listener);

    return () => {
      unregisterShowHomeListener(listener);
    };
  }, []);

  // update the keymap when route changes
  useEffect(() => {
    console.log("route change useEffect");

    keymap.pushKeymap([
      {
        sequence: [key("w")],
        description: "Show Workspaces",
        command: {
          name: "workspaces-show",
          handler: () => {
            //keymap.popKeymap();
            setRoutePath("/workspace");
          },
        },
      },
      {
        sequence: [key("a")],
        description: "Show Activities",
        command: {
          name: "activities-show",
          handler: () => {
            //keymap.popKeymap();
            setRoutePath("/activity");
          },
        },
      },
    ]);

    return () => {
      //keymap.popKeymap();
    };
  }, [routePath]); //TOFIX this shouldn't be needed?

  //}, []);

  // global key handling
  useInput((input, key) => {
    const result = keymap.handleKeyEvent(input, key);
    if (result) {
      if (result.command) {
        result.command.handler();
      }
    } else {
      write(`unhandled input received: ${input}`);
    }
  });

  const route = routes.find((r) => r.path === routePath);
  const Component = route ? route?.component : null;

  console.log("rendering root");

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
