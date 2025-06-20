import React, { useState } from "react";
import { Box, Text } from "ink";
import { useCurrentNode } from "./common/useCurrentNode.mts";

import CoreList from "./common/CoreList.tsx";

import {
  runFirefoxAction,
  runEmacsAction,
  runRangerAction,
} from "../actions/base.mts";

import {
  currentNodeRenameAction,
  currentNodeAssignToParentAction,
  currentNodeCreateChildNodeAction,
  currentNodeCreateSiblingNodeAction,
  currentNodeCreateRootNodeAction,
  currentNodeDestroyAction,
} from "../actions/currentNode.mts";

import {
  navigateExaSearch,
  navigateCurrentNodeBrowserState,
  navigateResourceNavigate,
} from "../actions/navigation.mts";

import { nodesPrune } from "../actions/node-bulk.mts";

import {
  voiceCommandsToggleAction,
  voiceCommandsHelpAction,
} from "../actions/voice.mts";

import { Action, executeAction, ActionType } from "../actions.mts";

interface Props {
  keys?: string;
}

const ActionExecute: React.FC<Props> = ({ keys = "asdfghjkl;" }) => {
  const { currentNode, loading } = useCurrentNode();

  const [actions, setActions] = useState<Action[]>([
    navigateResourceNavigate,
    navigateExaSearch,
    navigateCurrentNodeBrowserState,
    nodesPrune,
    runFirefoxAction,
    runEmacsAction,
    runRangerAction,
    currentNodeRenameAction,
    currentNodeAssignToParentAction,
    currentNodeCreateChildNodeAction,
    currentNodeCreateSiblingNodeAction,
    currentNodeCreateRootNodeAction,
    currentNodeDestroyAction,
    voiceCommandsToggleAction,
    voiceCommandsHelpAction,
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
              if (action.type === ActionType.CURRENT_NODE && currentNode) {
                executeAction(action.id, currentNode);
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
