import React, { useState } from "react";
import { Box, useInput, useStdout } from "ink";
import { KeysContext } from "./Context.mts";

import { Keymap } from "./Keymapping.mts";

import Activity from "../Activity.tsx";
import Workspace from "../Workspace.tsx";
import WhichKey from "../WhichKey.tsx";

const routes = [
  { path: "/", component: Workspace },
  { path: "/activity", component: Activity },
  { path: "/workspace", component: Workspace },
];

const Root: React.FC = () => {
  const [routePath, setRoutePath] = useState("/");
  const { write } = useStdout();

  const keymap = Keymap([]);

  useInput((input, key) => {
    const result = keymap.handleKeyEvent(input, key);
    if (result) {
      if (result.command) {
        result.command.handler();
      }
    } else {
      write(`unhandled input received: ${input}  ${key}`);
    }
  });

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
