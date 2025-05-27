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

import NodeCreate from "../NodeCreate.tsx";
import NodeNavigate from "../NodeNavigate.tsx";
import ContextNodeSelection from "../ContextNodeSelection.tsx";
import ActionExecute from "../ActionExecute.tsx";
import CurrentNodeAssignToParent from "../CurrentNodeAssignToParent.tsx";
import CurrentNodeCreateChild from "../CurrentNodeCreateChild.tsx";
import CurrentNodeRename from "../CurrentNodeRename.tsx";
import CurrentNodeDelete from "../CurrentNodeDelete.tsx";
import NodesPrune from "../NodesPrune.tsx";
import Testbed from "../Testbed.tsx";
import ResourceNavigate from "../ResourceNavigate.tsx";
import ExaSearch from "../ExaSearch.tsx"; // New import

// consider adding props here that would set initial state of NodeRoot
// so that we can keep everything together (not making more components)

const routes = [
  { path: "/dummy", component: Box },
  { path: "/", component: NodeNavigate },
  { path: "/activityCreate", component: NodeCreate },
  { path: "/activityNavigate", component: NodeNavigate },
  { path: "/resourceNavigate", component: ResourceNavigate },
  { path: "/contextNodeSelect", component: ContextNodeSelection },
  { path: "/actionExecute", component: ActionExecute },
  {
    path: "/currentNodeAssignToParent",
    component: CurrentNodeAssignToParent,
  },
  {
    path: "/currentNodeCreateChild",
    component: CurrentNodeCreateChild,
  },
  { path: "/currentNodeRename", component: CurrentNodeRename },
  { path: "/currentNodeDelete", component: CurrentNodeDelete },
  { path: "/activitiesPrune", component: NodesPrune },
  { path: "/testbed", component: Testbed },
  { path: "/exaSearch", component: ExaSearch }, // New route
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
        case "resourceNavigate":
          setRoutePath("/resourceNavigate");
          break;
        case "activateNode":
          setRoutePath("/dummy"); // hack to force a re-render
          setRoutePath("/activityNavigate");
          break;
        case "contextNodeSelect":
          setRoutePath("/contextNodeSelect");
          break;
        case "actionExecute":
          setRoutePath("/actionExecute");
          break;
        case "currentNodeAssignToParent":
          setRoutePath("/currentNodeAssignToParent");
          break;
        case "currentNodeCreateChild":
          setRoutePath("/currentNodeCreateChild");
          break;
        case "currentNodeRename":
          setRoutePath("/currentNodeRename");
          break;
        case "currentNodeDelete":
          setRoutePath("/currentNodeDelete");
          break;
        case "activitiesPrune":
          setRoutePath("/activitiesPrune");
          break;
        case "testbed":
          setRoutePath("/testbed");
          break;
        case "exaSearchNavigate": // Action to navigate to the Exa search UI
          setRoutePath("/exaSearch");
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
