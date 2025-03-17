import React, { useContext, useEffect, useState } from "react";
import { Box, Newline, Spacer, Text } from "ink";
import { KeysContext } from "./common/Context.mts";
import { Keymap, KeyEvent } from "./common/Keymapping.mts";
import { useCurrentActivity } from "./common/useCurrentActivity.mts";
import {
  registerActionListener,
  unregisterActionListener,
} from "../actions.mts";

const WhichKey: React.FC = () => {
  const { keymap }: any = useContext(KeysContext);
  const { currentActivity, fetchCurrentActivity } = useCurrentActivity();

  const [lastKeyPressed, setLastKeyPressed] = useState("");
  const [lastCommandExecuted, setLastCommandExecuted] = useState("");
  const [lastActionExecuted, setLastActionExecuted] = useState("");
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

  // listen for actions executed
  useEffect(() => {
    const listener = (action: string) => {
      setLastActionExecuted(action);
      fetchCurrentActivity();
    };

    registerActionListener(listener);

    return () => {
      unregisterActionListener(listener);
    };
  }, []);

  return (
    <Box
      flexDirection="column"
      height={"20%"}
      borderStyle="single"
      borderTopColor="white"
      borderLeft={false}
      borderRight={false}
      borderBottom={false}
      overflow={"hidden"}
    >
      <Box
        flexDirection="row"
        height={4}
        borderStyle="single"
        borderColor="green"
        justifyContent="space-evenly"
      >
        <Text>{currentActivity?.name || "None"}</Text>
        <Spacer />
        <Text backgroundColor="white" color="black">
          {lastKeyPressed}{" "}
        </Text>
        <Text>{lastCommandExecuted}</Text>
        <Spacer />
        <Text>{lastActionExecuted}</Text>
      </Box>

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
