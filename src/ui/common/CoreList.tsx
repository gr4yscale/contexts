import React, { useEffect, useContext, useState } from "react";
import { Text, Box } from "ink";
import { KeymapConfig, key } from "./Keymapping.mts";
import { KeysContext } from "./Context.mts";

export type Modes = "find" | "select";

interface CoreListProps {}

const CoreList: React.FC<CoreListProps> = ({}) => {
  const { keymap } = useContext(KeysContext);

  const [mode, setMode] = useState<Modes>("find");

  // shared keymap, persists regardless of mode
  useEffect(() => {
    keymap.pushKeymap([]);

    return () => {
      keymap.popKeymap();
    };
  }, []);

  // mode-specific keymap
  useEffect(() => {
    let keymapConfig: KeymapConfig = [];

    switch (mode) {
      case "find":
        keymapConfig = [
          {
            sequence: [key("\r", "return")],
            description: "Select mode",
            name: "mode-select",
            handler: () => {
              setMode("select");
            },
            hidden: true,
          },
          {
            sequence: [key("", "delete")],
            description: "Clear search string",
            name: "clearSearch",
            //handler: clearSearchString,
            hidden: true,
          },
          {
            sequence: [key("", "pageUp")],
            description: "Trim last character",
            name: "trimLast",
            //handler: trimLastCharacter,
            hidden: true,
          },
          {
            sequence: [key("[")],
            description: "Previous page",
            name: "prevPage",
            handler: () => {},
          },
          {
            sequence: [key("]")],
            description: "Next page",
            name: "nextPage",
            handler: () => {},
          },
        ];
        break;

      case "select":
        keymapConfig = [
          {
            sequence: [key("j")],
            description: "Move down",
            name: "moveDown",
            handler: () => {},
            //handler: handleHighlightDown,
          },
          {
            sequence: [key("k")],
            description: "Move up",
            name: "moveUp",
            handler: () => {},
            //handler: handleHighlightUp,
          },
          {
            sequence: [key(" ")],
            description: "Select items",
            name: "selectItems",
            handler: () => {},
            //handler: toggleSelectionAtHighlightedIndex,
            hidden: true,
          },
          {
            sequence: [key("", "delete")],
            description: "Back to find mode",
            name: "find mode",
            handler: () => {
              setMode("find");
            },
            hidden: true,
          },
          {
            sequence: [key("\r", "return")],
            description: "commit / select",
            name: "commit/select",
            handler: () => {},
            hidden: true,
          },
          {
            sequence: [key("[")],
            description: "Previous page",
            name: "prevPage",
            handler: () => {
              console.log("Executing prevPage handler");
            },
          },
          {
            sequence: [key("]")],
            description: "Next page",
            name: "nextPage",
            handler: () => {
              console.log("Executing nextPage handler");
            },
          },
        ];
        break;
    }

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [mode]);

  return (
    <Box flexDirection="column" width="100%" padding={1}>
      <Box>
        <Text color="gray" backgroundColor="black">
          TEST
        </Text>
      </Box>
    </Box>
  );
};

export default CoreList;
