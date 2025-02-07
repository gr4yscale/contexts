import React from "react";
import { useInput, Text, Box } from "ink";
import { Consumer } from "./Context.mts";

import useExample, { Item } from "./useExample.mts";

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

  useInput(async (input, key) => {
    switch (mode) {
      case "find": {
        if (key.leftArrow) {
          // console.log
        } else if (key.rightArrow) {
          trimLastCharacter();
        } else if (key.return) {
          selectMode();
          selectAtHighlightedIndex();
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
        if (key.leftArrow) {
          findMode();
          return;
        } else if (key.return) {
          commitMode();
        }
        break;
      }
      case "commit": {
        switch (input) {
          case "y":
            if (callback) {
              callback(getSelectedItems());
            }
            return;
          case "n":
            return;
        }
        break;
      }
    }
    if (key.leftArrow) {
      selectMode();
      return;
    } else if (key.return) {
      //
    }
  });

  return (
    <Consumer>
      {() => (
        <Box flexDirection="column">
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
      )}
    </Consumer>
  );
};

export default Example;
