import React, { useState } from "react";
import { Box, Text } from "ink";
import { useCurrentActivity } from "./common/useCurrentActivity.mts";

import QuickSelectList from "./common/QuickSelectList.tsx";

//           ^^ use with activities list

import {
  runFirefoxAction,
  runEmacsAction,
  runRangerAction,
} from "../actions/base.mts";
import {
  currentActivityRenameAction,
  currentActivityAssignToParentAction,
  currentActivityCreateChildActivityAction,
  currentActivityDestroyAction,
} from "../actions/currentActivity.mts";

import { Action, executeAction, ActionType } from "../actions.mts";
interface Props {
  keys?: string;
}

const ActionExecute: React.FC<Props> = ({ keys = "asdfghjkl;" }) => {
  const { currentActivity, loading } = useCurrentActivity();

  const [actions, setActions] = useState<Action[]>([
    runFirefoxAction,
    runEmacsAction,
    runRangerAction,
    currentActivityRenameAction,
    currentActivityAssignToParentAction,
    currentActivityCreateChildActivityAction,
    currentActivityDestroyAction,
  ]);


  return (
    <Box flexDirection="column">
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Box marginBottom={1}>
            <Text bold>Actions Execute</Text>
          </Box>
          <QuickSelectList
            keys={keys}
            onSelected={(action: Action) => {
              if (
                action.type === ActionType.CURRENT_ACTIVITY &&
                currentActivity
              ) {
                executeAction(action.id, currentActivity);
              } else {
                executeAction(action.id);
              }
            }}
            initialItems={actions.map((action) => ({
              id: action.id,
              display: action.name,
              ...action,
            }))}
          />
        </>
      )}
    </Box>
  );
};

export default ActionExecute;
