import React from "react";
import useRoutes from "./useRoutes.mts";
import { Text, Box } from "ink";

const routes = [
  { path: "/", component: Home },
  { path: "/about", component: About },
  { path: "/contact", component: Contact },
];

const Router = () => {
  const { Component } = useRoutes(routes);
  return <Box>{Component && <Component />}</Box>;
};

export default Router;
