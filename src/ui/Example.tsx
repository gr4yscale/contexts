import React from "react";
import { Text, Box } from "ink";
import { Consumer } from "./Context.mts";
import useExample, { Item } from "./useExample.mts";
import { KeyMapConfig, key } from "./useKeyMap.ts";
import { InteractiveComponent } from "./InteractiveComponent.tsx";

interface Props {
  initialItems: Item[];
  callback?: (selectedItems: Item[]) => void;
  navigate?: (path: any) => void;
}

const Example: React.FC<Props> = ({ initialItems, callback }) => {
  const {
    mode,
    getItems,
    getSelectedItems,
    selectMode,
    findMode,
    commitMode,
    filterBySearchString,
    trimLastCharacter,
    clearSearchString,
    selectAtHighlightedIndex,
    highlightDown,
    highlightUp,
  } = useExample<Item>({
    initialItems,
  });

  // adding multiple keymaps (for global / shared vs submenu)
  // move the keymap definitions in Example.tsx to exampleKeymaps.tsx
  // make a "perform actions on current activity" menu; review handleCommand

  let keymapConfig: KeyMapConfig = [];

  switch (mode) {
    case "select":
      keymapConfig = [
        {
          sequence: [key("x")],
          description: "Select item",
          command: {
            name: "selectItems",
            handler: selectAtHighlightedIndex,
          },
        },
        {
          sequence: [key("j")],
          description: "Move down",
          command: {
            name: "moveDown",
            handler: highlightDown,
          },
        },
        {
          sequence: [key("k")],
          description: "Move up",
          command: {
            name: "moveUp",
            handler: highlightUp,
          },
        },
        {
          sequence: [key(" ")],
          description: "Select items",
          command: {
            name: "selectItems",
            handler: selectAtHighlightedIndex,
          },
        },
        {
          sequence: [key("\r", "return")],
          description: "Enter commit mode or return items",
          command: {
            name: "commit",
            handler: commitMode,
          },
        },
      ];
      break;

    case "commit":
      keymapConfig = [
        {
          sequence: [key("y")],
          description: "Yes",
          command: {
            name: "yes",
            handler: () => {
              callback && callback(getSelectedItems());
            },
          },
        },
        {
          sequence: [key("n")],
          description: "No",
          command: {
            name: "no",
            handler: () => {},
          },
        },
      ];
      break;
  }

  const sharedKeymapConfig: KeyMapConfig = [
    {
      sequence: [key("", "rightArrow")],
      description: "Enter select mode",
      command: { name: "selectMode", handler: selectMode },
    },
    {
      sequence: [key("", "leftArrow")],
      description: "Enter find mode",
      command: { name: "findMode", handler: findMode },
    },
  ];

  const keymaps = [...sharedKeymapConfig, ...keymapConfig];

  return (
    <Consumer>
      {() => (
        <InteractiveComponent
          keyMapConfig={keymaps}
          onUnhandledInput={(input, key) => {
            // TOFIX: create a keymap for find mode, checking for return, delete, and pageUp keys. Leave the filterBySearch in onUnhandledInput.
            if (mode === "find") {
              if (key.return) {
                selectMode();
              } else if (key.delete) {
                clearSearchString();
              } else if (key.pageUp) {
                trimLastCharacter();
              } else {
                filterBySearchString(input);
              }
            }
          }}
        >
          <Box flexDirection="column">
            <Text>Mode: {mode}</Text>
            {getItems().map((i: Item) => (
              <Box key={i.id} paddingLeft={2}>
                <Text>
                  {i.highlighted && mode === "select" ? "> " : "  "}
                  {i.selected ? "* " : "  "}
                  {i.display}
                </Text>
              </Box>
            ))}
          </Box>
        </InteractiveComponent>
      )}
    </Consumer>
  );
};

export default Example;
