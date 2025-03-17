import React, { useContext, useEffect, useState } from "react";
import { Box, Spacer, Text } from "ink";
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
      height={5}
      borderStyle="single"
      borderTopColor="gray"
      borderLeft={false}
      borderRight={false}
      borderBottom={false}
      overflow={"hidden"}
      justifyContent="flex-end"
    >
      <Box
        flexDirection="column"
        height={3}
        justifyContent="flex-start"
        flexWrap="wrap"
      >
        {keyCommandPairs.map((item: string) => (
          <Box marginLeft={1} marginRight={2}>
            <Text key={item}>{item}</Text>
          </Box>
        ))}
      </Box>
      <Box
        flexDirection="row"
        height={2}
        borderStyle="single"
        borderTopColor="gray"
        borderLeft={false}
        borderRight={false}
        borderBottom={false}
        paddingLeft={1}
        paddingRight={1}
      >
        <Text>{lastActionExecuted}</Text>
        <Spacer />
        <Box marginLeft={2} marginRight={2}>
          <Text backgroundColor="white" color="black">
            {lastKeyPressed}
          </Text>
        </Box>
        <Text>{lastCommandExecuted}</Text>
        <Spacer />
        <Text>{currentActivity?.name || "None"}</Text>
      </Box>
    </Box>
  );
};

export default WhichKey;
