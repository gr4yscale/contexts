import React from "react";
import { useInput, Text, Box } from "ink";
import { Consumer } from "./Context.mts";

import useSelectableList from "./useSelectableList.mts";
import { activitiesActive } from "../activityList.mts";
import { Activity } from "../types.mts";

// modes
// render highlighted state different (bold?)
// render selected state different (bg color?)

// pass a callback into props to do something when selection is resolved

interface Props {
  callback?: () => void;
  navigate?: (path: any) => void;
}

const SelectableList: React.FC<Props> = ({ navigate }) => {
  const initialItems = ["apple", "banana", "cherry", "date", "elderberry"];

  const matchFn = (item: string, searchString: string): boolean =>
    item.toLowerCase().includes(searchString.toLowerCase());

  const {
    items,
    selectedIndices,
    searchString,
    highlightedIndex,
    //selectByIndex,
    filterBySearchString,
    clearSearchString,
    getSelectedItems,
    highlightDown,
    highlightUp,
    selectAtHighlightedIndex,
  } = useSelectableList({ initialItems });

  // tofix: all components will need this back check

  useInput(async (input, key) => {
    if (key.return) {
      // const items = await list.itemsForCurrentSearchString();

      // call back to give state or some other module the selected items
      // switchActivity, for example
      clearSearchString();
    }

    // TOFIX: just backspace, don't clear
    if (key.delete) {
      console.log("delete caught");
      if (navigate) {
        console.log("routing to /");
        navigate("/");
      }

      clearSearchString();
    }

    filterBySearchString(input, matchFn); //tofix: make it iterative
  });

  return (
    <Consumer>
      {({ state }) => (
        <Box flexDirection="column">
          <Box flexDirection="column">
            {state &&
              activitiesActive(state.activities).map((a: Activity) => (
                <Box key={a.activityId} paddingLeft={2}>
                  <Text>
                    {a.activityId} - {a.lastAccessed.toString()}
                  </Text>
                </Box>
              ))}
          </Box>
        </Box>
      )}
    </Consumer>
  );
};

export default SelectableList;

//<button onClick={clearSearchString}>Clear Search</button>

// <button onClick={highlightUp}>Highlight Up</button>
// <button onClick={highlightDown}>Highlight Down</button>
// <button onClick={selectAtHighlightedIndex}>Select Highlighted</button>

///<h2>Selected Items:</h2>
// <ul>
//   {getSelectedItems().map((item, index) => (
//     <li key={index}>{item}</li>
//   ))}
// </ul>

// <ul>
//   {items.map((item, index) => (
//     <li
//       key={index}
//       style={{
//         backgroundColor:
//           highlightedIndex === index ? "#e0e0e0" : "transparent",
//         fontWeight: selectedIndices.has(index) ? "bold" : "normal",
//       }}
//     >
//       {item}
//     </li>
//   ))}
// </ul>

// <input
//         type="text"
//         placeholder="Search..."
//         value={searchString}
//         onChange={(e) => filterBySearchString(e.target.value, matchFn)}
//       />
