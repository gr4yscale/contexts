import React from "react";
import { useInput, Box } from "ink";
import { getState } from "../state.mts";
import useRoutes from "./useRoutes.mts";
import SelectableList from "./SelectableList.tsx";
import { Hi, Test } from "./test.tsx";
import { Provider } from "./Context.mts";

// Menu 1 (wm navigation)
// list of contexts [select] -> list of activities, dwm workspaces

// Menu 2 (resources, actions)
// generate for global vs activity-specific

// modes
// render highlighted state different (bold?)
// render selected state different (bg color?)

// pass a callback into props to do something when selection is resolved

//const SelectableListExample: React.FC<{ state: State }> = ({ state }) => {

const routes = [
  // { path: "/", component: Root },
  { path: "/hi", component: Hi },
  { path: "/test", component: Test },
  { path: "/select", component: SelectableList },
];

const Root: React.FC = () => {
  const { Component, navigate, currentPath } = useRoutes(routes);

  //console.log(state.currentActivity.activityId);

  useInput(
    async (input, key) => {
      if (key.return) {
      }
      if (key.delete) {
      }
      switch (input) {
        // call handleCommand from some of these global keys
        // this still doesnt handle chording - what will be the idea?

        case "1": {
          console.log("route to a screen");
          navigate("/select");
          return;
        }
        case "2": {
          console.log("route to b screen");
          navigate("/hi");
          return;
        }
        case "3": {
          console.log("route to d screen");
          navigate("/test");
          return;
        }
        case "4": {
          console.log("route to p screen");
          navigate("/hi");
          return;
        }
        case "5": {
          console.log("route to l screen");
          navigate("/test");
          return;
        }
        default: {
          console.log("no routing anywhere");
        }
      }
    },
    { isActive: currentPath === "/" },
  );

  console.log(currentPath);

  return (
    <Provider value={{ state: getState() }}>
      <Box>{Component && <Component navigate={navigate} />}</Box>
    </Provider>
  );
};

export default Root;

//return <Router />;

// return (
//     <Box flexDirection="column">
//       {
//         // change top-level pages
//       }
//     </Box>
//   );
