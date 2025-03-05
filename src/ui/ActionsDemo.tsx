import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";
import { Activity } from "../types.mts";
import { getCurrentActivity } from "../models/activity.mts";
import { KeysContext } from "./common/Context.mts";
import { key } from "./common/Keymapping.mts";
import { actions, ActionType, executeAction } from "../actions.mts";

const ActionsDemo: React.FC = () => {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  const { keymap }: any = useContext(KeysContext);

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

  // Filter actions by type
  const baseActions = Object.values(actions).filter(
    (action) => action.type === ActionType.BASE,
  );

  const currentActivityActions = Object.values(actions).filter(
    (action) => action.type === ActionType.CURRENT_ACTIVITY,
  );

  useEffect(() => {
    const actionKeymaps = [
      // Base actions with number keys
      ...baseActions.map((action, index) => ({
        sequence: [key(`${index + 1}`)],
        description: action.name,
        name: `execute-${action.id}`,
        handler: async () => {
          try {
            await executeAction(action.id);
          } catch (error) {
            console.error(`Error executing action ${action.id}:`, error);
          }
        },
      })),

      // Current activity actions with letter keys (if we have a current activity)
      ...(currentActivity
        ? currentActivityActions.map((action, index) => {
            const letterKey = String.fromCharCode(97 + index); // a, b, c, etc.
            return {
              sequence: [key(letterKey)],
              description: action.name,
              name: `execute-${action.id}`,
              handler: async () => {
                try {
                  await executeAction(action.id, currentActivity);
                } catch (error) {
                  console.error(`Error executing action ${action.id}:`, error);
                }
              },
            };
          })
        : []),
    ];

    keymap.pushKeymap(actionKeymaps);

    return () => {
      keymap.popKeymap();
    };
  }, [keymap, currentActivity]);

  return (
    <Box flexDirection="column">
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Box marginBottom={1}>
            <Text>Current Activity: {currentActivity?.name || "None"}</Text>
          </Box>

          <Box flexDirection="column" marginBottom={1}>
            <Text bold underline>
              Base Actions (press number keys)
            </Text>
            {baseActions.map((action, index) => (
              <Text key={action.id}>
                {index + 1}. {action.name}
              </Text>
            ))}
          </Box>

          <Box flexDirection="column">
            <Text bold underline>
              Current Activity Actions (press letter keys)
            </Text>
            {currentActivity ? (
              <>
                <Text>Current Activity: {currentActivity.name}</Text>
                {currentActivityActions.map((action, index) => {
                  const letterKey = String.fromCharCode(97 + index); // a, b, c, etc.
                  return (
                    <Text key={action.id}>
                      {letterKey}. {action.name}
                    </Text>
                  );
                })}
              </>
            ) : (
              <Text>
                No activity selected. Please select an activity first.
              </Text>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default ActionsDemo;
