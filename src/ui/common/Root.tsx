import React, { useState, useEffect } from "react";
import { Box, useInput } from "ink";
import { KeysContext } from "./Context.mts";

import { Keymap, key } from "./Keymapping.mts";

import {
  registerActionListener,
  unregisterActionListener,
} from "../../actions.mts";

import Home from "../Home.tsx";
import WhichKey from "../WhichKey.tsx";

import ActivityRoot from "../ActivityRoot.tsx";
import ActivityNavigate from "../ActivityNavigate.tsx";
import ContextActivitySelection from "../ContextActivitySelection.tsx";
import CurrentActivityActions from "../CurrentActivityActions.tsx";
import ActionExecute from "../ActionExecute.tsx";

// consider adding props here that would set initial state of ActivityRoot
// so that we can keep everything together (not making more components)

const routes = [
  { path: "/", component: Home },
  { path: "/activity", component: ActivityRoot },
  { path: "/activitySelect", component: ContextActivitySelection },
  { path: "/activityNavigate", component: ActivityNavigate },
  { path: "/currentActivityActions", component: CurrentActivityActions },
  // getting more specific would map an action to a component + state - do we want this?
  { path: "/actionExecute", component: ActionExecute },
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

  // listen for actions dispatched via unix socket interface
  useEffect(() => {
    const listener = (command: string) => {
      // TOFIX: check command type in handleCommand
      switch (command) {
        case "globalLeader":
          setRoutePath("/");
          break;
        case "activityNavigate":
          setRoutePath("/activityNavigate");
          break;
        case "activitySelect":
          setRoutePath("/activitySelect");
          break;
        case "currentActivityAssignToParent": // set mode state with route?
        case "currentActivityCreateChildActivity": // or check the *route* via context
          setRoutePath("/currentActivityActions");
        case "actionExecute":
          setRoutePath("/actionExecute");
          break;
          break;
      }
    };

    registerActionListener(listener);

    return () => {
      unregisterActionListener(listener);
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
          handler: () => setRoutePath("/activitySelect"),
        },
        {
          sequence: [key("x")],
          description: "Actions Demo",
          name: "show-actions-demo",
          handler: () => setRoutePath("/actions"),
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
