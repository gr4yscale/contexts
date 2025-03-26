import React, { useContext, useEffect, useState } from "react";
import { Box, Text } from "ink";
import { KeysContext } from "../common/Context.mts";
import { key } from "../common/Keymapping.mts";

interface KeymapExampleProps {
  onKeyPress?: (key: string) => void;
}

const ExampleComponent: React.FC<ExampleComponentProps> = ({ onKeyPress }) => {
  const [lastKeyPressed, setLastKeyPressed] = useState<string>("");
  const [counter, setCounter] = useState<number>(0);

  const { keymap } = useContext(KeysContext);

  // Simple functions to update counter
  const increment = () => {
    setCounter((prev) => prev + 1);
    setLastKeyPressed("a");
    onKeyPress?.("a");
  };

  const decrement = () => {
    setCounter((prev) => Math.max(0, prev - 1));
    setLastKeyPressed("d");
    onKeyPress?.("d");
  };

  const reset = () => {
    setCounter(0);
    setLastKeyPressed("r");
    onKeyPress?.("r");
  };

  const setToTen = () => {
    setCounter(10);
    setLastKeyPressed("gg");
    onKeyPress?.("gg");
  };

  useEffect(() => {
    // Define our keymap configuration
    keymap.pushKeymap([
      {
        sequence: [key("a")],
        description: "Increment counter",
        name: "increment",
        handler: increment,
      },
      {
        sequence: [key("d")],
        description: "Decrement counter",
        name: "decrement",
        handler: decrement,
      },
      {
        sequence: [key("r")],
        description: "Reset counter",
        name: "reset",
        handler: reset,
      },
      // Example of a multi-key sequence
      {
        sequence: [key("g"), key("g")],
        description: "Set counter to 10",
        name: "set-ten",
        handler: setToTen,
      },
    ]);

    // Clean up the keymap when component unmounts
    return () => {
      keymap.popKeymap();
    };
  }, [keymap, onKeyPress]);

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="single"
      borderColor="gray"
    >
      <Text bold>Keymap Example Component</Text>
      <Box marginTop={1}>
        <Text>Available commands:</Text>
        <Text color="green">[a]</Text>
        <Text> - increment counter</Text>
        <Text color="red">[d]</Text>
        <Text> - decrement counter</Text>
        <Text color="yellow">[r]</Text>
        <Text> - reset counter</Text>
        <Text color="cyan">[g][g]</Text>
        <Text> - set counter to 10</Text>
      </Box>
      <Box marginTop={1} borderStyle="single" padding={1}>
        <Text bold>Counter: {counter}</Text>
      </Box>
      <Box marginTop={1}>
        <Text>Last key pressed: {lastKeyPressed || "None"}</Text>
      </Box>
    </Box>
  );
};

export default ExampleComponent;
