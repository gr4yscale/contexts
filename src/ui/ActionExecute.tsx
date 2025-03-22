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
  currentActivityCreateSiblingActivityAction,
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
    currentActivityCreateSiblingActivityAction,
    currentActivityDestroyAction,
  ]);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <>
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
