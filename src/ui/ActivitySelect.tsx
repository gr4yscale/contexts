import React, { useEffect, useState } from "react";
import { Box } from "ink";
import { Activity } from "../types.mts";
import { handleCommand } from "../handleCommand.mts";
import SelectionList from "./common/SelectionList.tsx";

import activityDTO from "../models/activity.mts";

const { getActiveActivities } = await activityDTO();

interface Props {
  //   onActivitySelect?: (activities: ActivityDTO[]) => void;
}

const ActivitySelect: React.FC<Props> = ({}) => {
  const [items, setItems] = useState<
    Array<{ id: string; display: string; data: Activity }>
  >([]);

  useEffect(() => {
    const fetchActiveActivities = async () => {
      try {
        const activeActivities = await getActiveActivities();
        const newItems = activeActivities.map((activity) => ({
          id: activity.activityId,
          display: activity.name,
          data: activity,
        }));
        setItems(newItems);
      } catch (error) {
        console.error("Error fetching active activities:", error);
      }
    };

    fetchActiveActivities();
  }, []);

  return (
    <Box>
      <SelectionList
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

export default ActivitySelect;
