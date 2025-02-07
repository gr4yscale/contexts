import React from "react";
import { Box } from "ink";
import { getState } from "../state.mts";
import { activitiesActive } from "../activityList.mts";
//import { Activity } from "../types.mts";
import Example from "./Example.tsx";
import { handleCommand } from "../handleCommand.mts";

interface Props {
  //   onActivitySelect?: (activities: Activity[]) => void;
}

const ActivitySearch: React.FC<Props> = ({}) => {
  const state = getState();
  const activeActivities = activitiesActive(state.activities);

  // Transform activities to match the Item interface
  const items = activeActivities.map((activity) => ({
    id: activity.activityId,
    display: activity.name,
    data: activity,
  }));

  return (
    <Box>
      <Example
        initialItems={items}
        callback={async (items) => {
          const activities = items.map((item) => item.data);
          const firstActivity = activities[0];
          if (firstActivity) {
            await handleCommand("activateActivity", firstActivity.activityId);
            // runAction("switchActivity", firstActivity.activityId);
          }
          //onActivitySelect?.(activities);
        }}
      />
    </Box>
  );
};

export default ActivitySearch;
