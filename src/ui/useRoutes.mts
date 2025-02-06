import { useState, useEffect } from "react";

const useRoutes = (routes) => {
  const [currentPath, setCurrentPath] = useState("/");

  const navigate = (path) => {
    if (path !== currentPath) {
      setCurrentPath(path);
    }
  };

  const route = routes.find((route) => route.path === currentPath);
  const Component = route ? route.component : null;

  return { Component, navigate, currentPath };
};

export default useRoutes;
