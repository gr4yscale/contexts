import React, { useState, useEffect } from "react";
import { Box, useInput, useStdout } from "ink";
import { KeysContext } from "./Context.mts";
import * as logger from "../../logger.mts";

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
import ActivitiesPrune from "../ActivitiesPrune.tsx";
import Testbed from "../Testbed.tsx";

// consider adding props here that would set initial state of ActivityRoot
// so that we can keep everything together (not making more components)

const routes = [
  { path: "/dummy", component: Box },
  { path: "/", component: ActivityNavigate },
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
  { path: "/activitiesPrune", component: ActivitiesPrune },
  { path: "/testbed", component: Testbed },
];

// define root keymap
const keymap = Keymap([]);

const Root: React.FC = () => {
  const [routePath, setRoutePath] = useState("/");
  const [columns, rows] = useStdoutDimensions();

  // global key handling
  useInput((input, key) => {
    const result = keymap.handleKeyEvent(input, key);
    if (result) {
      if (result.handler) {
        logger.debug(`Handling key event: ${input}`);
        result.handler();
      }
    } else {
      // unhandled key event
      logger.debug(`Unhandled key event: ${input}`);
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
        case "activateActivity":
          setRoutePath("/dummy"); // hack to force a re-render
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
        case "activitiesPrune":
          setRoutePath("/activitiesPrune");
          break;
        case "testbed":
          setRoutePath("/testbed");
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
      width={columns - 2}
      height={rows - 1}
      overflow="hidden"
      margin={1}
    >
      <KeysContext.Provider value={{ keymap }}>
        <Box
          flexDirection="column"
          alignSelf="center"
          justifyContent="center"
          flexGrow={1}
          width={150}
          paddingLeft={22}
          paddingRight={22}
        >
          {
            Component && <Component />
            // <Component {...params } />
          }
        </Box>
        <WhichKey />
      </KeysContext.Provider>
    </Box>
  );
};

export default Root;

//https://github.com/vadimdemedes/ink/issues/263#issuecomment-765106184
//https://github.com/vadimdemedes/ink/issues/263#issuecomment-1030379127

const useStdoutDimensions = (): [number, number] => {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState<[number, number]>([
    stdout.columns,
    stdout.rows,
  ]);

  useEffect(() => {
    const handler = () => setDimensions([stdout.columns, stdout.rows]);
    stdout.on("resize", handler);
    return () => {
      stdout.off("resize", handler);
    };
  }, [stdout]);

  return dimensions;
};
