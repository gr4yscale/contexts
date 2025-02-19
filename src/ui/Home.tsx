import React, { useContext, useEffect, useState } from "react";
import { Box, Newline, Text } from "ink";
import { KeysContext } from "./common/Context.mts";

const Home: React.FC = () => {
  const { keymap }: any = useContext(KeysContext);

  useEffect(() => {}, []);

  return (
    <Box flexDirection="column">
      <Text>
        Workspaces
        <Newline />
        Activities
        <Newline />
      </Text>
    </Box>
  );
};

export default Home;
