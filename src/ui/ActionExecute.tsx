import React, { useState } from "react";
import { Box, Text } from "ink";
import { useCurrentActivity } from "./common/useCurrentActivity.mts";

import CoreList from "./common/CoreList.tsx";

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
  currentActivityCreateRootActivityAction,
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
    currentActivityCreateRootActivityAction,
    currentActivityDestroyAction,
  ]);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <CoreList
            items={actions.map((action) => ({
              id: action.id,
              display: action.name,
              ...action,
            }))}
            onSelected={(selectedItems) => {
              const action = selectedItems[0];
              if (
                action.type === ActionType.CURRENT_ACTIVITY &&
                currentActivity
              ) {
                executeAction(action.id, currentActivity);
              } else {
                executeAction(action.id);
              }
            }}
            initialMode="select"
          />
        </>
      )}
    </Box>
  );
};

export default ActionExecute;
