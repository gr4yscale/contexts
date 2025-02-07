import React from "react";
import { useInput, Text, Box } from "ink";
import { Consumer } from "./Context.mts";

import useExample, {Item} from "./useExample.mts";

interface Props {
  callback?: () => void;
  navigate?: (path: any) => void;
}

const Example: React.FC<Props> = ({}) => {
  const initialItems = [
    { id: "1", display: "apple", data: "test" },
    { id: "2", display: "bogus", data: "test" },
    { id: "3", display: "trip", data: "test" },
    { id: "4", display: "ramp", data: "test" },
    { id: "5", display: "link", data: "test" },
    { id: "6", display: "something", data: "test" },
  ];

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

  useInput(async (input, key) => {
    switch (mode) {
      case "find": {
        if (key.leftArrow) {
          trimLastCharacter();
        } else if (key.rightArrow) {
          selectMode();
        } else if (key.return) {
          selectMode();
        } else if (key.delete) {
          clearSearchString();
        } else {
          filterBySearchString(input);
        }
        break;
      }
      case "select": {
        switch (input) {
          case "i":
            findMode();
            return;
          case "j":
            highlightDown();
            return;
          case "k":
            highlightUp();
            return;
          case " ":
            selectAtHighlightedIndex();
            return;
            // J, K - scroll faster
        }
        if (key.return) {
          commitMode();
        }
        break
      }
      case "commit": {
        switch (input) {
          case "y":
            // return a promise or callback for the selected items
            return;
          case "n":
            return;
        }
        break
      }
    }
  });

  return (
    <Consumer>
      {() => (
        <Box flexDirection="column">
          {getItems().map((i: Item) => (
            <Box key={i.id} paddingLeft={2}>
              <Text>{i.highlighted ? "> " : "  "}{i.selected ? "* " : "  "}{i.display}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Consumer>
  );
};

export default Example;
