import React, { useContext, useEffect, useState } from "react";
import { Box, Newline, Text } from "ink";
import { KeysContext } from "./common/Context.mts";

const WhichKey: React.FC = () => {
  const { keymap }: any = useContext(KeysContext);

  const [lastKeyPressed, setLastKeyPressed] = useState("");
  const [lastCommandExecuted, setLastCommandExecuted] = useState("");
  const [keyCommandPairs, setKeyCommandPairs] = useState([]);

  useEffect(() => {
    keymap.registerListener(() => {
      const state = keymap.getCurrentState();
      setLastKeyPressed(state.lastKeyPressed);
      setLastCommandExecuted(state.lastCommandExecuted);
      setKeyCommandPairs(state.keymap.map((e: any) => e.description ?? ""));
    });
  }, []);

  return (
    <Box flexDirection="column">
      <Text>
        last key: {lastKeyPressed}
        <Newline />
        last cmd: {lastCommandExecuted}
        <Newline />
        ---------------------------------
        <Newline />
      </Text>
      {keyCommandPairs.map((item: string) => (
        <Text key={item}>
          {item}
          <Newline />
        </Text>
      ))}
    </Box>
  );
};

export default WhichKey;
