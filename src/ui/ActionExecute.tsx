import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";

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
import { getCurrentActivity } from "../models/activity.mts";
import { Activity } from "../types.mts";

interface Props {
  keys?: string;
}

const ActionExecute: React.FC<Props> = ({ keys = "asdfghjkl;" }) => {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  const [actions, setActions] = useState<Action[]>([
    runFirefoxAction,
    runEmacsAction,
    runRangerAction,
    currentActivityRenameAction,
    currentActivityAssignToParentAction,
    currentActivityCreateChildActivityAction,
    currentActivityDestroyAction,
  ]);

  const fetchCurrentActivity = async () => {
    try {
      const activity = await getCurrentActivity();
      setCurrentActivity(activity);
    } catch (error) {
      console.error("Error fetching current activity:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentActivity();
  }, []);

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
