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
  const { keymap } = useContext(KeysContext);
  const { currentActivity, fetchCurrentActivity } = useCurrentActivity();

  const [lastKeyPressed, setLastKeyPressed] = useState("");
  const [lastCommandExecuted, setLastCommandExecuted] = useState("");
  const [lastActionExecuted, setLastActionExecuted] = useState("");
  const [keyCommandPairs, setKeyCommandPairs] = useState([]);

  useEffect(() => {
    keymap.registerListener(() => {
      const state = keymap.getCurrentState();

      const visible = state.keymap.filter((k) => !k.hidden);

      const pairs = visible.map((e) => {
        const keys = e.sequence.map((s) => s.input);
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
      borderStyle="single"
      borderTopColor="gray"
      borderLeft={false}
      borderRight={false}
      borderBottom={false}
      overflow={"hidden"}
      justifyContent="flex-end"
    >
      <Box
        flexDirection="row"
        borderStyle="single"
        borderBottomColor="gray"
        borderLeft={false}
        borderRight={false}
        borderTop={false}
        paddingLeft={1}
        paddingRight={1}
      >
        <Text color="magenta">{lastActionExecuted}</Text>
        <Spacer />
        <Box marginLeft={2} marginRight={2}>
          <Text backgroundColor="white" color="black">
            {lastKeyPressed}
          </Text>
        </Box>
        <Text color="magenta">{lastCommandExecuted}</Text>
        <Spacer />
        <Text color="cyan">{currentActivity?.name || "None"}</Text>
      </Box>
      <Box
        flexDirection="row"
        justifyContent="flex-start"
        flexWrap="wrap"
        flexShrink={1}
      >
        {keyCommandPairs.map((item) => (
          <Box key={item} marginLeft={1} marginRight={2}>
            <Text color="blackBright">{item}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default WhichKey;
