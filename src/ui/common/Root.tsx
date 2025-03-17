import React, { useState, useEffect } from "react";
import { Box, useInput } from "ink";
import { KeysContext } from "./Context.mts";

import { Keymap } from "./Keymapping.mts";

import {
  registerActionListener,
  unregisterActionListener,
} from "../../actions.mts";

import WhichKey from "../WhichKey.tsx";

import ActivityCreate from "../ActivityCreate.tsx";
import ActivityNavigate from "../ActivityNavigate.tsx";
import ContextActivitySelection from "../ContextActivitySelection.tsx";
import ActionExecute from "../ActionExecute.tsx";
import CurrentActivityAssignToParent from "../CurrentActivityAssignToParent.tsx";
import CurrentActivityCreateChild from "../CurrentActivityCreateChild.tsx";
import CurrentActivityRename from "../CurrentActivityRename.tsx";
import CurrentActivityDelete from "../CurrentActivityDelete.tsx";

// consider adding props here that would set initial state of ActivityRoot
// so that we can keep everything together (not making more components)

const routes = [
  { path: "/", component: ActivityNavigate},
  { path: "/activityCreate", component: ActivityCreate },
  { path: "/activityNavigate", component: ActivityNavigate },
  { path: "/contextActivitySelect", component: ContextActivitySelection },
  { path: "/actionExecute", component: ActionExecute },
  {
    path: "/currentActivityAssignToParent",
    component: CurrentActivityAssignToParent,
  },
  {
    path: "/currentActivityCreateChild",
    component: CurrentActivityCreateChild,
  },
  { path: "/currentActivityRename", component: CurrentActivityRename },
  { path: "/currentActivityDelete", component: CurrentActivityDelete },
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
        case "contextActivitySelect":
          setRoutePath("/contextActivitySelect");
          break;
        case "actionExecute":
          setRoutePath("/actionExecute");
          break;
        case "currentActivityAssignToParent":
          setRoutePath("/currentActivityAssignToParent");
          break;
        case "currentActivityCreateChild":
          setRoutePath("/currentActivityCreateChild");
          break;
        case "currentActivityRename":
          setRoutePath("/currentActivityRename");
          break;
        case "currentActivityDelete":
          setRoutePath("/currentActivityDelete");
          break;
      }
    };

    registerActionListener(listener);

    return () => {
      unregisterActionListener(listener);
    };
  }, []);

  const route = routes.find((r) => r.path === routePath);
  const Component = route ? route?.component : null;

  return (
    <Box
      flexDirection="column"
      width={187}
      height={54}
      overflow="hidden"
      borderStyle="single"
      borderColor="gray"
      margin={0}
    >
      <KeysContext.Provider value={{ keymap }}>
        <Box
          alignSelf="center"
          justifyContent="space-around"
          flexGrow={1}
          width={150}
          paddingTop={3}
          paddingLeft={18}
          paddingRight={18}
        >
          {Component && <Component />}
        </Box>
        <WhichKey />
      </KeysContext.Provider>
    </Box>
  );
};

export default Root;
