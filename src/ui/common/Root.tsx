import React from "react";
import { Box } from "ink";
import { getState } from "../../state.mts";
import useRoutes from "./useRoutes.mts";
import { Provider } from "./Context.mts";

import ActivitySelect from "../ActivitySelect.tsx";

const routes = [
  { path: "/", component: ActivitySelect },
  { path: "/activities", component: ActivitySelect },
];

const Root: React.FC = () => {
  const { Component, navigate, currentPath } = useRoutes(routes);

  // useInput(
  //   async (input, _) => {
  //     switch (input) {
  //       case "1": {
  //         console.log("route to activities screen");
  //         navigate("/");
  //         return;
  //       }
  //       case "2": {
  //         console.log("route to hi screen");
  //         navigate("/hi");
  //         return;
  //       }
  //       case "3": {
  //         console.log("route to test screen");
  //         navigate("/test");
  //         return;
  //       }
  //       default: {
  //         console.log("no routing anywhere");
  //       }
  //     }
  //   },
  //   { isActive: currentPath !== "/" },
  // );

  //console.log(currentPath);

  return (
    <Provider value={{ state: getState() }}>
      <Box>{Component && <Component navigate={navigate} />}</Box>
    </Provider>
  );
};

export default Root;
