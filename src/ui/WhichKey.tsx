import React, { useContext, useEffect, useState } from "react";
import { Box, Newline, Text } from "ink";
import { KeysContext } from "./common/Context.mts";
import { Keymap, KeyEvent } from "./common/Keymapping.mts";

const WhichKey: React.FC = () => {
  const { keymap }: any = useContext(KeysContext);

  const [lastKeyPressed, setLastKeyPressed] = useState("");
  const [lastCommandExecuted, setLastCommandExecuted] = useState("");
  const [keyCommandPairs, setKeyCommandPairs] = useState([]);

  useEffect(() => {
    keymap.registerListener(() => {
      const state = keymap.getCurrentState();

      const visible = state.keymap.filter((k: Keymap) => !k.hidden);

      const pairs = visible.map((e: Keymap) => {
        const keys = e.sequence.map((s: KeyEvent) => s.input);
        return `(${keys.join("-")}) ${e.description}`;
      });

      setKeyCommandPairs(pairs);
      setLastKeyPressed(state.lastKeyPressed);
      setLastCommandExecuted(state.lastCommandExecuted);
    });
  }, []);

  return (
    <Box flexDirection="column">
      <Text>
        ---------------------------------
        <Newline />
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
