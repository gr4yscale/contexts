import React from "react";
import { Box, useInput, useStdout } from "ink";
import { getState } from "../../state.mts";
import useRoutes from "./useRoutes.mts";
import { KeysContext } from "./Context.mts";

import { Keymap } from "./Keymapping.mts";

import Activity from "../Activity.tsx";
import Workspace from "../Workspace.tsx";
import WhichKey from "../WhichKey.tsx";

const routes = [
  { path: "/", component: Activity },
  { path: "/activity", component: Activity },
  { path: "/workspace", component: Workspace },
];

const Root: React.FC = () => {
  const { write } = useStdout();
  const { Component, navigate } = useRoutes(routes);

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

  return (
    <KeysContext.Provider value={{ state: getState(), keymap }}>
      <Box>
        {Component && (
          <Component navigate={navigate} pushKeymap={keymap.pushKeymap} />
        )}
      </Box>
      <Box>
        <WhichKey />
      </Box>
    </KeysContext.Provider>
  );
};

export default Root;
